import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, Shield, Phone, Copy, ChevronDown, ChevronUp, Users, Heart } from 'lucide-react';
import { ChatMessage, Person, AIResponse, DialogueMode, RiskLevel } from '../types';

interface ConversationProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onNameClick: (name: string) => void;
  onActionButton?: (action: string) => void;
  people: Person[];
  settings?: {
    highlightNames: boolean;
  };
}

// Mode badge colors
const MODE_STYLES: Record<string, { label: string; color: string }> = {
  holding: { label: 'Holding', color: 'bg-amber-100 text-amber-700' },
  clarify: { label: 'Clarify', color: 'bg-blue-100 text-blue-700' },
  action: { label: 'Action', color: 'bg-green-100 text-green-700' },
  mediation: { label: 'Mediation', color: 'bg-purple-100 text-purple-700' },
  boundary: { label: 'Boundary', color: 'bg-red-100 text-red-700' },
};

const Conversation: React.FC<ConversationProps> = ({ messages, onSendMessage, onActionButton, onNameClick, people, settings = { highlightNames: true } }) => {
  const [input, setInput] = useState('');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [expandedExplain, setExpandedExplain] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleCopyScript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  /**
   * Render structured AI response components
   */
  const renderAIExtras = (msg: ChatMessage) => {
    const r = msg.aiResponse;
    if (!r) return null;

    return (
      <div className="mt-2 space-y-2">



        {/* Contact recommendation cards */}
        {r.recommended_contacts && r.recommended_contacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600">
              <Users className="w-3.5 h-3.5" />
              Suggested Contacts
            </div>
            {r.recommended_contacts.map((contact, i) => (
              <div key={i} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-sm font-bold text-purple-700 cursor-pointer hover:underline"
                    onClick={() => onNameClick(contact.name)}
                  >
                    {contact.name}
                  </span>
                  <button
                    onClick={() => setExpandedExplain(expandedExplain === `${msg.id}-${i}` ? null : `${msg.id}-${i}`)}
                    className="text-[10px] text-purple-400 hover:text-purple-600 flex items-center gap-0.5"
                  >
                    Why recommended
                    {expandedExplain === `${msg.id}-${i}` ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                {expandedExplain === `${msg.id}-${i}` && (
                  <p className="text-[11px] text-slate-500 mb-2 italic">{contact.reason}</p>
                )}
                {/* Short script */}
                <div className="mb-1.5 p-2 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide">Short</span>
                    <button
                      onClick={() => handleCopyScript(contact.scripts.short, `${msg.id}-${i}-short`)}
                      className="text-[10px] text-purple-400 hover:text-purple-600 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-purple-50 transition-colors"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedScript === `${msg.id}-${i}-short` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">"{contact.scripts.short}"</p>
                </div>
                {/* Detailed script */}
                <div className="p-2 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide">Detailed</span>
                    <button
                      onClick={() => handleCopyScript(contact.scripts.long, `${msg.id}-${i}-long`)}
                      className="text-[10px] text-purple-400 hover:text-purple-600 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-purple-50 transition-colors"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedScript === `${msg.id}-${i}-long` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">"{contact.scripts.long}"</p>
                </div>
                {contact.lowBarrier && (
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">💡 Low-barrier alternative: {contact.lowBarrier}</p>
                )}
              </div>
            ))}
          </div>
        )}




        {/* Explain card */}
        {r.explain_card && (
          <details className="text-[10px] text-slate-400 mt-1">
            <summary className="cursor-pointer hover:text-slate-600">How this was recommended</summary>
            <p className="mt-1 pl-3 border-l-2 border-slate-200">{r.explain_card}</p>
          </details>
        )}
      </div>
    );
  };

  /**
   * Refined name recognition and Markdown rendering logic.
   * Highlights known names (from map) and likely new names (filtered by blacklist).
   * Also renders AI markdown bolding (**text**) correctly.
   */
  const renderMessageContent = (text: string, isUser: boolean) => {
    const knownNames = new Set(people.map(p => p.name.toLowerCase()));

    // Robust multi-language blacklist to avoid noun false-positives
    const blackList = new Set([
      // English Common & Logic
      'The', 'This', 'It', 'That', 'There', 'These', 'Those', 'In', 'On', 'At', 'To', 'From', 'With', 'By', 'For',
      'I', 'You', 'He', 'She', 'They', 'We', 'Our', 'My', 'Your', 'His', 'Her', 'A', 'An',
      'When', 'Where', 'Why', 'How', 'Who', 'What', 'Which', 'If', 'Unless', 'Because', 'So',
      'Today', 'Yesterday', 'Tomorrow', 'Now', 'Then', 'Just', 'Very', 'But', 'And',
      'Hello', 'Hi', 'Please', 'Yes', 'No', 'Ok', 'Okay', 'Thanks', 'Thank',
      'Role', 'Connection', 'Hobby', 'Space', 'Bridge', 'Indicator', 'Value', 'Map', 'Point',

      // German Common Nouns & Logic words
      'Einsamkeit', 'Signal', 'Verbindungen', 'Telefonbuch', 'Bekanntenkreis', 'Kontakt', 'Kontakte',
      'Wo', 'Interaktion', 'Einkaufen', 'Gruß', 'Nachbarn', 'Landkarte', 'Beziehungen', 'Lebenszeichen',
      'Anruf', 'Treffen', 'Welt', 'Nachricht', 'Bestehende', 'Kleine', 'Gibt', 'Hier', 'Der', 'Die', 'Das',
      'Ein', 'Eine', 'Einer', 'Eines', 'Manchmal', 'Oft', 'Vielleicht', 'Eher', 'Ebenso', 'Situation',
      'Person', 'Perspektive', 'Netzwerk', 'Halt', 'Zeit', 'Begegnung', 'Qualität', 'Wohlbefinden', 'Tiefe',
      'Umfeld', 'Freund', 'Familienmitglied', 'Vertrauensperson', 'Gespräch', 'Heute', 'Morgen', 'Gestern',
      'Wir', 'Ich', 'Sie', 'Er', 'Du', 'Ihr', 'Mein', 'Dein', 'Sein', 'Alles', 'Nichts', 'Etwas',
      'Jemand', 'Niemand', 'Es', 'An', 'Ab', 'Mit', 'Zu', 'Nach', 'Von', 'Über', 'Frage', 'Kaffee'
    ]);

    // Split by Markdown Bold pattern
    const segments = text.split(/(\*\*.*?\*\*)/g);

    return (
      <>
        {segments.map((segment, segIdx) => {
          const isBold = segment.startsWith('**') && segment.endsWith('**');
          const cleanText = isBold ? segment.slice(2, -2) : segment;

          // Tokenize to find names
          const tokens = cleanText.split(/(\s+)/);
          const renderedTokens = tokens.map((token, tokenIdx) => {
            const match = token.match(/^([A-Z\u00C0-\u017F][a-z\u00C0-\u017F]+)([']s|[']re|[']t)?([.?!,;:]?)$/);

            if (!match || !settings.highlightNames) return token;

            const word = match[1];
            const suffix = match[2] || '';
            const punc = match[3] || '';
            const lowerWord = word.toLowerCase();

            const isKnown = knownNames.has(lowerWord);
            const isBlacklisted = blackList.has(word);

            // Heuristic for sentence start
            let isStart = (tokenIdx === 0 && segIdx === 0);
            if (tokenIdx >= 2) {
              const prev = tokens[tokenIdx - 2];
              if (/[.?!]\s*$/.test(prev)) isStart = true;
            }

            let shouldHighlight = false;
            if (isKnown) {
              shouldHighlight = true;
            } else if (!isBlacklisted && !isStart && word.length > 2) {
              // High bar for unknown names to avoid common noun false positives
              shouldHighlight = true;
            }

            if (shouldHighlight) {
              return (
                <React.Fragment key={`${segIdx}-${tokenIdx}`}>
                  <span
                    onClick={() => onNameClick(word)}
                    className={`cursor-pointer font-bold underline transition-colors 
                      ${isUser
                        ? 'decoration-white/60 hover:text-white hover:decoration-white'
                        : 'decoration-indigo-300 hover:text-indigo-600'}
                    `}
                    title={`Relational Link: ${word}`}
                  >
                    {word}
                  </span>
                  {suffix}{punc}
                </React.Fragment>
              );
            }
            return token;
          });

          return isBold ? (
            <strong key={segIdx} className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>
              {renderedTokens}
            </strong>
          ) : (
            <React.Fragment key={segIdx}>{renderedTokens}</React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-12 opacity-50">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">Start a conversation about your relationships.</p>
            <p className="text-xs mt-2">Mention names to add them to your map.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${m.sender === 'user' ? '' : ''}`}>
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                  ${m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}
              >
                {renderMessageContent(m.text, m.sender === 'user')}
              </div>
              {/* Render structured AI response extras */}
              {m.sender === 'ai' && renderAIExtras(m)}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-slate-200"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          RMI provides structural guidance, not clinical advice. AI is a relational mediator, not a companion.
        </p>
      </form>
    </div>
  );
};

export default Conversation;
