import { useEffect, useRef, useState, memo } from 'react';
import { Play, Pause, RotateCcw, Info, Activity, ShieldCheck } from 'lucide-react';

/**
 * High-Performance Anatomical Visualization Engine
 * Simulates exercise movements using smooth kinematic interpolation
 */
const ExerciseDemo = memo(({ exerciseId, isCompact = false }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [phaseText, setPhaseText] = useState('Reference Guide');
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const animate = () => {
            if (!isPlaying) return;

            // Clear and draw background
            ctx.clearRect(0, 0, width, height);
            drawMedicalGrid(ctx, width, height);

            // Draw Anatomical Skeleton
            drawPose(ctx, width, height, frameRef.current, exerciseId);

            // Update Phase Text (Only if changed to avoid redundant renders)
            const currentPhaseText = getPhaseText(exerciseId, frameRef.current);
            setPhaseText(prev => prev !== currentPhaseText ? currentPhaseText : prev);

            frameRef.current = (frameRef.current + 1) % 120;
            animationRef.current = requestAnimationFrame(animate);
        };

        if (isPlaying) {
            animate();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [exerciseId, isPlaying]);

    return (
        <div className="flex flex-col gap-4">
            <div className={`relative ${isCompact ? 'aspect-[4/5]' : 'aspect-video'} w-full bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group`}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={1000}
                    className="w-full h-full object-contain mix-blend-screen"
                />

                {/* Holographic Pulse Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 via-transparent to-transparent pointer-events-none"></div>

                {/* Intelligent Overlay */}
                <div className="absolute inset-x-6 top-6 flex justify-between items-start pointer-events-none">
                    <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                            <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em]">
                                {phaseText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scanner Effect */}
                <div className="absolute inset-x-0 h-[1px] bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 animate-scan"></div>

                {/* Control Overlay */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <button
                        onClick={() => { frameRef.current = 0; setIsPlaying(true); }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Protocol Detail */}
            {!isCompact && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Stability Focus
                        </h4>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                            Maintain core engagement and strictly follow the sagittal plane alignment.
                        </p>
                    </div>
                    <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Pro Tip
                        </h4>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                            Exhale on contraction (lifting phase) to optimize intra-abdominal pressure.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

// ============ RENDERING ENGINE ============

const drawMedicalGrid = (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
};

const drawPose = (ctx, w, h, frame, id) => {
    const cx = w / 2;
    const by = h - 100; // Anchored near the bottom for maximum headroom
    const t = frame / 120;
    const cycle = Math.sin(t * Math.PI * 2);
    const phase = (cycle + 1) / 2;

    const sk = calculateKinematics(cx, by, phase, cycle, id, t);

    // Draw Anatomy (Glassmorphic Limbs)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawLimb = (s, e, active) => {
        // Outer glow
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.lineWidth = 12;
        ctx.strokeStyle = active ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.05)';
        ctx.stroke();

        // Main structure
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = active ? '#3b82f6' : 'rgba(100, 116, 139, 0.4)'; // Brighter default
        ctx.stroke();

        // Inner highlight
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = active ? '#93c5fd' : 'rgba(148, 163, 184, 0.2)';
        ctx.stroke();
    };

    const targetJoints = getTargetJoints(id);

    // Draw connections
    drawLimb(sk.head, sk.neck, false);
    drawLimb(sk.neck, sk.shoulderL, targetJoints.includes('shoulder'));
    drawLimb(sk.neck, sk.shoulderR, targetJoints.includes('shoulder'));
    drawLimb(sk.shoulderL, sk.elbowL, targetJoints.includes('arm'));
    drawLimb(sk.elbowL, sk.handL, targetJoints.includes('arm'));
    drawLimb(sk.shoulderR, sk.elbowR, targetJoints.includes('arm'));
    drawLimb(sk.elbowR, sk.handR, targetJoints.includes('arm'));

    drawLimb(sk.neck, sk.spine, false);
    drawLimb(sk.spine, sk.hipL, targetJoints.includes('hip'));
    drawLimb(sk.spine, sk.hipR, targetJoints.includes('hip'));

    drawLimb(sk.hipL, sk.kneeL, targetJoints.includes('knee'));
    drawLimb(sk.kneeL, sk.ankleL, targetJoints.includes('knee'));
    drawLimb(sk.hipR, sk.kneeR, targetJoints.includes('knee'));
    drawLimb(sk.kneeR, sk.ankleR, targetJoints.includes('knee'));

    // Draw Joint Nodes
    Object.entries(sk).forEach(([name, pos]) => {
        const isTarget = targetJoints.some(tj => name.toLowerCase().includes(tj));
        const size = name === 'head' ? 22 : 4;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isTarget ? '#fff' : '#1e293b';
        ctx.fill();

        if (isTarget) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#3b82f6';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    });
};

const calculateKinematics = (cx, by, phase, cycle, id = '', t) => {
    // Normalize ID for robust matching
    const lid = String(id || '').toLowerCase().replace(/[-_ ]/g, '');

    // Calibrated scale to ensure full head visibility and body fit
    const scale = 2.0;
    const offsetBy = by + 20;

    // Base T-Pose with scaling applied
    const sk = {
        head: { x: cx, y: offsetBy - 320 * scale },
        neck: { x: cx, y: offsetBy - 280 * scale },
        shoulderL: { x: cx - 35 * scale, y: offsetBy - 270 * scale },
        shoulderR: { x: cx + 35 * scale, y: offsetBy - 270 * scale },
        elbowL: { x: cx - 45 * scale, y: offsetBy - 220 * scale },
        elbowR: { x: cx + 45 * scale, y: offsetBy - 220 * scale },
        handL: { x: cx - 50 * scale, y: offsetBy - 160 * scale },
        handR: { x: cx + 50 * scale, y: offsetBy - 160 * scale },
        spine: { x: cx, y: offsetBy - 200 * scale },
        hipL: { x: cx - 22 * scale, y: offsetBy - 180 * scale },
        hipR: { x: cx + 22 * scale, y: offsetBy - 180 * scale },
        kneeL: { x: cx - 22 * scale, y: offsetBy - 90 * scale },
        kneeR: { x: cx + 22 * scale, y: offsetBy - 90 * scale },
        ankleL: { x: cx - 22 * scale, y: offsetBy },
        ankleR: { x: cx + 22 * scale, y: offsetBy }
    };

    if (lid.includes('kneebend') || lid.includes('squat')) {
        const bend = phase * 60 * scale;
        sk.hipL.y += bend;
        sk.hipR.y += bend;
        sk.spine.y += bend;
        sk.neck.y += bend;
        sk.head.y += bend;
        sk.shoulderL.y += bend;
        sk.shoulderR.y += bend;
        sk.elbowL.y += bend;
        sk.elbowR.y += bend;
        sk.handL.y += bend;
        sk.handR.y += bend;
        sk.kneeL.x -= bend * 0.2;
        sk.kneeR.x += bend * 0.2;
        sk.kneeL.y += bend * 0.2;
        sk.kneeR.y += bend * 0.2;
    } else if (lid.includes('shoulderraise')) {
        const raise = phase * 110 * scale;
        sk.elbowL = { x: cx - (35 + raise) * 1.1, y: offsetBy - (270 + raise * 0.1) * 1.05 };
        sk.elbowR = { x: cx + (35 + raise) * 1.1, y: offsetBy - (270 + raise * 0.1) * 1.05 };
        sk.handL = { x: cx - (35 + raise * 1.5) * 1.1, y: offsetBy - (270 + raise * 0.2) * 1.05 };
        sk.handR = { x: cx + (35 + raise * 1.5) * 1.1, y: offsetBy - (270 + raise * 0.2) * 1.05 };
    } else if (lid.includes('laterallegraise')) {
        const raise = phase * 70 * scale;
        const ang = -phase * Math.PI / 6; // Side abduction angle
        sk.kneeR = {
            x: sk.hipR.x + Math.cos(ang + Math.PI / 2) * 90 * scale,
            y: sk.hipR.y + Math.sin(ang + Math.PI / 2) * 90 * scale
        };
        sk.ankleR = {
            x: sk.kneeR.x + Math.cos(ang + Math.PI / 2) * 90 * scale,
            y: sk.kneeR.y + Math.sin(ang + Math.PI / 2) * 90 * scale
        };
    } else if (lid.includes('legraise')) {
        const rot = -phase * Math.PI / 3;
        sk.kneeR = { x: sk.hipR.x + Math.sin(rot) * 90 * scale, y: sk.hipR.y + Math.cos(rot) * 90 * scale };
        sk.ankleR = { x: sk.hipR.x + Math.sin(rot) * 180 * scale, y: sk.hipR.y + Math.cos(rot) * 180 * scale };
    } else if (lid.includes('standingmarch')) {
        const rot = -phase * Math.PI / 2.5;
        const activeLeg = cycle > 0 ? 'R' : 'L';
        if (activeLeg === 'R') {
            sk.kneeR = { x: sk.hipR.x + Math.sin(rot) * 70 * scale, y: sk.hipR.y + Math.cos(rot) * 70 * scale };
            sk.ankleR = { x: sk.kneeR.x, y: sk.kneeR.y + 90 * scale };
        } else {
            const lRot = phase * Math.PI / 2.5;
            sk.kneeL = { x: sk.hipL.x - Math.sin(lRot) * 70 * scale, y: sk.hipL.y + Math.cos(lRot) * 70 * scale };
            sk.ankleL = { x: sk.kneeL.x, y: sk.kneeL.y + 90 * scale };
        }
    } else if (lid.includes('elbowflexion')) {
        const bend = phase * 100 * scale;
        sk.handL = { x: sk.elbowL.x + bend * 0.5, y: sk.elbowL.y - bend * 0.8 };
        sk.handR = { x: sk.elbowR.x - bend * 0.5, y: sk.elbowR.y - bend * 0.8 };
    } else if (lid.includes('hipflexion')) {
        const bend = phase * 80 * scale;
        sk.kneeR.y -= bend;
        sk.kneeR.x += bend * 0.3;
        sk.ankleR.y -= bend;
        sk.ankleR.x += bend * 0.3;
    } else if (lid.includes('laterallegraise')) {
        const ang = -phase * Math.PI / 6; // Side abduction angle
        sk.kneeR = {
            x: sk.hipR.x + Math.cos(ang + Math.PI / 2) * 90 * scale,
            y: sk.hipR.y + Math.sin(ang + Math.PI / 2) * 90 * scale
        };
        sk.ankleR = {
            x: sk.kneeR.x + Math.cos(ang + Math.PI / 2) * 90 * scale,
            y: sk.kneeR.y + Math.sin(ang + Math.PI / 2) * 90 * scale
        };
    } else if (lid.includes('armcircle')) {
        const rad = 25 * scale;
        const speed = t * Math.PI * 6; // Fast circles
        const armLen = 80 * scale;

        // Left Arm Circle
        sk.elbowL = { x: sk.shoulderL.x - armLen, y: sk.shoulderL.y };
        sk.handL = {
            x: sk.elbowL.x + Math.cos(speed) * rad,
            y: sk.elbowL.y + Math.sin(speed) * rad
        };

        // Right Arm Circle
        sk.elbowR = { x: sk.shoulderR.x + armLen, y: sk.shoulderR.y };
        sk.handR = {
            x: sk.elbowR.x + Math.cos(speed) * rad,
            y: sk.elbowR.y + Math.sin(speed) * rad
        };
    } else if (lid.includes('calfraise')) {
        const lift = phase * 60 * scale; // More dramatic lift
        // Lift entire body
        Object.keys(sk).forEach(joint => {
            if (joint !== 'ankleL' && joint !== 'ankleR') {
                sk[joint].y -= lift;
            }
        });
        // Simulate ankle extension by slightly moving knees
        sk.kneeL.y += lift * 0.2;
        sk.kneeR.y += lift * 0.2;
    }

    return sk;
};

const getTargetJoints = (id = '') => {
    const lid = String(id || '').toLowerCase().replace(/[-_ ]/g, '');
    if (lid.includes('knee') || lid.includes('squat')) return ['knee', 'hip'];
    if (lid.includes('shoulder')) return ['shoulder', 'arm'];
    if (lid.includes('elbow')) return ['arm'];
    if (lid.includes('leg') || lid.includes('march') || lid.includes('hip')) return ['hip', 'knee'];
    if (lid.includes('calf') || lid.includes('ankle')) return ['knee', 'ankle'];
    return [];
};

const getPhaseText = (id, frame) => {
    const phase = Math.sin((frame / 60) * Math.PI);
    const names = {
        'knee-bends': phase > 0 ? 'Going Down' : 'Coming Up',
        'squats': phase > 0 ? 'Lowering' : 'Pushing Up',
        'shoulder-raises': phase > 0 ? 'Lifting Up' : 'Lowering Down',
        'leg-raises': phase > 0 ? 'Lifting Leg' : 'Lowering Leg',
        'standing-march': 'Keep Balanced',
        'elbow-flexion': phase > 0 ? 'Folding Arm' : 'Straightening',
        'hip-flexion': phase > 0 ? 'Knee to Chest' : 'Lowering',
        'lateral-leg-raises': phase > 0 ? 'Side Lift' : 'Bringing Back',
        'arm-circles': 'Making Circles',
        'calf-raises': phase > 0 ? 'Heels Up' : 'Heels Down'
    };
    return names[id] || 'Reference Guide';
};

export default ExerciseDemo;
