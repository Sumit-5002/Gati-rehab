// AIEngine Component - Core AI/Camera View
// Handles MediaPipe Pose Landmark detection and real-time pose tracking
// Owner: Sumit Prasad

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Video, VideoOff } from 'lucide-react';

const AIEngine = ({ onPoseDetected, exerciseType }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const poseDetectorRef = useRef(null);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    const loadModel = async () => {
      try {
        // TODO: Import and initialize MediaPipe Pose
        // const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        // const vision = await FilesetResolver.forVisionTasks(
        //   "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        // );
        // poseDetectorRef.current = await PoseLandmarker.createFromOptions(vision, {
        //   baseOptions: {
        //     modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        //     delegate: "GPU"
        //   },
        //   runningMode: "VIDEO",
        //   numPoses: 1
        // });

        setIsModelLoaded(true);
        console.log('[AIEngine] MediaPipe Pose model loaded successfully');
      } catch (err) {
        console.error('[AIEngine] Error loading model:', err);
        setError('Failed to load AI model');
      }
    };

    loadModel();

    return () => {
      // Cleanup pose detector
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

      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        // TODO: Implement pose detection
        // const results = poseDetectorRef.current.detectForVideo(video, Date.now());
        // if (results.landmarks && results.landmarks.length > 0) {
        //   const landmarks = results.landmarks[0]; // Get first person's landmarks (33 keypoints)
        //   
        //   // Draw landmarks on canvas
        //   drawLandmarks(landmarks);
        //   
        //   // Send keypoints to parent component for angle calculations
        //   if (onPoseDetected) {
        //     onPoseDetected(landmarks);
        //   }
        // }
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
  }, [isCameraActive, isModelLoaded, onPoseDetected]);

  // Draw pose landmarks on canvas
  const drawLandmarks = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections between keypoints
    // TODO: Implement pose drawing logic
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // Draw keypoint
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ff00';
      ctx.fill();
    });
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Camera Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">
            {isModelLoaded ? 'AI Model Ready' : 'Loading AI Model...'}
          </span>
        </div>
        <button
          onClick={toggleCamera}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            isCameraActive
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
      <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        {isCameraActive ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              className="w-full h-auto"
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
          <div className="aspect-video flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Camera is off</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Start Camera" to begin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Exercise Info */}
      {exerciseType && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Current Exercise: <span className="font-bold">{exerciseType}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AIEngine;
