import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { QuestionnaireAnswers, Specialty, Format, AdditionalCertification } from '../types';

export const Questionnaire: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    goal: '',
    sessionsPerMonth: '',
    preferredFormat: [],
    budgetRange: 100,
    preferredCertifications: [],
    languagePreferences: ['English'],
    experienceLevel: 'any'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinish = () => {
    // Navigate to Search with state
    navigate('/search', { state: { questionnaireResults: answers } });
  };

  const updateFormat = (format: Format) => {
    setAnswers(prev => {
      const exists = prev.preferredFormat.includes(format);
      return {
        ...prev,
        preferredFormat: exists
          ? prev.preferredFormat.filter(f => f !== format)
          : [...prev.preferredFormat, format]
      };
    });
  };

  const updateCertification = (cert: AdditionalCertification) => {
    setAnswers(prev => {
      const certs = prev.preferredCertifications || [];
      const exists = certs.includes(cert);
      return {
        ...prev,
        preferredCertifications: exists
          ? certs.filter(c => c !== cert)
          : [...certs, cert]
      };
    });
  };

  const updateLanguage = (lang: string) => {
    setAnswers(prev => {
      const langs = prev.languagePreferences || [];
      const exists = langs.includes(lang);
      return {
        ...prev,
        languagePreferences: exists
          ? langs.filter(l => l !== lang)
          : [...langs, lang]
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-brand-600">Step {step} of 6</span>
          <span className="text-xs font-semibold text-slate-400">{Math.round((step / 6) * 100)}% Completed</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full">
          <div className="h-2 bg-brand-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 6) * 100}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 min-h-[400px] flex flex-col justify-between">
        
        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What is your main goal?</h2>
            <div className="space-y-3">
              {(['Career Growth', 'Stress Relief', 'Relationships', 'Health & Wellness', 'Executive Coaching'] as Specialty[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, goal: option })}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    answers.goal === option 
                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                    : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option}</span>
                    {answers.goal === option && <CheckCircle className="h-5 w-5 text-brand-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sessions */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">How many sessions per month?</h2>
            <div className="space-y-4">
              {[
                { id: 'one', label: 'One Session', desc: 'Good for maintenance' },
                { id: 'two', label: 'Two Sessions', desc: 'Recommended for steady progress' },
                { id: 'unlimited', label: 'Unlimited / Weekly', desc: 'Intensive coaching for rapid results' },
              ].map((opt) => (
                <label key={opt.id} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  answers.sessionsPerMonth === opt.id 
                  ? 'border-brand-500 bg-brand-50' 
                  : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <input 
                    type="radio" 
                    name="sessions" 
                    className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                    checked={answers.sessionsPerMonth === opt.id}
                    onChange={() => setAnswers({ ...answers, sessionsPerMonth: opt.id as any })}
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-slate-900">{opt.label}</span>
                    <span className="block text-sm text-slate-500">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Format */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Preferred format?</h2>
            <p className="text-slate-500 mb-4 text-sm">Select all that apply.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['In-Person', 'Online', 'Hybrid'] as Format[]).map((fmt) => (
                <div 
                  key={fmt}
                  onClick={() => updateFormat(fmt)}
                  className={`cursor-pointer p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                    answers.preferredFormat.includes(fmt)
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-100 hover:border-brand-200'
                  }`}
                >
                  <span className="font-semibold text-lg">{fmt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What is your budget range?</h2>
            <p className="text-slate-500 mb-8">Max hourly rate: <span className="font-bold text-slate-900">£{answers.budgetRange}</span></p>

            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={answers.budgetRange}
              onChange={(e) => setAnswers({...answers, budgetRange: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>£50</span>
              <span>£250</span>
              <span>£500+</span>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
               <p className="text-sm text-blue-800">
                 💡 Tip: Most executive coaches charge £150+, while wellness coaches often start around £60-80.
               </p>
            </div>
          </div>
        )}

        {/* Step 5: Certifications */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Are there any specific certifications you prefer?</h2>
            <p className="text-slate-500 mb-4 text-sm">Select all that matter to you (optional).</p>
            <div className="space-y-3">
              {([
                'Mental Health First Aid Trained',
                'Trauma Informed',
                'Diversity & Inclusion Certified',
                'Child & Adolescent Specialist',
                'Corporate Coaching Certified',
                'NLP Practitioner',
                'CBT Trained'
              ] as AdditionalCertification[]).map((cert) => (
                <div
                  key={cert}
                  onClick={() => updateCertification(cert)}
                  className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    (answers.preferredCertifications || []).includes(cert)
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-100 hover:border-brand-200'
                  }`}
                >
                  <span className="font-medium text-slate-700">{cert}</span>
                  {(answers.preferredCertifications || []).includes(cert) && (
                    <CheckCircle className="h-5 w-5 text-brand-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Language - Multi-select */}
        {step === 6 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Which languages would you like your coach to speak?</h2>
            <p className="text-slate-500 mb-4 text-sm">Select all that apply.</p>
            <div className="space-y-3">
              {['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Italian'].map((lang) => (
                <div
                  key={lang}
                  onClick={() => updateLanguage(lang)}
                  className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    (answers.languagePreferences || []).includes(lang)
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-100 hover:border-brand-200'
                  }`}
                >
                  <span className="font-medium text-slate-700">{lang}</span>
                  {(answers.languagePreferences || []).includes(lang) && (
                    <CheckCircle className="h-5 w-5 text-brand-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center text-slate-500 hover:text-slate-800 font-medium ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </button>

          {step < 6 ? (
             <button
             onClick={nextStep}
             disabled={
               (step === 1 && !answers.goal) ||
               (step === 2 && !answers.sessionsPerMonth) ||
               (step === 3 && answers.preferredFormat.length === 0)
               // Steps 4-6 have no required fields, so no validation needed
             }
             className="bg-brand-600 text-white px-6 py-2 rounded-full font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
           >
             Next <ArrowRight className="h-4 w-4 ml-2" />
           </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-trust-500 text-white px-8 py-2 rounded-full font-bold hover:bg-green-600 shadow-md flex items-center"
            >
              See Matches <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};