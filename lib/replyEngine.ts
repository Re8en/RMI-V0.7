import { Person, ChatMessage, AIResponse, DialogueMode, RiskLevel, LonelinessStructure } from '../types';
import { buildSystemPrompt, PromptContext } from './systemPrompt';

/**
 * RMI v0.7 Reply Engine
 * Builds context, calls Gemini, parses structured JSON response.
 */

// Crisis keywords for pre-screening (safety net before LLM)
const CRISIS_KEYWORDS_R3 = [
    '想死', '去死', '自杀', '结束生命', '不想活', '杀了',
    'kill myself', 'suicide', 'end my life', 'want to die', 'hurt myself',
    'umbringen', 'selbstmord', 'suizid', 'sterben wollen', 'nicht mehr leben', 'mich töten'
];
const CRISIS_KEYWORDS_R2 = [
    '活着没意思', '绝望', '崩溃了', '受不了了', '撑不下去',
    'hopeless', 'can\'t go on', 'breaking down', 'no point', 'give up',
    'hoffnungslos', 'kann nicht mehr', 'halte es nicht aus', 'keinen sinn', 'zusammengebrochen', 'am ende'
];

export interface ReplyContext {
    messages: ChatMessage[];
    people: Person[];
    emotionLevel: number;
    aic: number;
    rii: number;
    aiSessionCount: number;
    sessionStartTime: number;
    userSettings?: {
        allowContactRecommendation?: boolean;
        allowScriptGeneration?: boolean;
        allowCrisisResources?: boolean;
    };
}

/**
 * Pre-screen for crisis keywords (safety net, runs before LLM)
 */
function preCrisisCheck(text: string): RiskLevel {
    const lower = text.toLowerCase();
    if (CRISIS_KEYWORDS_R3.some(k => lower.includes(k))) return RiskLevel.R3;
    if (CRISIS_KEYWORDS_R2.some(k => lower.includes(k))) return RiskLevel.R2;
    return RiskLevel.NONE;
}

/**
 * Build conversation context for the system prompt
 */
function buildConversationSummary(messages: ChatMessage[], maxTurns: number = 10): string {
    const recent = messages.slice(-maxTurns * 2); // last N turns (each turn = user + ai)
    if (recent.length === 0) return '';

    return recent.map(m => {
        const role = m.sender === 'user' ? 'User' : 'RMI';
        const truncated = m.text.length > 200 ? m.text.substring(0, 200) + '...' : m.text;
        return `${role}: ${truncated}`;
    }).join('\n');
}

/**
 * Build multi-turn message array for Gemini API
 */
function buildGeminiContents(messages: ChatMessage[], maxTurns: number = 10) {
    const recent = messages.slice(-maxTurns * 2);
    return recent.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{
            text: m.sender === 'ai' && m.aiResponse
                ? JSON.stringify(m.aiResponse)  // Send structured data back for context
                : m.text
        }]
    }));
}

/**
 * Parse JSON from Gemini response, with fallback
 */
function parseAIResponse(rawText: string): AIResponse {
    try {
        // Try to extract JSON from the response (Gemini might wrap it in markdown)
        let jsonStr = rawText;

        // Remove markdown code fences if present
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(jsonStr);

        // Validate required fields and provide defaults
        return {
            mode: parsed.mode || DialogueMode.M2_ACTION,
            response_text: parsed.response_text || rawText,
            emotion_level: typeof parsed.emotion_level === 'number' ? parsed.emotion_level : 1,
            structure_type: parsed.structure_type || LonelinessStructure.UNKNOWN,
            dependency_risk: !!parsed.dependency_risk,
            buttons: Array.isArray(parsed.buttons) ? parsed.buttons.slice(0, 3) : [],
            recommended_contacts: Array.isArray(parsed.recommended_contacts) ? parsed.recommended_contacts : [],
            boundary_flags: !!parsed.boundary_flags,
            safety_flags: parsed.safety_flags || RiskLevel.NONE,
            explain_card: parsed.explain_card || undefined,
        };
    } catch {
        // Fallback: treat raw text as plain response
        console.warn('Failed to parse AI JSON response, using fallback');
        return {
            mode: DialogueMode.M2_ACTION,
            response_text: rawText,
            emotion_level: 1,
            structure_type: LonelinessStructure.UNKNOWN,
            dependency_risk: false,
            buttons: [{ label: 'Continue', action: 'continue' }],
            recommended_contacts: [],
            boundary_flags: false,
            safety_flags: RiskLevel.NONE,
        };
    }
}

