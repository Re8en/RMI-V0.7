
import React, { useMemo } from 'react';
import { Person, Ring, Group, SupportType } from '../types';
import { RING_RADII, GROUP_COLORS } from '../constants';

interface RelationalMapProps {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, newRing: Ring) => void;
  filter: Group | 'All';
  isOverview?: boolean;
  settings?: {
    showSupportStats: boolean;
    showInteractionMarkers: boolean;
  };
}

const RelationalMap: React.FC<RelationalMapProps> = ({ 
  people, selectedId, onSelect, onMove, filter, isOverview = false, settings = { showSupportStats: true, showInteractionMarkers: true }
}) => {
  const filteredPeople = people.filter(p => filter === 'All' || p.group === filter);

  // Helper to arrange people in a circle
  const getCoordinates = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const groups = {
    [Ring.INNER]: filteredPeople.filter(p => p.ring === Ring.INNER),
    [Ring.MIDDLE]: filteredPeople.filter(p => p.ring === Ring.MIDDLE),
    [Ring.OUTER]: filteredPeople.filter(p => p.ring === Ring.OUTER)
  };

  // Support Type micro-statistics for Overview mode
  const supportStats = useMemo(() => {
    const stats: Record<string, number> = {};
    people.forEach(p => {
      p.supportTypes.forEach(st => {
        stats[st] = (stats[st] || 0) + 1;
      });
    });
    return stats;
  }, [people]);

  // Interaction risk check
  const isStale = (dateStr: string) => {
    if (dateStr === 'Unknown') return true;
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    } catch {
      return true;
    }
  };

  /**
   * Dynamic sizing logic:
   * Base size is 52px (slightly larger than original 48px).
   * Maximum size is 64px for immediate interactions.
   * Minimum size is 46px for very old/unknown interactions.
   */
  const getPersonSize = (lastInteraction: string) => {
    const minSize = 48; // px
    const maxSize = 64; // px
    if (lastInteraction === 'Unknown') return minSize;

    try {
      const date = new Date(lastInteraction);
      const now = new Date();
      // Use absolute value to handle future mock dates gracefully (as 'recent')
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      // We scale linearly from 0 to 60 days. Anything over 60 days gets minSize.
      const factor = Math.max(0, 1 - (diffDays / 60));
      return minSize + (maxSize - minSize) * factor;
    } catch {
      return minSize;
    }
  };

  return (
    <div 
      className="flex-1 w-full flex items-center justify-center bg-slate-50 overflow-hidden select-none"
      onClick={() => onSelect(null)}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Rings */}
        <div 
          className={`relational-ring transition-all duration-500 ${isOverview ? 'border-indigo-300 border-2' : 'border-slate-200'}`} 
          style={{ width: RING_RADII[Ring.INNER] * 2, height: RING_RADII[Ring.INNER] * 2 }} 
        />
        <div 
          className={`relational-ring transition-all duration-500 ${isOverview ? 'border-indigo-300 border-2' : 'border-slate-200'}`} 
          style={{ width: RING_RADII[Ring.MIDDLE] * 2, height: RING_RADII[Ring.MIDDLE] * 2 }} 
        />
        <div 
          className={`relational-ring transition-all duration-500 ${isOverview ? 'border-indigo-300 border-2' : 'border-slate-200'}`} 
          style={{ width: RING_RADII[Ring.OUTER] * 2, height: RING_RADII[Ring.OUTER] * 2 }} 
        />

        {/* Labels */}
        <div className="absolute top-[50%] left-[50%] translate-y-[55px] -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          Inner {isOverview && <span className="text-indigo-400 bg-indigo-50 px-1 rounded">({groups[Ring.INNER].length})</span>}
        </div>
        <div className="absolute top-[50%] left-[50%] translate-y-[125px] -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          Middle {isOverview && <span className="text-indigo-400 bg-indigo-50 px-1 rounded">({groups[Ring.MIDDLE].length})</span>}
        </div>
        <div className="absolute top-[50%] left-[50%] translate-y-[195px] -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          Outer {isOverview && <span className="text-indigo-400 bg-indigo-50 px-1 rounded">({groups[Ring.OUTER].length})</span>}
        </div>

        {/* Center Node */}
        <div className="z-10 w-16 h-16 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-sm tracking-tight">
          YOU
        </div>

        {/* Person Nodes */}
        {Object.entries(groups).map(([ring, ringPeople]) => (
          ringPeople.map((p, i) => {
            const coords = getCoordinates(i, ringPeople.length, RING_RADII[ring as Ring]);
            const stale = isStale(p.lastInteraction);
            const size = getPersonSize(p.lastInteraction);
            
            return (
              <div
                key={p.id}
                onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const rings = [Ring.INNER, Ring.MIDDLE, Ring.OUTER];
                  const currentIdx = rings.indexOf(p.ring);
                  const nextRing = rings[(currentIdx + 1) % 3];
                  onMove(p.id, nextRing);
                }}
                className={`absolute rounded-full cursor-pointer border-4 border-white shadow-lg transition-all duration-300 flex items-center justify-center
                  ${GROUP_COLORS[p.group]} text-white text-[10px] font-bold text-center p-1 leading-tight
                  ${selectedId === p.id ? 'ring-4 ring-indigo-500 scale-110' : 'hover:scale-110 active:scale-95'}
                `}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translate(calc(-50% + ${coords.x}px), calc(-50% + ${coords.y}px))`
                }}
              >
                {p.name}
                {isOverview && settings.showInteractionMarkers && stale && (
                  <div className="absolute -top-1 -right-1 bg-slate-500 text-[8px] text-white px-1 rounded border border-white font-medium shadow-sm">
                    30d+
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
      
      {/* Support Stats Overlay (Corner) */}
      {isOverview && settings.showSupportStats && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 z-20">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Support Distribution</h4>
          <div className="space-y-1.5">
            {Object.entries(supportStats).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-medium text-slate-600">{type}</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">{count}</span>
              </div>
            ))}
            {Object.keys(supportStats).length === 0 && <span className="text-[10px] text-slate-400">No support data</span>}
          </div>
        </div>
      )}

      {/* Interaction Hint */}
      {!isOverview && (
        <div className="absolute top-4 right-4 text-[10px] text-slate-400 font-medium bg-white/50 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
          Click to edit
        </div>
      )}
    </div>
  );
};

export default RelationalMap;
