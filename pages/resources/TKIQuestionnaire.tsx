import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Download, FileText, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { saveTKIResult } from '../../services/supabaseService';

type Mode = 'Competing' | 'Avoiding' | 'Accommodating' | 'Collaborating' | 'Compromising';

interface Question {
  pair: number;
  a: string;
  b: string;
  aMode: Mode;
  bMode: Mode;
}

const QUESTIONS: Question[] = [
  { pair: 1,  a: 'I stand my ground and pursue my own position.',                                            b: 'I try to find a middle ground to settle the issue quickly.',                              aMode: 'Competing',      bMode: 'Compromising'  },
  { pair: 2,  a: 'I avoid open disagreement whenever possible.',                                             b: 'I treat conflict as a problem to be solved together.',                                  aMode: 'Avoiding',       bMode: 'Collaborating' },
  { pair: 3,  a: 'I give in to keep the peace.',                                                             b: 'I push for my solution when I believe I am right.',                                     aMode: 'Accommodating',  bMode: 'Competing'     },
  { pair: 4,  a: 'I let others take the lead on resolving the issue.',                                       b: 'I insist we work through every concern until we find a solution that satisfies everyone.', aMode: 'Avoiding',       bMode: 'Collaborating' },
  { pair: 5,  a: 'I will give up some points if the other person does too.',                                 b: 'I hold my position firmly, even under pressure.',                                       aMode: 'Compromising',   bMode: 'Competing'     },
  { pair: 6,  a: 'I rarely bring up issues that might cause tension.',                                       b: 'I am willing to accommodate others to maintain harmony.',                               aMode: 'Avoiding',       bMode: 'Accommodating' },
  { pair: 7,  a: 'I look for a quick, fair trade-off.',                                                      b: 'I dig deep with others to understand all underlying needs.',                            aMode: 'Compromising',   bMode: 'Collaborating' },
  { pair: 8,  a: 'I compete to win on what matters most to me.',                                             b: 'I sometimes avoid issues entirely if they seem unimportant.',                           aMode: 'Competing',      bMode: 'Avoiding'      },
  { pair: 9,  a: 'I cooperate fully, even at my own expense.',                                               b: "I push for a solution that fully meets both sides' needs.",                             aMode: 'Accommodating',  bMode: 'Collaborating' },
  { pair: 10, a: 'I try to split the difference on disagreements.',                                          b: 'I keep my views to myself to avoid friction.',                                          aMode: 'Compromising',   bMode: 'Avoiding'      },
  { pair: 11, a: 'I argue strongly for my preferred outcome.',                                               b: 'I go along with others to preserve relationships.',                                     aMode: 'Competing',      bMode: 'Accommodating' },
  { pair: 12, a: 'I step away from conflicts that feel unproductive.',                                       b: 'I seek a compromise that gives everyone something.',                                    aMode: 'Avoiding',       bMode: 'Compromising'  },
  { pair: 13, a: 'I work to find a creative solution that integrates both perspectives.',                    b: 'I assert my position even if it creates tension.',                                      aMode: 'Collaborating',  bMode: 'Competing'     },
  { pair: 14, a: 'I smooth over differences rather than confront them.',                                     b: 'I give up my needs to satisfy the other person.',                                       aMode: 'Avoiding',       bMode: 'Accommodating' },
  { pair: 15, a: 'I insist on a win-win outcome before we move on.',                                         b: 'I accept a trade-off when a perfect solution is not possible.',                         aMode: 'Collaborating',  bMode: 'Compromising'  },
];

const REFLECTION_QUESTIONS = [
  'Does your highest-scoring mode match how you see yourself? Why or why not?',
  'What is one situation where your dominant mode serves you well – and one where it might hold you back?',
  'Which of your two lowest-scoring modes would most benefit your effectiveness if you used it more often?',
  'What might colleagues say is your default mode? Would that match your score?',
];