/**
 * Main entry point: generate a structured AI reply
 */
export async function generateReply(ctx: ReplyContext): Promise<AIResponse> {
    const { messages, people, emotionLevel, aic, rii, aiSessionCount, sessionStartTime } = ctx;

    const lastUserMsg = messages.filter(m => m.sender === 'user').pop();
    if (!lastUserMsg) {
        return {
            mode: DialogueMode.M1_CLARIFY,
            response_text: 'Hi! What would you like to talk about regarding your relationships?',
            emotion_level: 0,
            structure_type: LonelinessStructure.UNKNOWN,
            dependency_risk: false,
            buttons: [{ label: 'Continue', action: 'continue' }],
            recommended_contacts: [],
            boundary_flags: false,
            safety_flags: RiskLevel.NONE,
        };
    }

    // Step 0: Pre-crisis check (safety net)
    const crisisLevel = preCrisisCheck(lastUserMsg.text);

    // Build context
    const sessionDurationMin = Math.round((Date.now() - sessionStartTime) / 60000);
    const conversationSummary = buildConversationSummary(messages);

    const promptCtx: PromptContext = {
        people,
        emotionLevel,
        aic,
        rii,
        sessionDurationMin,
        aiSessionCount,
        conversationSummary,
        userSettings: {
            allowContactRecommendation: ctx.userSettings?.allowContactRecommendation ?? true,
            allowScriptGeneration: ctx.userSettings?.allowScriptGeneration ?? true,
            allowCrisisResources: ctx.userSettings?.allowCrisisResources ?? true,
        }
    };

    const systemPrompt = buildSystemPrompt(promptCtx);

    // If pre-screening detected crisis, add an override instruction
    let crisisOverride = '';
    if (crisisLevel === RiskLevel.R3) {
        crisisOverride = '\n\n⚠️ SYSTEM OVERRIDE: Crisis keywords detected (R3). You MUST follow the R3 safety protocol immediately. Set safety_flags to "r3".';
    } else if (crisisLevel === RiskLevel.R2) {
        crisisOverride = '\n\n⚠️ SYSTEM OVERRIDE: Distress keywords detected (R2). You MUST follow the R2 safety protocol. Set safety_flags to "r2".';
    }

    // Build multi-turn contents
    const contents = buildGeminiContents(messages);

    // Call Gemini
    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
        console.error('VITE_GEMINI_API_KEY not set');
        return parseAIResponse('API key not configured.');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt + crisisOverride }] },
                    contents,
                    generationConfig: {
                        responseMimeType: 'application/json',
                    }
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Gemini API error ${response.status}:`, errText);
            throw new Error(`Gemini API error ${response.status}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '...';

        const aiResponse = parseAIResponse(rawText);

        // Safety net: if pre-screening found crisis but LLM didn't flag it, override
        if (crisisLevel !== RiskLevel.NONE && aiResponse.safety_flags === RiskLevel.NONE) {
            aiResponse.safety_flags = crisisLevel;
        }

        return aiResponse;
    } catch (err) {
        console.error('Reply engine error:', err);
        return {
            mode: DialogueMode.M0_HOLDING,
            response_text: 'Sorry, I\'m experiencing a technical issue right now. Please try again later, or reach out to someone you trust if you need support.',
            emotion_level: 1,
            structure_type: LonelinessStructure.UNKNOWN,
            dependency_risk: false,
            buttons: [{ label: 'Retry', action: 'continue' }],
            recommended_contacts: [],
            boundary_flags: false,
            safety_flags: RiskLevel.NONE,
        };
    }
}
