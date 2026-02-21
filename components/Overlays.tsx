
import React, { useState } from 'react';
import { X, Phone, MessageSquare, ExternalLink, Tag, Calendar, Shield, Trash2, Download, Upload, Info, AlertTriangle, BookOpen, RotateCcw, Send, CheckCircle } from 'lucide-react';
import { submitFeedback } from '../lib/api';
import { Ring, Group, SupportType, Person, CaseType } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AddPersonModal: React.FC<{
  isOpen: boolean; onClose: () => void; onAdd: (p: Partial<Person>) => void; initialName?: string
}> = ({ isOpen, onClose, onAdd, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [ring, setRing] = useState(Ring.OUTER);
  const [group, setGroup] = useState(Group.OTHER);
  const [supportTypes, setSupportTypes] = useState<SupportType[]>([]);
  const [lastInteraction, setLastInteraction] = useState('');

  const toggleSupport = (type: SupportType) => {
    setSupportTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleAdd = () => {
    onAdd({
      name,
      ring,
      group,
      supportTypes,
      lastInteraction: lastInteraction || 'Unknown'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Person to Map">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            placeholder="Henry"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ring</label>
            <select
              value={ring}
              onChange={e => setRing(e.target.value as any)}
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              {Object.values(Ring).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group</label>
            <select
              value={group}
              onChange={e => setGroup(e.target.value as any)}
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Interaction</label>
          <div className="relative">
            <input
              type="text"
              value={lastInteraction}
              onChange={e => setLastInteraction(e.target.value)}
              placeholder="yyyy/mm/dd"
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 pl-8 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Support Types</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.values(SupportType).map(t => (
              <button
                key={t} onClick={() => toggleSupport(t)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${supportTypes.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold mt-4 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          Add to Relational Map
        </button>
      </div>
    </Modal>
  );
};

export const EditPersonModal: React.FC<{
  person: Person; onClose: () => void; onUpdate: (p: Person) => void; onDelete: (id: string) => void;
}> = ({ person, onClose, onUpdate, onDelete }) => {
  const [state, setState] = useState(person);

  const toggleSupport = (type: SupportType) => {
    const nextSupportTypes = state.supportTypes.includes(type)
      ? state.supportTypes.filter(t => t !== type)
      : [...state.supportTypes, type];
    setState({ ...state, supportTypes: nextSupportTypes });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit ${person.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
          <input
            type="text" value={state.name} onChange={e => setState({ ...state, name: e.target.value })}
            className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ring</label>
            <select
              value={state.ring}
              onChange={e => setState({ ...state, ring: e.target.value as any })}
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              {Object.values(Ring).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group</label>
            <select
              value={state.group}
              onChange={e => setState({ ...state, group: e.target.value as any })}
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Interaction</label>
          <div className="relative">
            <input
              type="text"
              value={state.lastInteraction === 'Unknown' ? '' : state.lastInteraction}
              onChange={e => setState({ ...state, lastInteraction: e.target.value || 'Unknown' })}
              placeholder="yyyy/mm/dd"
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 pl-8 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Support Types</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.values(SupportType).map(t => (
              <button
                key={t} onClick={() => toggleSupport(t)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${state.supportTypes.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
          <textarea
            placeholder="Notes..." value={state.notes} onChange={e => setState({ ...state, notes: e.target.value })}
            className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg p-2 text-sm h-20 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onUpdate(state)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">Save Changes</button>
          <button onClick={() => onDelete(person.id)} className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg font-bold border border-rose-100 hover:bg-rose-100 transition-colors">Delete</button>
        </div>
      </div>
    </Modal>
  );
};

export const ContactFlowModal: React.FC<{ personName: string; onClose: () => void; onComplete: () => void; }> = ({ personName, onClose, onComplete }) => (
  <Modal isOpen={true} onClose={onClose} title={`Connect with ${personName}`}>
    <div className="space-y-4">
      <p className="text-sm text-slate-600 leading-relaxed">
        This prototype simulates the nudge process. RMI does not send messages on your behalf to maintain your relational agency.
      </p>
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Phone className="w-4 h-4" /></div>
          <div className="text-left"><span className="block text-sm font-bold">I will call them now</span><span className="text-[10px] text-slate-400 uppercase font-medium">External Action</span></div>
        </button>
        <button className="w-full flex items-center gap-3 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600"><MessageSquare className="w-4 h-4" /></div>
          <div className="text-left"><span className="block text-sm font-bold">I will send a text</span><span className="text-[10px] text-slate-400 uppercase font-medium">External Action</span></div>
        </button>
      </div>
      <div className="pt-4 flex flex-col gap-2">
        <button onClick={onComplete} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">Mark as Completed</button>
        <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600">Maybe later</button>
      </div>
    </div>
  </Modal>
);

export const ResourcesModal: React.FC<{ onClose: () => void; onOpenResource: () => void; }> = ({ onClose, onOpenResource }) => (
  <Modal isOpen={true} onClose={onClose} title="Additional Support Options">
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {[
        { title: 'Immediate Support', desc: 'Crisis hotlines and emergency services.', icon: '🆘' },
        { title: 'Professional Support', desc: 'Counseling and campus mental health resources.', icon: '🏥' },
        { title: 'Community Support', desc: 'Support groups and peer networks.', icon: '🤝' },
        { title: 'Grounding Techniques', desc: 'Brief exercises to stabilize current state.', icon: '🧘' }
      ].map((res, i) => (
        <button
          key={i}
          onClick={onOpenResource}
          className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:border-indigo-300 transition-all text-left"
        >
          <span className="text-2xl">{res.icon}</span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">{res.title}</h4>
            <p className="text-[10px] text-slate-500">{res.desc}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300" />
        </button>
      ))}
      <p className="text-[10px] text-slate-400 italic text-center py-2">This list is for prototyping purposes only. No actual diagnostic data is being shared.</p>
    </div>
  </Modal>
);

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onUpdateSettings: (s: any) => void;
  eFinal: number;
  aic: number;
  currentCase: CaseType;
  onClearHistory: () => void;
  onClearCounters: () => void;
  onReset: () => void;
  onViewOnboarding: () => void;
}> = ({ isOpen, onClose, settings, onUpdateSettings, eFinal, aic, currentCase, onClearHistory, onClearCounters, onReset, onViewOnboarding }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSending(true);
    try {
      await submitFeedback(feedbackText.trim());
      setIsSending(false);
      setFeedbackSuccess(true);
      setFeedbackText('');
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackForm(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to send feedback:', err);
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings & Transparency">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Transparency Panel */}
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Transparency Panel</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-700">Emotion (E_final):</span>
              <span className="font-bold text-indigo-900">{eFinal}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-700">AIC (Interaction Concentration):</span>
              <span className="font-bold text-indigo-900">{aic}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-700">Active Mode:</span>
              <span className="font-bold text-indigo-900">{currentCase}</span>
            </div>
          </div>
        </div>

        {/* Behavior Toggles */}
        <section>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Behavior & Visualization</h4>
          <div className="space-y-3">
            {[
              { key: 'highlightNames', label: 'Highlight mentioned names in chat' },
              { key: 'confirmBeforeAdd', label: 'Confirm before adding new person' },
              { key: 'showSupportStats', label: 'Show support type statistics in overview' },
              { key: 'showInteractionMarkers', label: 'Show interaction time markers (30d+)' }
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={e => onUpdateSettings({ ...settings, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Data & Guidance</h4>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onViewOnboarding} className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all">
              <BookOpen className="w-3.5 h-3.5" /> View Introduction Again
            </button>
            <button onClick={onClearHistory} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Clear Conversation
            </button>
            <button onClick={onClearCounters} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Clear Counters
            </button>
            <button
              onClick={onReset}
              className="col-span-2 px-3 py-3 bg-white border-2 border-rose-100 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 mt-2 group"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" /> Reset to Default
            </button>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="pt-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contribute & Feedback</h4>
          {!showFeedbackForm ? (
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Message the Designer
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {feedbackSuccess ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">Feedback Sent to Research Lab</p>
                  <p className="text-[10px] text-emerald-600">Thank you for contributing to RMI development.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3 h-3 text-indigo-400" />
                    <p className="text-[9px] font-medium text-slate-400 leading-tight">Your insights help us map the geometry of human connection more ethically.</p>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or report interface friction..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs h-28 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-slate-900 transition-shadow shadow-inner"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendFeedback}
                      disabled={!feedbackText.trim() || isSending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isSending ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Message
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowFeedbackForm(false); setFeedbackText(''); }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* About / Ethics */}
        <section className="pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 italic leading-relaxed text-center">
            RMI provides structural guidance, not clinical advice. No data leaves this interface. This interface is part of a research study on relational mediation.
          </p>
        </section>
      </div>
    </Modal>
  );
};

export const ClearConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'all' | 'history' | 'counters'
}> = ({ isOpen, onClose, onConfirm, type }) => {
  const content = {
    all: {
      title: "Reset System?",
      desc: "Reset & Restart",
      list: [
        "Relational map",
        "Interaction logs",
        "Emotion history",
        "Activity trends",
        "Mode preferences"
      ],
      warning: "This action cannot be undone."
    },
    history: {
      title: "Clear Conversation History?",
      desc: "Yes, Clear History",
      list: ["All past chat messages", "Mentioned name context from this session"],
      warning: "This will permanently delete your chat data."
    },
    counters: {
      title: "Reset Interaction Counters?",
      desc: "Yes, Reset Counters",
      list: ["AIC (AI Interaction Concentration)", "RII (Real Interaction Index)", "Rolling window trend data"],
      warning: "Interaction statistics will be zeroed out."
    }
  }[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={content.title}>
      <div className="space-y-6">
        {/* Warning Banner updated to match screenshot */}
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-50/50 border border-rose-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm font-bold text-rose-800 leading-tight">This will permanently delete:</p>
        </div>

        <div className="px-4">
          <ul className="text-sm text-slate-600 space-y-3 list-none">
            {content.list.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                {/* Refined Dot: mt-[0.5rem] ensures alignment with the first line of text-sm content */}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-[0.5rem]" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm font-bold text-rose-600 px-4">{content.warning}</p>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-[0.98] text-base"
          >
            {content.desc}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
