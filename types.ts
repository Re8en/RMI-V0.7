
export enum Ring {
  INNER = 'Inner',
  MIDDLE = 'Middle',
  OUTER = 'Outer'
}

export enum Group {
  FAMILY = 'Family',
  FRIENDS = 'Friends',
  COLLEAGUES = 'Colleagues',
  COMMUNITY = 'Community',
  OTHER = 'Other'
}

export enum SupportType {
  EMOTIONAL = 'Emotional',
  PRACTICAL = 'Practical',
  DAILY = 'Daily',
  PROFESSIONAL = 'Professional',
  OTHER = 'Other'
}

export interface Person {
  id: string;
  name: string;
  ring: Ring;
  group: Group;
  supportTypes: SupportType[];
  lastInteraction: string; // ISO date or 'Unknown'
  notes: string;
}

// --- AI Reply Engine Types (PRD v1.0) ---

export enum DialogueMode {
  M0_HOLDING = 'holding',
  M1_CLARIFY = 'clarify',
  M2_ACTION = 'action',
  M3_MEDIATION = 'mediation',
  M4_BOUNDARY = 'boundary'
}

export enum RiskLevel {
  NONE = 'none',
  R1 = 'r1',  // Passive ideation, no plan
  R2 = 'r2',  // Recurring ideation, strong despair
  R3 = 'r3'   // Active plan / in progress / threat to others
}

export enum LonelinessStructure {
  L1_NO_RESOURCE = 'l1',   // No one to contact
  L2_HARD_TO_START = 'l2', // Has people but can't initiate
  L3_EXCLUSION = 'l3',     // Group alienation / excluded
  L4_TEMPORAL = 'l4',      // Situational / time-based loneliness
  UNKNOWN = 'unknown'
}

export interface ActionButton {
  label: string;
  action: string; // 'continue' | 'select_contact' | 'write_script' | 'micro_action' | 'end_chat' | 'contact_now' | 'tomorrow'
}

export interface RecommendedContact {
  name: string;
  reason: string;
  scripts: {
    short: string;
    long: string;
  };
  lowBarrier: string; // Alternative low-effort action
}

export interface AIResponse {
  mode: DialogueMode;
  response_text: string;
  emotion_level: number; // 0-3
  structure_type: LonelinessStructure;
  dependency_risk: boolean;
  buttons: ActionButton[];
  recommended_contacts: RecommendedContact[];
  boundary_flags: boolean;
  safety_flags: RiskLevel;
  explain_card?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  aiResponse?: AIResponse; // Structured response data for AI messages
}

export enum CaseType {
  CASE1 = 'Emotional Support',
  CASE2 = 'Relational Activation',
  CASE3 = 'Structural Stability'
}

export interface MetricData {
  timestamp: number;
  aic: number;
  rii: number;
}