const MODE_COLORS: Record<Mode, string> = {
  Competing:     'text-rose-600',
  Avoiding:      'text-slate-500',
  Accommodating: 'text-amber-600',
  Collaborating: 'text-teal-600',
  Compromising:  'text-indigo-600',
};

const MODES: Mode[] = ['Competing', 'Avoiding', 'Accommodating', 'Collaborating', 'Compromising'];

function buildWordHTML(
  coachName: string | undefined,
  scores: Record<Mode, number>,
  dominantMode: string | null,
  answers: Record<number, 'A' | 'B'>,
  questions: Question[],
  reflectionQuestions: string[]
): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const scoresRows = (Object.keys(scores) as Mode[])
    .map(mode => `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600">${mode}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;font-size:18px;font-weight:700">${scores[mode]}</td></tr>`)
    .join('');

  const answersRows = questions
    .map(q => {
      const ans = answers[q.pair];
      const text = ans === 'A' ? q.a : q.b;
      const mode = ans === 'A' ? q.aMode : q.bMode;
      return `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center">${q.pair}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:700">${ans}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${text}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${mode}</td></tr>`;
    })
    .join('');

  const reflectionHTML = reflectionQuestions
    .map((q, i) => `<p style="margin:0 0 6px 0"><strong>${i + 1}. ${q}</strong></p><p style="margin:0 0 28px 0;color:#94a3b8">___________________________________________________________________________________________________________</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 32px; font-size: 13px; line-height: 1.6; }
    h1 { color: #0f172a; font-size: 22px; margin: 0 0 4px; }
    h2 { color: #0f172a; font-size: 15px; margin: 28px 0 8px; border-bottom: 2px solid #0d9488; padding-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th { background: #f1f5f9; padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; font-weight: 700; }
    .dominant { background: #0f172a; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 8px; }
    .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Thomas-Kilmann TKI Questionnaire — Results</h1>
  <p style="color:#64748b;margin:0 0 24px">${coachName ? `Completed by: <strong>${coachName}</strong> &nbsp;|&nbsp; ` : ''}Date: <strong>${date}</strong></p>

  <h2>Score Summary</h2>
  <table>
    <thead><tr><th>Conflict Mode</th><th style="text-align:center">Score (out of 6)</th></tr></thead>
    <tbody>${scoresRows}</tbody>
  </table>

  <div class="dominant">Your dominant mode: <strong>${dominantMode ?? 'N/A'}</strong></div>

  <h2>How to Interpret Your Score</h2>
  <p><strong>5–6:</strong> Strong preference – likely your dominant mode.</p>
  <p><strong>3–4:</strong> Moderate use – you use this mode situationally.</p>
  <p><strong>0–2:</strong> Low use – you tend to avoid this mode.</p>
  <p><strong>Your highest score</strong> = your likely dominant conflict mode. &nbsp; <strong>Tie at 4–6</strong> = you switch between modes depending on context. &nbsp; <strong>All scores 2–4</strong> = you are highly flexible and situational.</p>

  <h2>Your Answers</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:50px">Pair</th>
        <th style="text-align:center;width:60px">Choice</th>
        <th>Statement selected</th>
        <th style="width:130px">Mode</th>
      </tr>
    </thead>
    <tbody>${answersRows}</tbody>
  </table>

  <h2>Reflection Questions</h2>
  ${reflectionHTML}

  <div class="footer">Generated by CoachDog &middot; coachdog.uk</div>
</body>
</html>`;
}

const isPaidMember = (coach: any) =>
  coach && ['trial', 'active', 'lifetime'].includes(coach.subscriptionStatus || '');

