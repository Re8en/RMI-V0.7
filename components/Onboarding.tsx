
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Layout, Users, Heart, ShieldCheck, Plus, UserPlus, Activity, Check, X, Calendar, Info } from 'lucide-react';
import { Person, Ring, Group, SupportType } from '../types';
import { INITIAL_PEOPLE } from '../constants';

interface OnboardingProps {
  onComplete: (people: Person[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [setupPeople, setSetupPeople] = useState<Person[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Full form state for new person
  const [newName, setNewName] = useState('');
  const [newRing, setNewRing] = useState(Ring.INNER);
  const [newGroup, setNewGroup] = useState(Group.FRIENDS);
  const [newSupportTypes, setNewSupportTypes] = useState<SupportType[]>([]);
  const [newLastInteraction, setNewLastInteraction] = useState('');

  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSupport = (type: SupportType) => {
    setNewSupportTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newP: Person = {
      id: Date.now().toString(),
      name: newName.trim(),
      ring: newRing,
      group: newGroup,
      supportTypes: newSupportTypes.length > 0 ? newSupportTypes : [SupportType.EMOTIONAL],
      lastInteraction: newLastInteraction || new Date().toISOString().split('T')[0],
      notes: 'Initial person added during setup'
    };
    
    setSetupPeople([...setupPeople, newP]);
    // Reset form
    setNewName('');
    setNewRing(Ring.INNER);
    setNewGroup(Group.FRIENDS);
    setNewSupportTypes([]);
    setNewLastInteraction('');
    setIsAdding(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-4">
              <Layout className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Relational Mirror Interface (RMI)</h2>
            <div className="space-y-4 text-slate-600 max-w-sm">
              <p>RMI helps you reflect on your social structure.</p>
              <p>It does not replace relationships; it highlights patterns in how you connect.</p>
            </div>
            <button 
              onClick={nextStep}
              className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative w-48 h-48 mb-4">
              <div className="absolute inset-0 border-2 border-dashed border-slate-200 rounded-full" />
              <div className="absolute inset-4 border-2 border-dashed border-slate-200 rounded-full" />
              <div className="absolute inset-8 border-2 border-dashed border-slate-200 rounded-full" />
              <div className="absolute inset-[40%] bg-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-bold">YOU</div>
              <div className="absolute top-2 left-[50%] -translate-x-1/2 w-6 h-6 bg-rose-400 rounded-full border-2 border-white shadow-sm" />
              <div className="absolute bottom-8 right-2 w-6 h-6 bg-sky-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Relational Structure</h2>
            <div className="space-y-4 text-sm text-slate-600 max-w-md">
              <p>Your relationships are visualized in circles centered around you.</p>
              <ul className="text-left space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> <strong>Inner:</strong> Core connections</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400" /> <strong>Middle:</strong> Active connections</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-300" /> <strong>Outer:</strong> Peripheral connections</li>
              </ul>
              <p>You can add, move, and edit people at any time.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center">
                <Heart className="w-6 h-6 text-rose-500 mb-2" />
                <span className="text-[10px] font-bold text-rose-400 uppercase">Emotion</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                <Activity className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase">AIC</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center">
                <Users className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">RII</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Data & Patterns</h2>
            <div className="space-y-4 text-sm text-slate-600 max-w-md text-left bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p><strong>Emotion</strong> reflects your current emotional intensity as calibrated by you and estimated from chat.</p>
              <p><strong>AIC</strong> (AI Interaction Concentration) shows how much you interact with AI assistance.</p>
              <p><strong>RII</strong> (Real Interaction Index) shows how much you interact in the real world.</p>
              <p className="italic text-indigo-600">RMI adapts its guidance based on these signals.</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto max-h-full pb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-2 shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">You stay in control.</h2>
            <div className="space-y-2 text-xs text-slate-600 max-w-sm">
              <p>RMI never sends messages or makes calls for you.</p>
              <p>It suggests possible actions; you choose whether to act.</p>
            </div>
            
            <div className="w-full pt-8 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Setup</span>
              </div>

              {/* Added People Pill List */}
              {setupPeople.length > 0 && !isAdding && (
                <div className="flex flex-wrap gap-2 justify-center mb-6 animate-in fade-in duration-300">
                  {setupPeople.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-600">
                      <span className="w-1 h-1 rounded-full bg-indigo-400" />
                      {p.name}
                      <button onClick={() => setSetupPeople(setupPeople.filter(x => x.id !== p.id))} className="ml-1 hover:text-rose-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isAdding ? (
                <form onSubmit={handleAddPerson} className="w-full bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200 shadow-xl shadow-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Henry"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ring</label>
                      <select 
                        value={newRing}
                        onChange={e => setNewRing(e.target.value as Ring)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none text-slate-900 cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        {Object.values(Ring).map(r => (
                          <option key={r} value={r} className="bg-white text-slate-900">{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Group</label>
                      <select 
                        value={newGroup}
                        onChange={e => setNewGroup(e.target.value as Group)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none text-slate-900 cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        {Object.values(Group).map(g => (
                          <option key={g} value={g} className="bg-white text-slate-900">{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Last Interaction</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newLastInteraction} 
                        onChange={e => setNewLastInteraction(e.target.value)}
                        placeholder="yyyy-mm-dd"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 transition-shadow"
                      />
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Support Types</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {Object.values(SupportType).map(t => (
                        <button 
                          key={t} type="button" onClick={() => toggleSupport(t)}
                          className={`text-[9px] px-2.5 py-1.5 rounded-md border font-bold transition-all ${newSupportTypes.includes(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button 
                      type="submit"
                      disabled={!newName.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-300 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      <Check className="w-4 h-4" /> Save Person
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewName('');
                        setNewSupportTypes([]);
                      }}
                      className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : setupPeople.length < 3 ? (
                <div className="relative group w-full max-w-sm mx-auto">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 bg-slate-900 text-white text-[11px] leading-relaxed p-4 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-2xl z-50">
                    <p>This feature does not import contacts or involve external data synchronization. Instead, it invites you to manually tag individuals with whom you have recently interacted or who hold relational significance.</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </div>
                  
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold text-indigo-500/80 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all active:scale-[0.98] border-dashed"
                  >
                    <UserPlus className="w-5 h-5 text-indigo-300" /> Add Person ({setupPeople.length}/3)
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Ready with {setupPeople.length} people!
                </div>
              )}
              
              {!isAdding && (
                <div className="flex gap-4 pt-10">
                  <button 
                    onClick={() => onComplete([])}
                    className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all text-sm active:scale-95"
                  >
                    Start Empty
                  </button>
                  <button 
                    onClick={() => onComplete(setupPeople.length > 0 ? setupPeople : INITIAL_PEOPLE)}
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100/30 transition-all text-sm active:scale-95"
                  >
                    Go to Map
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-lg h-full max-h-[700px] flex flex-col justify-between">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 shrink-0">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-indigo-600' : 'bg-slate-100'}`} 
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 shrink-0">
          {step > 1 && step < totalSteps ? (
            <button 
              onClick={prevStep}
              className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          
          {step > 1 && step < totalSteps && (
            <button 
              onClick={nextStep}
              className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
