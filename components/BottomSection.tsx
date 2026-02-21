
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, ExternalLink, Users, AlertCircle, ShieldCheck, RotateCcw, Info, ArrowUpRight } from 'lucide-react';
import { CaseType, Person } from '../types';

interface BottomSectionProps {
  currentCase: CaseType;
  aic: number;
  windowSize: '7' | '30';
  setWindowSize: (s: '7' | '30') => void;
  isDismissed: boolean;
  setIsDismissed: (d: boolean) => void;
  suggestedPeople: Person[];
  onAction: (person?: Person) => void;
  isOverviewMode?: boolean;
}

const BottomSection: React.FC<BottomSectionProps> = ({
  currentCase, aic, windowSize, setWindowSize, isDismissed, setIsDismissed, suggestedPeople, onAction, isOverviewMode = false
}) => {
  const [showRankExplanation, setShowRankExplanation] = useState(false);

  // Generate dynamic trend data based on windowSize
  const trendData = useMemo(() => {
    const size = parseInt(windowSize);
    const data = [];
    const now = new Date();

    for (let i = size - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const isToday = i === 0;
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dayLabel = `${month}/${day}${isToday ? ' (Today)' : ''}`;

      const seed = date.getDate() + date.getMonth();
      const baseAic = isToday ? aic : (40 + (seed % 20));

      data.push({
        name: dayLabel,
        fullDate: date.toLocaleDateString('en-US'),
        aic: baseAic,
        rii: 100 - baseAic
      });
    }
    return data;
  }, [windowSize, aic]);

  const renderCard = () => {
    if (isDismissed) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl h-24 gap-2 transition-all group">
          <p className="text-xs text-slate-400 font-medium">Nudge dismissed for today. Will reappear on mode shift.</p>
          <button
            onClick={() => setIsDismissed(false)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            Restore Recommendation
          </button>
        </div>
      );
    }

    switch (currentCase) {
      case CaseType.CASE1:
        return (
          <div className="flex-1 bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">High emotional intensity detected</h3>
              <p className="text-xs text-rose-700 mt-1">Consider professional or community support options.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onAction()}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                >
                  View Support Options
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      case CaseType.CASE2:
        return (
          <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 animate-in slide-in-from-bottom-2 duration-300 relative overflow-visible">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-900 text-balance">Real-world interaction has decreased</h3>
                <button
                  onClick={() => setShowRankExplanation(!showRankExplanation)}
                  className="p-1 text-amber-400 hover:text-amber-600 transition-colors rounded-full hover:bg-amber-100"
                  title="How suggestions are ranked"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Reconnect with someone in your network.
                {suggestedPeople.length > 0 && (
                  <span className="ml-1">
                    Suggested: {suggestedPeople.map(p => `${p.name} (${p.ring})`).join(', ')}
                  </span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedPeople.map(person => (
                  <button
                    key={person.id}
                    onClick={() => onAction(person)}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200 active:scale-95"
                  >
                    Contact {person.name}
                  </button>
                ))}
                {suggestedPeople.length === 0 && (
                  <button
                    onClick={() => onAction()}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Contact Network
                  </button>
                )}
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 border border-amber-200 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Ranking Logic Popover */}
            {showRankExplanation && (
              <div className="absolute bottom-full right-0 mb-4 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">How suggestions are ranked</h4>
                  <button onClick={() => setShowRankExplanation(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex gap-2">
                    <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600">
                      <span className="font-bold block text-slate-800">Relational distance</span>
                      Prioritizes closer rings (Inner {'>'} Middle {'>'} Outer)
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600">
                      <span className="font-bold block text-slate-800">Interaction recency</span>
                      Highlights "gentle disconnects" (7–30 days)
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600">
                      <span className="font-bold block text-slate-800">Support type match</span>
                      Matches contact strengths to your current emotion
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600">
                      <span className="font-bold block text-slate-800">Psychological attention</span>
                      Checks who you've mentioned recently in chat
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        );
      case CaseType.CASE3:
      default:
        return (
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-900">Structural balance maintained</h3>
              <p className="text-xs text-emerald-700 mt-1">AI and real-world interactions are proportionate. Keep reflecting.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onAction()}
                  className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${isOverviewMode ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {isOverviewMode ? 'Exit Overview' : 'View Overview'}
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full flex px-6 py-4 gap-8 h-full items-stretch">
      {/* Left: Trend Graph */}
      <div className="w-1/3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity Trend</span>
          <select
            value={windowSize}
            onChange={(e) => setWindowSize(e.target.value as any)}
            className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold focus:outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-100 p-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: 5, right: 35, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                fontSize={8}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8' }}
                interval={windowSize === '30' ? 6 : 0}
                padding={{ left: 10, right: 10 }}
              />
              <Tooltip
                labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Line
                type="monotone"
                dataKey="aic"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rii"
                stroke="#fb7185"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Action Card */}
      <div className="flex-1 flex flex-col justify-center">
        {renderCard()}
      </div>
    </div>
  );
};

export default BottomSection;
