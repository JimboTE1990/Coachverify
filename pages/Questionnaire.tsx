import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { QuestionnaireAnswers, Specialty, Format, CoachingExpertise, CoachingLanguage, CPDQualification } from '../types';
import { MultiSelectDropdown } from '../components/filters/MultiSelectDropdown';
import { ExpandableCategory, CheckboxGrid } from '../components/filters/ExpandableCategory';
import { DualRangeSlider } from '../components/DualRangeSlider';
import { COACHING_LANGUAGES, CPD_QUALIFICATIONS, EXPERTISE_CATEGORIES } from '../constants/filterOptions';
import { SearchableLocationSelect } from '../components/forms/SearchableLocationSelect';

export const Questionnaire: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    goal: '',
    preferredFormat: [],
    preferredLocation: '',
    budgetMin: 30,
    budgetMax: 200,
    preferredCertifications: [],
    languagePreferences: ['English'],
    experienceLevel: 'any',
    coachingExpertise: [],
    cpdQualifications: []
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

  // Toggle category selection (top-level only)
  const toggleCategory = (categoryName: string) => {
    setAnswers(prev => {
      // Find the category items
      const category = EXPERTISE_CATEGORIES.find(cat => cat.name === categoryName);
      if (!category) return prev;

      const currentExpertise = prev.coachingExpertise || [];

      // Check if any items from this category are already selected
      const hasAnySelected = category.items.some(item => currentExpertise.includes(item as CoachingExpertise));

      if (hasAnySelected) {
        // Remove all items from this category
        return {
          ...prev,
          coachingExpertise: currentExpertise.filter(item => !category.items.includes(item))
        };
      } else {
        // Add all items from this category
        return {
          ...prev,
          coachingExpertise: [...currentExpertise, ...category.items] as CoachingExpertise[]
        };
      }
    });
  };

  // Check if a category is selected
  const isCategorySelected = (categoryItems: string[]): boolean => {
    const currentExpertise = answers.coachingExpertise || [];
    return categoryItems.some(item => currentExpertise.includes(item as CoachingExpertise));
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

        {/* Step 1: Coaching Categories - Top Level Only */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What can we help you with?</h2>
            <p className="text-slate-500 mb-6 text-sm">Select any broad areas that apply (optional).</p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {EXPERTISE_CATEGORIES.map(category => (
                <div
                  key={category.name}
                  onClick={() => toggleCategory(category.name)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    isCategorySelected(category.items)
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{category.icon}</div>
                      <div>
                        <div className="font-bold text-slate-900">{category.name}</div>
                        <div className="text-xs text-slate-500">{category.description}</div>
                      </div>
                    </div>
                    {isCategorySelected(category.items) && (
                      <CheckCircle className="h-6 w-6 text-brand-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-slate-500 text-center">
              {EXPERTISE_CATEGORIES.filter(cat => isCategorySelected(cat.items)).length} area(s) selected
            </div>
          </div>
        )}

        {/* Step 2: Format & Location */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Preferred format?</h2>
            <p className="text-slate-500 mb-4 text-sm">Select all that apply.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(['In-Person', 'Online'] as Format[]).map((fmt) => (
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

            {/* Optional Location Dropdown - only show if In-Person is selected */}
            {answers.preferredFormat.includes('In-Person') && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Preferred Location (Optional)
                </label>
                <SearchableLocationSelect
                  value={answers.preferredLocation || ''}
                  onChange={(value) => setAnswers({ ...answers, preferredLocation: value })}
                  emptyOption="Any location"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Coaches near your preferred location will be prioritized in search results
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Budget Range - Min and Max */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What is your budget range?</h2>

            <DualRangeSlider
              min={30}
              max={500}
              step={10}
              minValue={answers.budgetMin}
              maxValue={answers.budgetMax}
              onChange={(min, max) => {
                setAnswers({
                  ...answers,
                  budgetMin: min,
                  budgetMax: max
                });
              }}
            />

            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
               <p className="text-sm text-blue-800">
                 💡 Tip: Most executive coaches charge £150+, while wellness coaches often start around £60-80.
               </p>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-lg">
               <p className="text-sm text-amber-800">
                 ℹ️ Pricing is displayed in the coach's local currency. For international clients, please consider that currency conversion rates may impact actual pricing day to day.
               </p>
            </div>
          </div>
        )}

        {/* Step 4: Gender Preference */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Do you have a gender preference for your coach?</h2>
            <p className="text-slate-500 mb-6">Select all that apply (optional)</p>

            <div className="space-y-3">
              {['Male', 'Female', 'Non-binary', 'No preference'].map((gender) => (
                <label
                  key={gender}
                  className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-brand-500 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={gender === 'No preference'
                      ? !answers.genderPreference || answers.genderPreference.length === 0
                      : answers.genderPreference?.includes(gender) || false}
                    onChange={(e) => {
                      if (gender === 'No preference') {
                        setAnswers({...answers, genderPreference: []});
                      } else {
                        const current = answers.genderPreference || [];
                        setAnswers({
                          ...answers,
                          genderPreference: e.target.checked
                            ? [...current, gender]
                            : current.filter(g => g !== gender)
                        });
                      }
                    }}
                    className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-lg font-medium text-slate-900">{gender}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 This is completely optional. Selecting "No preference" or leaving it blank will show you all coaches regardless of gender.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Languages (UPDATED - Multi-Select Dropdown) */}
        {step === 5 && (
          <div className="animate-fade-in">
            <MultiSelectDropdown
              label="Which languages would you like your coach to speak?"
              placeholder="Type to search languages..."
              options={COACHING_LANGUAGES}
              value={answers.languagePreferences || ['English']}
              onChange={(value) => setAnswers({ ...answers, languagePreferences: value })}
              maxDisplay={2}
              optional={false}
            />

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Tip: Most coaches offer sessions in English, but selecting additional languages can help you find coaches who match your language preferences.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: CPD Qualifications (UPDATED - Multi-Select Dropdown) */}
        {step === 6 && (
          <div className="animate-fade-in">
            <MultiSelectDropdown
              label="Are there any specific qualifications you prefer?"
              placeholder="Type to search certifications..."
              options={CPD_QUALIFICATIONS}
              value={answers.cpdQualifications || []}
              onChange={(value) => setAnswers({ ...answers, cpdQualifications: value as CPDQualification[] })}
              maxDisplay={2}
              optional={true}
            />

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Tip: Certifications like ICF (International Coaching Federation) and EMCC (European Mentoring & Coaching Council) are widely recognized standards.
              </p>
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
             disabled={step === 2 && answers.preferredFormat.length === 0}
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
