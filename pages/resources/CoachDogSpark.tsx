import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Lock, Sparkles, Clock, CheckCircle, Play } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const isPaidMember = (coach: any) =>
  coach && ['trial', 'active', 'lifetime'].includes(coach.subscriptionStatus || '');

interface Lesson {
  number: number;
  title: string;
  description: string;
  duration: string;
  youtubeId?: string;
  available: boolean;
}

const LESSONS: Lesson[] = [
  {
    number: 0,
    title: 'Introduction to CoachDog Spark',
    description: 'Paul Smith, CoachDog\'s Commercial Director, walks through why you should trust CoachDog, his experience, and the aim of the CoachDog Spark course.',
    duration: '2:16',
    youtubeId: 'joqWGM0FLDM',
    available: true,
  },
  {
    number: 1,
    title: 'How to Set Up a Professional Profile Photo',
    description: 'A step-by-step guide to uploading and setting your profile picture on CoachDog — make a great first impression with clients browsing the directory.',
    duration: '9:27',
    youtubeId: 'mMm8pXcmhxo',
    available: true,
  },
  {
    number: 2,
    title: 'Background Images',
    description: 'In this lesson, Paul covers adding a cover/banner photo to make your profile stand out.',
    duration: '5:49',
    youtubeId: '7dq4xsdHSMA',
    available: true,
  },
  {
    number: 3,
    title: 'Pricing & Hourly Rates',
    description: 'Here we discuss how to set hourly rates and best practices for pricing your coaching services.',
    duration: '5:40',
    youtubeId: 'v94LnScQ5Zc',
    available: true,
  },
  {
    number: 4,
    title: 'Uploading Our Links',
    description: 'In this lesson, Paul runs through how to add social, website and booking links to your CoachDog profile.',
    duration: '6:03',
    youtubeId: 'rMCSiVj_PG4',
    available: true,
  },
  {
    number: 5,
    title: 'Completing Our Profiles',
    description: 'In this lesson, Paul covers optimising our profile to maximise client engagement.',
    duration: '10:18',
    youtubeId: 'DbiSslKBxK8',
    available: true,
  },
  {
    number: 6,
    title: 'Adding a Personal URL',
    description: 'In this lesson, Paul covers setting up a personal/custom URL for your shareable profile.',
    duration: '3:07',
    youtubeId: 'ho7g7rj7A5c',
    available: true,
  },
  {
    number: 7,
    title: 'Our Profile Videos',
    description: 'In this lesson, Paul covers how to add an introductory video to your profile.',
    duration: '7:53',
    youtubeId: 'IBpdMoQ9vqo',
    available: true,
  },
];

const AVAILABLE_LESSONS = LESSONS.filter(l => l.available);

export const CoachDogSpark: React.FC = () => {
  const { isAuthenticated, coach } = useAuth();
  const hasPremiumAccess = isAuthenticated && isPaidMember(coach);
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [showNextPrompt, setShowNextPrompt] = useState(false);

  // Load saved progress
  useEffect(() => {
    if (!coach?.id) return;
    try {
      const stored = localStorage.getItem(`spark_progress_${coach.id}`);
      if (stored) setCompletedLessons(JSON.parse(stored));
    } catch {}
  }, [coach?.id]);

  // Reset "next" prompt when switching lessons
  useEffect(() => {
    setShowNextPrompt(false);
  }, [activeLesson.number]);

  // Detect YouTube video end via postMessage
  useEffect(() => {
    const lessonNumber = activeLesson.number;
    const coachId = coach?.id;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === 0) {
          if (coachId) {
            setCompletedLessons(prev => {
              if (prev.includes(lessonNumber)) return prev;
              const updated = [...prev, lessonNumber];
              try { localStorage.setItem(`spark_progress_${coachId}`, JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
          setShowNextPrompt(true);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeLesson.number, coach?.id]);

  const toggleComplete = (lessonNumber: number) => {
    if (!coach?.id) return;
    setCompletedLessons(prev => {
      const updated = prev.includes(lessonNumber)
        ? prev.filter(n => n !== lessonNumber)
        : [...prev, lessonNumber];
      try { localStorage.setItem(`spark_progress_${coach.id}`, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const getNextLesson = (): Lesson | undefined => {
    const idx = AVAILABLE_LESSONS.findIndex(l => l.number === activeLesson.number);
    return AVAILABLE_LESSONS[idx + 1];
  };

  const completedCount = completedLessons.filter(n =>
    AVAILABLE_LESSONS.some(l => l.number === n)
  ).length;

  const nextLesson = getNextLesson();

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lessons</h2>
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {completedCount}/{AVAILABLE_LESSONS.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${AVAILABLE_LESSONS.length > 0 ? (completedCount / AVAILABLE_LESSONS.length) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-2">
              {LESSONS.map(lesson => {
                const isCompleted = completedLessons.includes(lesson.number);
                const isActive = activeLesson.number === lesson.number;
                return (
                  <button
                    key={lesson.number}
                    onClick={() => lesson.available && setActiveLesson(lesson)}
                    disabled={!lesson.available}
                    className={`w-full text-left rounded-xl px-4 py-3.5 transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : lesson.available
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-teal-500 text-white'
                          : lesson.available
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {!lesson.available
                          ? <Lock className="h-3 w-3" />
                          : isCompleted
                          ? <CheckCircle className="h-3.5 w-3.5" />
                          : lesson.number === 0 ? '★' : lesson.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug truncate">{lesson.title}</p>
                        {lesson.duration && (
                          <p className="text-xs mt-0.5 flex items-center gap-1 opacity-70">
                            <Clock className="h-3 w-3" />{lesson.duration}
                          </p>
                        )}
                      </div>
                      {isCompleted && !isActive && (
                        <span className="flex-shrink-0 text-xs text-teal-600 font-semibold">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video player — main content */}
          <div className="lg:col-span-2">
            {activeLesson.youtubeId ? (
              <div className="rounded-2xl overflow-hidden shadow-xl mb-6 aspect-video">
                <iframe
                  key={activeLesson.youtubeId}
                  src={`https://www.youtube.com/embed/${activeLesson.youtubeId}?rel=0&cc_load_policy=1&cc_lang_pref=en&enablejsapi=1`}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-100 flex items-center justify-center aspect-video mb-6">
                <div className="text-center text-slate-400">
                  <p className="text-sm font-medium">Coming soon</p>
                </div>
              </div>
            )}

            {/* Next lesson prompt — shown when video ends */}
            {showNextPrompt && nextLesson && (
              <div className="mb-5 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-fade-in">
                <div>
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-0.5">Up Next</p>
                  <p className="text-sm font-semibold text-slate-800">{nextLesson.title}</p>
                </div>
                <button
                  onClick={() => setActiveLesson(nextLesson)}
                  className="flex-shrink-0 flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                >
                  <Play className="h-4 w-4" /> Play
                </button>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {activeLesson.number === 0 ? activeLesson.title : `Lesson ${activeLesson.number}: ${activeLesson.title}`}
                </h2>
                <p className="text-slate-600 leading-relaxed">{activeLesson.description}</p>
              </div>
              {activeLesson.available && (
                <button
                  onClick={() => toggleComplete(activeLesson.number)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    completedLessons.includes(activeLesson.number)
                      ? 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {completedLessons.includes(activeLesson.number) ? 'Completed' : 'Mark complete'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
