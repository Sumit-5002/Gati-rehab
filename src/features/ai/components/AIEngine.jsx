// AIEngine Component - Core AI/Camera View
// Handles MediaPipe Pose Landmark detection and real-time pose tracking
// Owner: Sumit Prasad

import { useEffect, useRef, useState, memo } from 'react';
import Webcam from 'react-webcam';
import { Camera, Video, VideoOff, AlertCircle } from 'lucide-react';
import { calculateAngles } from '../utils/angleCalculations';
import { generateRealTimeFeedback, playAudioCue, speakFeedback } from '../utils/realTimeFeedback';
import { AVAILABLE_EXERCISES } from '../utils/secondaryExercises';

// Separate FPS counter component to minimize re-renders
const FPSDisplay = memo(({ fps }) => (
  <span className="text-xs text-slate-400">
    FPS: {fps}
  </span>
));

const AIEngine = memo(({ onPoseDetected, exerciseType, onFeedbackUpdate, onStatusChange, repCount, settings = {} }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);
  const poseDetectorRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const lastVideoTimeRef = useRef(-1);
  const lastTimestampRef = useRef(0);
  const frameCountRef = useRef(0);
  const previousAnglesRef = useRef({});
  const lastFeedbackTimeRef = useRef(0);
  const lastFeedbackMessageRef = useRef('');
  const lastOptimalTimeRef = useRef(Date.now());
  const watchdogTriggeredRef = useRef(false);

  // Use refs for callbacks to avoid re-triggering the effect loop
  const onPoseDetectedRef = useRef(onPoseDetected);
  const onFeedbackUpdateRef = useRef(onFeedbackUpdate);

  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
  }, [onPoseDetected]);

  useEffect(() => {
    onFeedbackUpdateRef.current = onFeedbackUpdate;
  }, [onFeedbackUpdate]);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    const loadModel = async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        poseDetectorRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        setIsModelLoaded(true);
        if (onStatusChange) onStatusChange({ isLoaded: true, error: null });
        console.log('[AIEngine] MediaPipe Pose model loaded successfully');
      } catch (err) {
        console.error('[AIEngine] Error loading model:', err);
        setError('Failed to load AI model. Please refresh the page.');
        if (onStatusChange) onStatusChange({ isLoaded: false, error: 'Failed to load AI model' });
      }
    };

    loadModel();

    return () => {
      if (poseDetectorRef.current) {
        poseDetectorRef.current.close();
      }
    };
  }, []);

  // Prediction loop for continuous pose detection
  useEffect(() => {
    let animationFrameId;

    const detectPose = async () => {
      if (
        !isCameraActive ||
        !isModelLoaded ||
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4
      ) {
        animationFrameId = requestAnimationFrame(detectPose);
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;

      // Skip processing if the video frame hasn't changed
      if (video.currentTime === lastVideoTimeRef.current) {
        animationFrameId = requestAnimationFrame(detectPose);
        return;
      }
      lastVideoTimeRef.current = video.currentTime;

      if (canvas) {
        // Only set dimensions if they changed to avoid clearing the canvas and triggering reflows
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      }

      try {
        // Ensure strictly monotonically increasing timestamps for MediaPipe
        let timestamp = performance.now();
        if (timestamp <= lastTimestampRef.current) {
          timestamp = lastTimestampRef.current + 1;
        }
        lastTimestampRef.current = timestamp;

        const results = poseDetectorRef.current.detectForVideo(video, timestamp);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          const keypoints = landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
            visibility: landmark.visibility,
          }));

          const angles = calculateAngles(keypoints);

          if (angles) {
            const feedback = generateRealTimeFeedback(angles, exerciseType, keypoints);

            // Handle Voice and Audio Feedback
            const now = Date.now();
            if (feedback.severity !== 'success') {
              // Trigger watchdog if in non-optimal position for > 4 seconds
              if (now - lastOptimalTimeRef.current > 4000) {
                if (!watchdogTriggeredRef.current || now - lastFeedbackTimeRef.current > 6000) {
                  if (settings.audioCues !== false) {
                    speakFeedback(feedback.message); // Say exactly what's wrong (visibility or form)
                    playAudioCue('error');
                  }
                  lastFeedbackTimeRef.current = now;
                  watchdogTriggeredRef.current = true;
                }
              } else {
                // Regular feedback beeps/speech (throttled)
                if (now - lastFeedbackTimeRef.current > 3500 && feedback.message !== lastFeedbackMessageRef.current) {
                  if (feedback.severity === 'error') {
                    if (settings.audioCues !== false) {
                      speakFeedback(feedback.message);
                      playAudioCue('warning');
                    }
                  }
                  lastFeedbackTimeRef.current = now;
                  lastFeedbackMessageRef.current = feedback.message;
                }
              }
            } else {
              // In optimal position
              lastOptimalTimeRef.current = now;
              if (watchdogTriggeredRef.current) {
                if (settings.audioCues !== false) {
                  speakFeedback("Great adjustment! Form is perfect now.");
                }
                watchdogTriggeredRef.current = false;
              }
            }

            if (onPoseDetectedRef.current) {
              onPoseDetectedRef.current({
                keypoints,
                angles,
                feedback,
                timestamp: Date.now(),
              });
            }

            if (onFeedbackUpdateRef.current) {
              onFeedbackUpdateRef.current(feedback);
            }

            previousAnglesRef.current = angles;
          }

          drawLandmarks(keypoints, canvas);

          frameCountRef.current++;
          const now = performance.now();
          if (now - lastFrameTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFrameTimeRef.current = now;
          }
        }
      } catch (err) {
        console.error('[AIEngine] Detection error:', err);
      }

      animationFrameId = requestAnimationFrame(detectPose);
    };

    if (isCameraActive && isModelLoaded) {
      detectPose();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCameraActive, isModelLoaded, exerciseType]);

  // Draw pose landmarks on canvas
  const drawLandmarks = (keypoints, canvas) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Define connections between keypoints (pose skeleton)
    const connections = [
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 12], // Shoulders
      [11, 23], [12, 24], // Torso
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
      [27, 29], [29, 31], // Left foot
      [28, 30], [30, 32], // Right foot
    ];

    // Draw connections - Batched stroke for performance
    if (settings.motionFeedback !== false) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      connections.forEach(([start, end]) => {
        const p1 = keypoints[start];
        const p2 = keypoints[end];

        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
        }
      });
      ctx.stroke();

      // Draw keypoints - Batched fill for performance
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      keypoints.forEach((keypoint) => {
        if (keypoint.visibility > 0.5) {
          const x = keypoint.x * width;
          const y = keypoint.y * height;
          ctx.moveTo(x + 5, y);
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
        }
      });
      ctx.fill();
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col min-h-0">
      {/* Camera Status */}
      <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-5 h-5 text-blue-400" />
          </div>
          {isCameraActive && (
            <FPSDisplay fps={fps} />
          )}
          {Number.isFinite(repCount) && (
            <span className="text-xs font-black text-white bg-blue-600 px-3 py-1 rounded-lg shadow-lg shadow-blue-900/40">
              REPS: {repCount}
            </span>
          )}
        </div>
        <button
          onClick={toggleCamera}
          className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${isCameraActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          disabled={!isModelLoaded}
        >
          {isCameraActive ? (
            <>
              <VideoOff className="w-4 h-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Start Camera
            </>
          )}
        </button>
      </div>

      {/* Camera View */}
      <div className="relative bg-slate-900 rounded-lg overflow-hidden shadow-xl flex-1 min-h-0">
        {isCameraActive ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              className="w-full h-full object-cover"
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'user',
                width: 1280,
                height: 720,
              }}
            />
            {/* Canvas overlay for drawing pose landmarks */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </>
        ) : (
          <div className="h-full min-h-0 sm:min-h-[200px] flex items-center justify-center bg-slate-800">
            <div className="text-center text-slate-200">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Camera is off</p>
              <p className="text-sm text-slate-400 mt-2">
                Click "Start Camera" to begin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rose-200">Error:</p>
            <p className="text-sm text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {/* Exercise Info */}
      {exerciseType && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs sm:text-sm font-medium text-blue-100 uppercase tracking-widest">
            Exercise: <span className="font-black text-white">{AVAILABLE_EXERCISES[exerciseType]?.name || String(exerciseType).replace(/-/g, ' ')}</span>
          </p>
        </div>
      )}
    </div>
  );
});

export default AIEngine;
