
import { Person, Ring, Group, SupportType } from './types';

export const INITIAL_PEOPLE: Person[] = [
  {
    id: '1',
    name: 'Mom',
    ring: Ring.INNER,
    group: Group.FAMILY,
    supportTypes: [SupportType.EMOTIONAL, SupportType.PRACTICAL],
    lastInteraction: '2026-02-19',
    notes: 'Primary emotional support'
  },
  {
    id: '2',
    name: 'Manuel',
    ring: Ring.MIDDLE,
    group: Group.FRIENDS,
    supportTypes: [SupportType.DAILY],
    lastInteraction: '2026-01-22',
    notes: 'Gym buddy'
  },
  {
    id: '3',
    name: 'Dr. Lee',
    ring: Ring.OUTER,
    group: Group.OTHER,
    supportTypes: [SupportType.PROFESSIONAL],
    lastInteraction: '2024-04-10',
    notes: 'Professional contact'
  }
];

export const GROUP_COLORS: Record<Group, string> = {
  [Group.FAMILY]: 'bg-rose-400',
  [Group.FRIENDS]: 'bg-sky-400',
  [Group.COLLEAGUES]: 'bg-emerald-400',
  [Group.COMMUNITY]: 'bg-amber-400',
  [Group.OTHER]: 'bg-slate-400'
};

export const RING_RADII = {
  [Ring.INNER]: 70,
  [Ring.MIDDLE]: 140,
  [Ring.OUTER]: 210
};