export const TKIQuestionnaire: React.FC = () => {
  const { isAuthenticated, coach } = useAuth();
  const hasPremiumAccess = isAuthenticated && isPaidMember(coach);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const scores = QUESTIONS.reduce<Record<Mode, number>>(
    (acc, q) => {
      const ans = answers[q.pair];
      if (ans === 'A') acc[q.aMode]++;
      if (ans === 'B') acc[q.bMode]++;
      return acc;
    },
    { Competing: 0, Avoiding: 0, Accommodating: 0, Collaborating: 0, Compromising: 0 }
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === 15;

  const dominantMode: string | null = (() => {
    if (!allAnswered) return null;
    const maxScore = Math.max(...Object.values(scores));
    const modes = (Object.keys(scores) as Mode[]).filter(m => scores[m] === maxScore);
    return modes.length === 1 ? modes[0] : `${modes.join(' / ')} (tied at ${maxScore})`;
  })();

  const handleSave = async () => {
    if (!coach?.id || !dominantMode) return;
    setSaving(true);
    const result = await saveTKIResult(coach.id, answers, scores, dominantMode);
    setSaving(false);
    if (result) setSavedId(result.id);
  };

  const downloadWord = () => {
    const html = buildWordHTML(coach?.name, scores, dominantMode, answers, QUESTIONS, REFLECTION_QUESTIONS);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TKI-Results.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Access gate
  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
            <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/resources/premium" className="hover:text-emerald-700 transition-colors font-medium">Premium Resources</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-slate-900 font-medium">TKI Questionnaire</span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mb-6">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Premium Resource</h2>
          <p className="text-slate-500 mb-8">This tool is available to CoachDog paid plan members, including the free trial.</p>
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
      {/* Breadcrumb — hidden in print */}
      <div className="bg-slate-50 border-b border-slate-100 print:hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link to="/resources/premium" className="hover:text-emerald-700 transition-colors font-medium">Premium Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-slate-900 font-medium">TKI Questionnaire</span>
        </div>
      </div>

      {/* Dark hero — hidden in print */}
      <header className="bg-slate-900 py-10 lg:py-14 print:hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
            <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Self-Assessment</span>
            <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Conflict Styles</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-white mb-3">
            Thomas-Kilmann TKI Questionnaire
          </h1>
          <p className="text-slate-400 text-lg">Identify your dominant conflict mode</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Print-only title header */}
        <div className="hidden print:block border-b-2 border-teal-500 pb-4 mb-2">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Thomas-Kilmann TKI Questionnaire — Results</h1>
          <p className="text-sm text-slate-500">
            {coach?.name && <><span className="font-semibold text-slate-700">{coach.name}</span> · </>}
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Instructions — hidden in print */}
        <div className="border-l-4 border-teal-500 bg-slate-50 rounded-r-2xl px-5 py-4 print:hidden">
          <p className="text-sm font-semibold text-slate-800 mb-1">📋 Instructions</p>
          <p className="text-slate-600 text-sm leading-relaxed">
            For each pair of statements below, <strong>select the one (A or B) that is more true of you</strong> in
            workplace conflict situations. Work quickly – go with your first instinct. There are no right or wrong answers.
          </p>
        </div>

        {/* Questions — hidden in print */}
        <div className="space-y-6 print:hidden">
          {QUESTIONS.map((q) => {
            const selected = answers[q.pair];
            return (
              <div key={q.pair} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                  <span className="inline-flex items-center bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Pair {q.pair} of 15
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <button
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [q.pair]: 'A' }))}
                    className={`w-full text-left px-5 py-5 flex items-start gap-3 transition-colors ${
                      selected === 'A' ? 'bg-teal-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected === 'A' ? 'border-teal-500' : 'border-slate-300'
                    }`}>
                      {selected === 'A' && <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">A.</span> {q.a}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [q.pair]: 'B' }))}
                    className={`w-full text-left px-5 py-5 flex items-start gap-3 transition-colors ${
                      selected === 'B' ? 'bg-teal-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected === 'B' ? 'border-teal-500' : 'border-slate-300'
                    }`}>
                      {selected === 'B' && <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">B.</span> {q.b}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Score Tally */}
        <div className="border-2 border-teal-200 rounded-2xl overflow-hidden">
          <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
            <span className="text-sm font-semibold text-teal-800">📝 Your Score Tally</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-5">
              {MODES.map(mode => (
                <div key={mode} className="flex flex-col items-center border border-slate-200 rounded-xl p-2 sm:p-3 text-center">
                  <span className="text-xs font-semibold text-slate-600 mb-2 leading-tight">{mode}</span>
                  <span className={`text-2xl font-bold ${MODE_COLORS[mode]}`}>{scores[mode]}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white rounded-xl px-5 py-4 text-center">
              <span className="text-sm font-medium text-slate-400">🔍 Your Dominant Mode: </span>
              <span className={`font-bold text-base ${dominantMode ? 'text-teal-400' : 'text-slate-400'}`}>
                {dominantMode ?? 'Not yet calculated'}
              </span>
            </div>

            {answeredCount > 0 && !allAnswered && (
              <p className="text-xs text-center text-slate-400 mt-3 print:hidden">
                {answeredCount} of 15 pairs answered — complete all pairs to see your result.
              </p>
            )}
          </div>
        </div>

        {/* Download + Save buttons — hidden in print */}
        {allAnswered && (
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Download size={16} />
              Save as PDF
            </button>
            <button
              onClick={downloadWord}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl border border-slate-300 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <FileText size={16} />
              Download Word (.doc)
            </button>
            {savedId ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                <Check size={15} />
                Results saved
              </span>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                {saving ? 'Saving…' : 'Save Results'}
              </button>
            )}
          </div>
        )}

        {/* Print-only answers summary */}
        {allAnswered && (
          <div className="hidden print:block">
            <h2 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Your Answers</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-center font-semibold w-12">Pair</th>
                  <th className="border border-slate-200 px-3 py-2 text-center font-semibold w-14">Choice</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Statement selected</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-semibold w-32">Mode</th>
                </tr>
              </thead>
              <tbody>
                {QUESTIONS.map(q => {
                  const ans = answers[q.pair];
                  return (
                    <tr key={q.pair}>
                      <td className="border border-slate-200 px-3 py-1.5 text-center text-slate-600">{q.pair}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-center font-bold">{ans}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-slate-700">{ans === 'A' ? q.a : q.b}</td>
                      <td className="border border-slate-200 px-3 py-1.5 text-slate-700">{ans === 'A' ? q.aMode : q.bMode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* How to Interpret */}
        <div className="border-2 border-teal-200 rounded-2xl overflow-hidden">
          <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
            <span className="text-sm font-semibold text-teal-800">📖 How to Interpret Your Score</span>
          </div>
          <div className="px-5 py-5 space-y-2 text-sm text-slate-700">
            <p><strong>5–6:</strong> Strong preference – likely your dominant mode.</p>
            <p><strong>3–4:</strong> Moderate use – you use this mode situationally.</p>
            <p><strong>0–2:</strong> Low use – you tend to avoid this mode.</p>
            <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
              <p><strong>Your highest score</strong> = your likely dominant conflict mode.</p>
              <p><strong>Tie at 4–6</strong> = you switch between modes depending on context.</p>
              <p><strong>All scores 2–4</strong> = you are highly flexible and situational.</p>
            </div>
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="border-2 border-teal-200 rounded-2xl overflow-hidden">
          <div className="bg-teal-50 px-5 py-3 border-b border-teal-200">
            <span className="text-sm font-semibold text-teal-800">💭 Reflection Questions</span>
          </div>
          <ol className="px-5 py-5 space-y-4 list-none">
            {REFLECTION_QUESTIONS.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{q}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Reset — hidden in print */}
        {answeredCount > 0 && (
          <div className="text-center print:hidden">
            <button
              onClick={() => { setAnswers({}); setSavedId(null); }}
              className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Reset answers
            </button>
          </div>
        )}

        {/* Back link — hidden in print */}
        <div className="pb-8 print:hidden">
          <Link to="/resources/premium" className="text-sm text-slate-400 hover:text-emerald-700 transition-colors">
            &larr; Back to Premium Resources
          </Link>
        </div>

      </div>
    </div>
  );
};
