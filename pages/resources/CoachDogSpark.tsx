import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Lock, Sparkles, Play, Pause, Clock,
  Captions, CaptionsOff, ChevronDown, Volume2, VolumeX, Maximize
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const isPaidMember = (coach: any) =>
  coach && ['trial', 'active', 'lifetime'].includes(coach.subscriptionStatus || '');

interface Lesson {
  number: number;
  title: string;
  description: string;
  duration: string;
  videoSrc?: string;
  captionSrc?: string;
  available: boolean;
}

const LESSONS: Lesson[] = [
  {
    number: 1,
    title: 'Getting Started with CoachDog',
    description: 'An introduction to your CoachDog profile — how to set it up for maximum impact and what coaches need to know to hit the ground running.',
    duration: '',
    videoSrc: '/spark/lesson-1.mp4',
    captionSrc: '/spark/lesson-1.vtt',
    available: true,
  },
  {
    number: 2,
    title: 'Coming Soon',
    description: 'More tips and how-tos on the way.',
    duration: '',
    available: false,
  },
  {
    number: 3,
    title: 'Coming Soon',
    description: 'More tips and how-tos on the way.',
    duration: '',
    available: false,
  },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export const CoachDogSpark: React.FC = () => {
  const { isAuthenticated, coach } = useAuth();
  const hasPremiumAccess = isAuthenticated && isPaidMember(coach);
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset player when lesson changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCaptionsOn(false);
  }, [activeLesson]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setIsPlaying(v => !v);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(v => !v);
  };

  const toggleCaptions = () => {
    const track = videoRef.current?.textTracks[0];
    if (!track) return;
    const next = !captionsOn;
    track.mode = next ? 'showing' : 'hidden';
    setCaptionsOn(next);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) { document.exitFullscreen(); }
    else { videoRef.current.requestFullscreen(); }
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
            <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/resources/premium" className="hover:text-emerald-700 transition-colors font-medium">Premium Resources</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-slate-900 font-medium">CoachDog Spark</span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mb-6">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Premium Resource</h2>
          <p className="text-slate-500 mb-8">CoachDog Spark is available to paid plan members, including the free trial.</p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-5 w-5" />
            View CoachDog Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link to="/resources/premium" className="hover:text-emerald-700 transition-colors font-medium">Premium Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-slate-900 font-medium">CoachDog Spark</span>
        </div>
      </div>

      {/* Hero */}
      <header className="bg-slate-900 py-10 lg:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
            <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Video Series</span>
            <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Profile Tips</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-white mb-2">
            CoachDog Spark ⚡
          </h1>
          <p className="text-slate-400 text-lg">How-tos and profile tips to help you get the most from CoachDog</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">

          {/* Lesson list — sidebar */}
          <div className="mb-8 lg:mb-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Lessons</h2>
            <div className="space-y-2">
              {LESSONS.map(lesson => (
                <button
                  key={lesson.number}
                  onClick={() => lesson.available && setActiveLesson(lesson)}
                  disabled={!lesson.available}
                  className={`w-full text-left rounded-xl px-4 py-3.5 transition-all ${
                    activeLesson.number === lesson.number
                      ? 'bg-slate-900 text-white'
                      : lesson.available
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeLesson.number === lesson.number
                        ? 'bg-white/20 text-white'
                        : lesson.available
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {lesson.available ? lesson.number : <Lock className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug truncate">{lesson.title}</p>
                      {lesson.duration && (
                        <p className="text-xs mt-0.5 flex items-center gap-1 opacity-70">
                          <Clock className="h-3 w-3" />{lesson.duration}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Video player — main content */}
          <div className="lg:col-span-2">
            {activeLesson.videoSrc ? (
              <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-xl mb-6">
                {/* Video */}
                <div className="relative cursor-pointer" onClick={togglePlay}>
                  <video
                    ref={videoRef}
                    key={activeLesson.videoSrc}
                    className="w-full block"
                    preload="metadata"
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={activeLesson.videoSrc} type="video/mp4" />
                    {activeLesson.captionSrc && (
                      <track kind="subtitles" src={activeLesson.captionSrc} srcLang="en" label="English" />
                    )}
                  </video>

                  {/* Centre play/pause flash */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 rounded-full p-4">
                        <Play className="h-10 w-10 text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom control bar */}
                <div className="bg-slate-900 px-4 pt-2 pb-3 select-none">
                  {/* Progress bar */}
                  <div className="relative h-1 mb-3 group/progress">
                    <div className="absolute inset-0 bg-white/20 rounded-full" />
                    <div
                      className="absolute left-0 top-0 h-full bg-teal-400 rounded-full pointer-events-none"
                      style={{ width: `${progressPct}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center justify-between">
                    {/* Left: play, volume, time */}
                    <div className="flex items-center gap-3">
                      <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-teal-400 transition-colors">
                        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); toggleMute(); }} className="text-white hover:text-teal-400 transition-colors">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right: speed, CC, fullscreen */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* Speed dropdown */}
                      <div className="relative">
                        {showSpeedMenu && (
                          <div className="fixed inset-0 z-10" onClick={() => setShowSpeedMenu(false)} />
                        )}
                        <button
                          onClick={() => setShowSpeedMenu(v => !v)}
                          className="inline-flex items-center gap-0.5 text-white hover:text-teal-400 text-xs font-bold transition-colors"
                        >
                          {playbackSpeed === 1 ? '1×' : `${playbackSpeed}×`}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20 min-w-[110px]">
                            {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                              <button
                                key={speed}
                                onClick={() => handleSpeedChange(speed)}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                                  playbackSpeed === speed
                                    ? 'bg-teal-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                {speed === 1 ? '1× Normal' : `${speed}×`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CC toggle */}
                      {activeLesson.captionSrc && (
                        <button
                          onClick={toggleCaptions}
                          className={`transition-colors ${captionsOn ? 'text-teal-400' : 'text-white hover:text-teal-400'}`}
                          title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
                        >
                          {captionsOn ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                        </button>
                      )}

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="text-white hover:text-teal-400 transition-colors">
                        <Maximize className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-100 flex items-center justify-center aspect-video mb-6">
                <div className="text-center text-slate-400">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Coming soon</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Lesson {activeLesson.number}: {activeLesson.title}
            </h2>
            <p className="text-slate-600 leading-relaxed">{activeLesson.description}</p>
          </div>

        </div>
      </div>
    </div>
  );
};
