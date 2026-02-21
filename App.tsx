
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Settings, Trash2, Info, Plus, ChevronDown, User, Heart, Activity, Layout, Tag, CheckCircle2, ArrowRight, LogOut } from 'lucide-react';
import {
  Person, Ring, Group, SupportType, ChatMessage, CaseType, MetricData
} from './types';
import { INITIAL_PEOPLE, GROUP_COLORS, RING_RADII } from './constants';
import RelationalMap from './components/RelationalMap';
import Conversation from './components/Conversation';
import BottomSection from './components/BottomSection';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import { AddPersonModal, EditPersonModal, ContactFlowModal, ResourcesModal, SettingsModal, ClearConfirmModal } from './components/Overlays';
import * as api from './lib/api';
import { onAuthStateChange, getSession } from './lib/api';
import { generateReply } from './lib/replyEngine';

const SESSION_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes for a new AI Session

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- ONBOARDING & RESET STATE ---
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isResetTransition, setIsResetTransition] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- MAP & CONVERSATION STATE ---
  const [people, setPeople] = useState<Person[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eUser, setEUser] = useState<number>(65);
  const [eSys, setESys] = useState(65);

  const [aiSessionCount, setAiSessionCount] = useState<number>(0);
  const [realEventCount, setRealEventCount] = useState<number>(0);
  const [sessionStartTime] = useState<number>(Date.now());

  const [windowSize, setWindowSize] = useState<'7' | '30'>('7');
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<Group | 'All'>('All');
  const [isOverviewMode, setIsOverviewMode] = useState(false);
  const [contactTarget, setContactTarget] = useState<Person | null>(null);

  const [appSettings, setAppSettings] = useState({
    highlightNames: true,
    confirmBeforeAdd: true,
    showSupportStats: true,
    showInteractionMarkers: true
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearAction, setClearAction] = useState<'all' | 'history' | 'counters' | null>(null);
  const [prefillName, setPrefillName] = useState('');

  // --- Debounce timer for state sync ---
  const stateSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- AUTH: Listen for session changes ---
  useEffect(() => {
    let mounted = true;

    // Timeout fallback: if auth check takes too long, stop loading
    const timeout = setTimeout(() => {
      if (mounted && authLoading) {
        console.warn('Auth check timed out, proceeding without session');
        setAuthLoading(false);
      }
    }, 5000);

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      if (!mounted) return;
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || '' });
      } else {
        setUser(null);
        setDataLoaded(false);
      }
      setAuthLoading(false);
    });

    // Check existing session on mount
    getSession()
      .then(session => {
        if (!mounted) return;
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        }
        setAuthLoading(false);
      })
      .catch(err => {
        console.error('Failed to get session:', err);
        if (mounted) setAuthLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // --- LOAD DATA FROM SUPABASE when user logs in ---
  useEffect(() => {
    if (!user || dataLoaded) return;

    const loadData = async () => {
      try {
        const [fetchedPeople, fetchedMessages, userState] = await Promise.all([
          api.fetchPeople(),
          api.fetchMessages(),
          api.fetchOrCreateUserState(),
        ]);
        setPeople(fetchedPeople);
        setMessages(fetchedMessages);
        setEUser(userState.e_user);
        setAiSessionCount(userState.ai_session_count);
        setRealEventCount(userState.real_event_count);
        setIsOnboardingComplete(userState.onboarding_complete);
        setAppSettings(userState.settings);
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        setDataLoaded(true); // proceed with defaults
      }
    };
    loadData();
  }, [user, dataLoaded]);

  // --- DEBOUNCED STATE SYNC TO SUPABASE ---
  const syncUserState = useCallback(() => {
    if (!user || !dataLoaded) return;
    if (stateSyncTimer.current) clearTimeout(stateSyncTimer.current);
    stateSyncTimer.current = setTimeout(async () => {
      try {
        await api.updateUserState({
          e_user: eUser,
          ai_session_count: aiSessionCount,
          real_event_count: realEventCount,
          onboarding_complete: isOnboardingComplete,
          settings: appSettings,
        });
      } catch (err) {
        console.error('Failed to sync user state:', err);
      }
    }, 1000);
  }, [user, dataLoaded, eUser, aiSessionCount, realEventCount, isOnboardingComplete, appSettings]);

  useEffect(() => {
    if (user && dataLoaded) {
      syncUserState();
    }
  }, [eUser, aiSessionCount, realEventCount, isOnboardingComplete, appSettings, syncUserState]);

  // --- INTERACTION SIGNAL CALCULATION (PRD V1.1) ---
  const calculateESys = useCallback((history: ChatMessage[]) => {
    const window = history.filter(m => m.sender === 'user').slice(-8);
    if (window.length === 0) return 65;

    const highArousal = ['崩溃', '绝望', '受不了', '孤独', '痛苦', '害怕', '恐慌', '难受', '压抑', '崩了', 'verzweifelt', 'kaputt', 'allein', 'sinnlos', 'hilflos', 'traurig', 'panisch', 'overwhelmed', 'devastated', 'hopeless', 'lonely', 'worthless', 'helpless', 'anxious', 'panic', 'exhausted', 'broken', 'desperate'];
    const helpless = ['没有人', '没人理解', '做不到', '不行', '没用', '算了', '没意义', 'niemand', 'ich kann nicht', 'macht keinen Sinn', 'keine Hoffnung', 'no one', 'I can\'t', 'it doesn\'t matter', 'what\'s the point', 'nothing helps', 'I give up'];

    let totalWords = 0;
    let highArousalCount = 0;
    let helplessCount = 0;
    let intensityCount = 0;
    const keywordMap: Record<string, number> = {};

    window.forEach(msg => {
      const text = msg.text.toLowerCase();
      const words = text.split(/\s+/);
      totalWords += words.length;

      highArousal.forEach(w => { if (text.includes(w)) highArousalCount++; });
      helpless.forEach(w => { if (text.includes(w)) helplessCount++; });

      intensityCount += (text.match(/!{2,}/g) || []).length;
      intensityCount += (text.match(/\?{2,}/g) || []).length;
      intensityCount += (text.match(/\.{3,}/g) || []).length;
      if (text === text.toUpperCase() && text.length > 3) intensityCount++;

      words.forEach(w => {
        if (w.length > 3) keywordMap[w] = (keywordMap[w] || 0) + 1;
      });
    });

    const f1 = Math.min(1, highArousalCount / (totalWords || 1));
    const f2 = Math.min(1, helplessCount / window.length);
    const f3 = Math.min(1, intensityCount / window.length);

    let maxRep = 0;
    Object.values(keywordMap).forEach(v => { if (v > maxRep) v = v; });
    const f4 = maxRep >= 3 ? 1 : maxRep / 3;

    const signalNorm = (f1 + f2 + f3 + f4) / 4;
    return Math.round(signalNorm * 100);
  }, []);

  // --- DERIVED DATA (NEW AIC LOGIC) ---
  const eFinal = useMemo(() => Math.round(0.7 * eUser + 0.3 * eSys), [eUser, eSys]);

  const { aic, rii } = useMemo(() => {
    const total = aiSessionCount + realEventCount;
    if (total === 0) return { aic: 0, rii: 100 };
    const aicVal = Math.round((aiSessionCount / total) * 100);
    return { aic: aicVal, rii: 100 - aicVal };
  }, [aiSessionCount, realEventCount]);

  const currentCase = useMemo((): CaseType => {
    if (eFinal >= 75) return CaseType.CASE1;
    if (eFinal < 75 && aic >= 65) return CaseType.CASE2;
    return CaseType.CASE3;
  }, [eFinal, aic]);

  const suggestedPeople = useMemo(() => {
    if (people.length === 0) return [];
    const mentionedNames = new Set<string>();
    messages.forEach(m => {
      people.forEach(p => {
        if (m.text.toLowerCase().includes(p.name.toLowerCase())) {
          mentionedNames.add(p.name.toLowerCase());
        }
      });
    });
    const now = new Date();
    const scoredPeople = people.map(p => {
      let D = 0.3;
      if (p.ring === Ring.INNER) D = 1.0;
      else if (p.ring === Ring.MIDDLE) D = 0.6;
      let T = 0.5;
      if (p.lastInteraction !== 'Unknown') {
        const interactionDate = new Date(p.lastInteraction);
        const diffDays = Math.ceil(Math.abs(now.getTime() - interactionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) T = 0.1;
        else if (diffDays <= 30) T = 1.0;
        else if (diffDays <= 90) T = 0.7;
        else T = 0.5;
      }
      let S = 0.7;
      if (eFinal >= 60 && eFinal <= 74) {
        S = p.supportTypes.includes(SupportType.EMOTIONAL) ? 1.0 : 0.5;
      } else if (eFinal < 40) {
        S = p.supportTypes.includes(SupportType.DAILY) ? 1.0 : 0.5;
      }
      const R = mentionedNames.has(p.name.toLowerCase()) ? 1.0 : 0.5;
      const ras = (0.4 * D) + (0.3 * T) + (0.2 * S) + (0.1 * R);
      return { person: p, score: ras };
    });
    scoredPeople.sort((a, b) => b.score - a.score);
    return scoredPeople.slice(0, 3).map(s => s.person);
  }, [people, messages, eFinal]);

  // --- ACTIONS ---
  const handleSendMessage = useCallback(async (text: string) => {
    const now = Date.now();
    const newUserMsg: ChatMessage = { id: now.toString(), sender: 'user', text, timestamp: now };

    // Check for Session threshold (30 mins)
    const lastMsg = messages.filter(m => m.sender === 'user').pop();
    if (!lastMsg || (now - lastMsg.timestamp > SESSION_THRESHOLD_MS)) {
      setAiSessionCount(prev => prev + 1);
    }

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    // Update E_sys based on PRD v1.1 rules
    setESys(calculateESys(updatedMessages));

    // Persist user message to Supabase
    api.addMessage(newUserMsg).catch(err => console.error('Failed to save user message:', err));

    try {
      // Use the full Reply Engine (PRD v1.0)
      const aiResponse = await generateReply({
        messages: updatedMessages,
        people,
        emotionLevel: eFinal,
        aic,
        rii,
        aiSessionCount,
        sessionStartTime,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponse.response_text,
        timestamp: Date.now(),
        aiResponse, // Store structured response for rendering
      };
      setMessages(prev => [...prev, aiMsg]);
      // Persist AI message to Supabase
      api.addMessage(aiMsg).catch(err => console.error('Failed to save AI message:', err));
    } catch (err) {
      console.error(err);
    }
  }, [messages, calculateESys]);

  const handleAddPerson = async (p: Partial<Person>) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: p.name || 'Unknown',
      ring: p.ring || Ring.OUTER,
      group: p.group || Group.OTHER,
      supportTypes: p.supportTypes || [],
      lastInteraction: p.lastInteraction || 'Unknown',
      notes: p.notes || ''
    };

    try {
      const savedPerson = await api.addPerson(newPerson);
      setPeople(prev => [...prev, savedPerson]);
    } catch (err) {
      console.error('Failed to add person:', err);
      // Fallback to local state
      setPeople(prev => [...prev, newPerson]);
    }
    setIsAddModalOpen(false);
    setPrefillName('');
  };

  const handleUpdatePerson = async (p: Person) => {
    setPeople(prev => prev.map(item => item.id === p.id ? p : item));
    setIsEditModalOpen(false);
    api.updatePerson(p).catch(err => console.error('Failed to update person:', err));
  };

  const handleDeletePerson = async (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    setIsEditModalOpen(false);
    setSelectedPersonId(null);
    api.deletePerson(id).catch(err => console.error('Failed to delete person:', err));
  };

  const handleCompleteAction = () => {
    if (contactTarget) {
      const today = new Date().toISOString().split('T')[0];
      setPeople(prev => prev.map(p => {
        if (p.id === contactTarget.id) {
          const updated = { ...p, lastInteraction: today };
          api.updatePerson(updated).catch(err => console.error('Failed to update person:', err));
          return updated;
        }
        return p;
      }));
    }
    // Increment Real Event Count
    setRealEventCount(prev => prev + 1);
    setIsContactModalOpen(false);
    setContactTarget(null);
  };

  const handleResourceOpen = () => {
    // Increment Real Event Count (Seeking external resources counts as a real engagement effort)
    setRealEventCount(prev => prev + 1);
  };

  const handleConfirmClear = async () => {
    if (clearAction === 'all') {
      setPeople([]);
      setMessages([]);
      setEUser(65);
      setESys(65);
      setAiSessionCount(0);
      setRealEventCount(0);
      setPrefillName('');
      setSelectedPersonId(null);
      setIsOverviewMode(false);

      // Clear all Supabase data
      try {
        await Promise.all([
          api.deleteAllPeople(),
          api.clearMessages(),
          api.resetUserState(),
        ]);
      } catch (err) {
        console.error('Failed to clear Supabase data:', err);
      }

      setIsClearModalOpen(false);
      setClearAction(null);
      setIsResetTransition(true);
      return;
    } else if (clearAction === 'history') {
      setMessages([]);
      api.clearMessages().catch(err => console.error('Failed to clear messages:', err));
    } else if (clearAction === 'counters') {
      setAiSessionCount(0);
      setRealEventCount(0);
    }
    setClearAction(null);
    setIsClearModalOpen(false);
  };

  const handleStartAfterReset = () => {
    setIsResetTransition(false);
    setIsOnboardingComplete(false);
  };

  const handleOnboardingComplete = async (initialPeople: Person[]) => {
    setIsOnboardingComplete(true);

    // Save people to Supabase
    const savedPeople: Person[] = [];
    for (const p of initialPeople) {
      try {
        const saved = await api.addPerson(p);
        savedPeople.push(saved);
      } catch (err) {
        console.error('Failed to save person during onboarding:', err);
        savedPeople.push(p); // fallback
      }
    }
    setPeople(savedPeople);
  };

  const handleLogout = async () => {
    try {
      await api.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setDataLoaded(false);
    setPeople([]);
    setMessages([]);
    setEUser(65);
    setESys(65);
    setAiSessionCount(0);
    setRealEventCount(0);
    setIsOnboardingComplete(false);
  };

  const handleMovePerson = (id: string, ring: Ring) => {
    if (confirm(`Move to ${ring}?`)) {
      setPeople(prev => prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ring };
          api.updatePerson(updated).catch(err => console.error('Failed to update person:', err));
          return updated;
        }
        return p;
      }));
    }
  };

  const modeLabels = {
    [CaseType.CASE1]: 'Emotional Holding Mode',
    [CaseType.CASE2]: 'Relational Activation Mode',
    [CaseType.CASE3]: 'Reflective Stability Mode'
  };

  // 0. Loading
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // 1. Auth Guard
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // 2. Data loading
  if (!dataLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading your relational map...</p>
        </div>
      </div>
    );
  }

  // Reset Transition Screen
  if (isResetTransition) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">System Reset Complete.</h2>
        <div className="space-y-2 text-slate-500 max-sm mb-12">
          <p className="text-lg">Your relational map has been cleared.</p>
          <p className="text-sm">Let's begin again.</p>
        </div>
        <button
          onClick={handleStartAfterReset}
          className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 group"
        >
          Start <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 animate-in fade-in duration-700">
      {/* Global Status Bar */}
      <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center shadow-md shadow-indigo-100">
              <Layout className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900">RMI <span className="text-indigo-600">v0.7</span></h1>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            {modeLabels[currentCase]}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 group relative">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Emotion: {eFinal}%</span>
                <span className="text-[10px] text-slate-400">({eUser !== eSys ? 'adjusted' : 'estimated'})</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full relative ml-2 overflow-visible">
                  <div className="h-full bg-rose-400 rounded-full transition-all duration-300 ease-out" style={{ width: `${eFinal}%` }} />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-rose-400 rounded-full shadow-md pointer-events-none transition-all duration-300 ease-out group-hover:scale-125 group-hover:shadow-rose-200 group-hover:shadow-lg"
                    style={{ left: `calc(${eFinal}% - 7px)` }}
                  />
                  <input
                    type="range" min="0" max="100" value={eUser}
                    onChange={(e) => setEUser(parseInt(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                {/* Simplified Emotion Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 text-white text-[10px] p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-50 shadow-2xl">
                  <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    Emotional Calibration
                  </p>
                  <div className="text-slate-400 space-y-2.5 leading-relaxed">
                    <p>Adjust the slider to inform the system how intense your current feelings are. This calibrates our supportive intervention logic.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1 group relative cursor-help">
                <Activity className="w-4 h-4 text-indigo-400" />
                AIC {aic}%
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 text-white text-[10px] p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-50 shadow-2xl">
                  <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    AI Interaction Concentration
                  </p>
                  <p className="text-slate-400 leading-relaxed">Measures what percentage of your total interactions are with AI vs. real people. A high AIC suggests over-reliance on AI — the system will nudge you toward real connections.</p>
                </div>
              </div>
              <div className="h-3 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-1 group relative cursor-help">
                <Heart className="w-4 h-4 text-rose-400" />
                RII {rii}%
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 text-white text-[10px] p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-50 shadow-2xl">
                  <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    Real Interaction Index
                  </p>
                  <p className="text-slate-400 leading-relaxed">Tracks the proportion of real-world relational actions (contacting someone, using resources) compared to total activity. Higher RII = healthier relational balance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        <section className="w-1/2 flex flex-col border-r border-slate-200 bg-white relative">
          <RelationalMap
            people={people}
            selectedId={selectedPersonId}
            onSelect={(id) => {
              if (selectedPersonId === id) {
                setIsEditModalOpen(true); // Second click opens edit
              } else {
                setSelectedPersonId(id);
              }
            }}
            onMove={handleMovePerson}
            filter={groupFilter}
            isOverview={isOverviewMode}
            settings={appSettings}
          />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value as any)}
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-slate-900"
                >
                  <option value="All">All Groups</option>
                  {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Person
            </button>
          </div>
        </section>

        <section className="w-1/2 flex flex-col bg-slate-50">
          <Conversation
            messages={messages}
            onSendMessage={handleSendMessage}
            people={people}
            onNameClick={(name) => {
              const existing = people.find(p => p.name.toLowerCase() === name.toLowerCase());
              if (existing) {
                setSelectedPersonId(prev => prev === existing.id ? null : existing.id);
              } else {
                setPrefillName(name);
                setIsAddModalOpen(true);
              }
            }}
            settings={appSettings}
          />
        </section>
      </main>

      <footer className="h-40 bg-white border-t border-slate-200 flex items-center shrink-0 z-30">
        <BottomSection
          currentCase={currentCase}
          aic={aic}
          windowSize={windowSize}
          setWindowSize={setWindowSize}
          isDismissed={isDismissed}
          setIsDismissed={setIsDismissed}
          suggestedPeople={suggestedPeople}
          onAction={(person) => {
            if (currentCase === CaseType.CASE1) setIsResourcesModalOpen(true);
            else if (currentCase === CaseType.CASE2) {
              if (person) { setContactTarget(person); setIsContactModalOpen(true); }
            } else if (currentCase === CaseType.CASE3) setIsOverviewMode(prev => !prev);
          }}
          isOverviewMode={isOverviewMode}
        />
      </footer>

      {isAddModalOpen && <AddPersonModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddPerson} initialName={prefillName} />}
      {isEditModalOpen && selectedPersonId && (
        <EditPersonModal person={people.find(p => p.id === selectedPersonId)!} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdatePerson} onDelete={handleDeletePerson} />
      )}
      {isContactModalOpen && <ContactFlowModal personName={contactTarget?.name || 'Someone'} onClose={() => { setIsContactModalOpen(false); setContactTarget(null); }} onComplete={handleCompleteAction} />}
      {isResourcesModalOpen && <ResourcesModal onClose={() => setIsResourcesModalOpen(false)} onOpenResource={handleResourceOpen} />}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={appSettings} onUpdateSettings={setAppSettings} eFinal={eFinal} aic={aic} currentCase={currentCase}
          onClearHistory={() => { setClearAction('history'); setIsSettingsModalOpen(false); setIsClearModalOpen(true); }}
          onClearCounters={() => { setClearAction('counters'); setIsSettingsModalOpen(false); setIsClearModalOpen(true); }}
          onReset={() => { setClearAction('all'); setIsSettingsModalOpen(false); setIsClearModalOpen(true); }}
          onViewOnboarding={() => {
            setIsSettingsModalOpen(false);
            setIsOnboardingComplete(false);
          }}
        />
      )}
      {isClearModalOpen && <ClearConfirmModal isOpen={isClearModalOpen} onClose={() => { setIsClearModalOpen(false); setClearAction(null); }} onConfirm={handleConfirmClear} type={clearAction || 'all'} />}
    </div>
  );
};

export default App;