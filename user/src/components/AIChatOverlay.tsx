import * as React from 'react';
import { Send, Bot, X, Sparkles, HelpCircle, FileText, Youtube, MessageCircle, RefreshCw, Lightbulb, Stethoscope } from 'lucide-react';
import { ChatMessage, Resource, User } from '../types';
import { generateStudyResponse } from '../services/aiService';
import { extractTextFromPdf } from '../services/pdfHelper';

interface AIChatOverlayProps {
  user: User;
  resource: Resource;
  onClose: () => void;
  contentContext?: string; // Content of the open page/resource
  currentPage?: number;
}

export const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ user, resource, onClose, contentContext, currentPage }) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `Hey ${(user.name || 'Student').split(' ')[0]}! I've been looking over **${resource.title}** for you. It's a really important topic for your ${user.year} studies. 

How can I help you master this today? I can break down the complex mechanisms, quiz you on the essentials, or find those specific high-yield clinical correlations you need.`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [pdfContext, setPdfContext] = React.useState<{ page: number, text: string }[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load PDF Text on Open
  React.useEffect(() => {
    const loadContext = async () => {
      if (resource.type === 'PDF' && resource.url) {
        // Optional: Check if we have a URL (local string check for now)
        if (resource.url.endsWith('.pdf') || resource.url.startsWith('blob:') || resource.url.includes('/')) {
          const pages = await extractTextFromPdf(resource.url);
          if (pages && pages.length > 0) {
            setPdfContext(pages);
          }
        }
      }
    };
    loadContext();
  }, [resource.id]);

  const handleSend = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || input;
    if (!textToSubmit.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSubmit,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mini-RAG: Select relevant pages based on prompt
    let selectedText = "Not available (infer from title)";

    if (pdfContext.length > 0) {
      const lowerPrompt = textToSubmit.toLowerCase();

      // Filter logic...
      let topPages: typeof pdfContext = [];

      // If user specifically asks about "IT" or similar general pronouns, blindly include current page
      const currentContextNeeded = currentPage && (
        lowerPrompt.includes('this page') ||
        lowerPrompt.includes('current page') ||
        lowerPrompt.includes('explain this') ||
        lowerPrompt.includes('here')
      );

      // Find current page text
      const currentPageData = currentPage ? pdfContext.find(p => p.page === currentPage) : null;

      if (lowerPrompt.includes('summar') || lowerPrompt.includes('overview') || lowerPrompt.length < 10) {
        // Generic: Take first few pages (intro) + Current Page
        const introPages = pdfContext.slice(0, 5);
        if (currentPageData && !introPages.includes(currentPageData)) introPages.push(currentPageData);
        topPages = introPages;
      } else {
        const keywords = lowerPrompt.split(' ').filter(w => w.length > 3);
        const scoredPages = pdfContext.map(p => {
          const textLower = p.text.toLowerCase();
          let score = 0;
          keywords.forEach(k => {
            const regex = new RegExp(k, 'g');
            const matches = (textLower.match(regex) || []).length;
            score += matches;
          });
          // Boost current page if implicitly requested or just as context anchor
          if (p.page === currentPage) score += 5;
          return { ...p, score };
        });

        topPages = scoredPages.sort((a, b) => b.score - a.score).slice(0, 5);
      }

      // ALWAYS include current page if we have it and it's not already there?
      // Actually, if the user asks a question unrelated to the current page, maybe not. 
      // But typically "Explain page 13" will naturally boost page 13 via the specific "Page 13" text search if I indexed "Page 13".
      // But passing currentPage explicitly helps.
      if (currentPageData && !topPages.find(p => p.page === currentPage)) {
        topPages.push(currentPageData);
      }

      // Re-sort by page number
      topPages.sort((a, b) => a.page - b.page);
      selectedText = topPages.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
    }

    const context = `
    THEME: Conversational Research Assistant for Medical Students.
    RESOURCE_OPEN: ${resource.title}
    RESOURCE_TYPE: ${resource.type}
    SUBJECT: ${resource.subject}
    CURRENT_VIEWED_PAGE: ${currentPage ? 'Page ' + currentPage : 'Unknown'}
    RESOURCE_RELEVANT_CONTENT: ${selectedText.substring(0, 50000)}
    STUDENT_LEVEL: ${user.year}
    STUDENT_WEAKNESSES: ${user.weakness?.join(', ')}
    
    GOAL: Act like a mentor. Help the student understand this specific resource ONLY. 
    - The user is currently looking at ${currentPage ? 'Page ' + currentPage : 'the resource'}.
    - If they ask about "this page", refer to the content labeled [Page ${currentPage}].
    - If they ask for timestamps, estimate them for a medical video of this length.
    - If they ask for a summary, give them the "Too Long; Didn't Read" but keep it high-yield.
    - Be conversational and encouraging. Use medical terminology but explain it if it's complex.
    `;

    const responseText = await generateStudyResponse(textToSubmit, context);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const formatMarkdown = (text: string) => {
    if (!text) return "";
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-brand-dark mt-4 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-brand-dark mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-brand-dark mt-6 mb-3">$1</h1>')
      // Bold/Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-brand-dark">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Lists
      .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>')
      // Paragraphs & Breaks
      .replace(/\n\n/g, '<div class="h-3"></div>')
      .replace(/\n/g, '<br/>')
      // Remove any leftover markers that might cause "weird symbols"
      .replace(/[`#*_]{3,}/g, '');
  };

  const QuickAction = ({ icon: Icon, text, prompt, color }: { icon: any, text: string, prompt: string, color: string }) => (
    <button
      onClick={() => handleSend(prompt)}
      className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-brand-blue hover:text-brand-blue transition-all whitespace-nowrap shadow-sm group`}
    >
      <Icon size={12} className={`group-hover:scale-110 transition-transform ${color}`} />
      {text}
    </button>
  );

  const SuggestedFollowUps = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role === 'user' || isTyping) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
        <button
          onClick={() => handleSend("Can you explain that last point more simply?")}
          className="text-[10px] font-bold text-brand-blue bg-blue-50 px-3 py-1.5 rounded-full hover:bg-brand-blue hover:text-white transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={10} /> Simplify this
        </button>
        <button
          onClick={() => handleSend("What is the most high-yield clinical correlation for this?")}
          className="text-[10px] font-bold text-brand-purple bg-purple-50 px-3 py-1.5 rounded-full hover:bg-brand-purple hover:text-white transition-all flex items-center gap-1.5"
        >
          <Stethoscope size={10} /> Clinical focus
        </button>
        <button
          onClick={() => handleSend("Give me a mnemonic to remember this concept.")}
          className="text-[10px] font-bold text-brand-yellow bg-yellow-50 px-3 py-1.5 rounded-full hover:bg-brand-yellow hover:text-brand-dark transition-all flex items-center gap-1.5"
        >
          <Lightbulb size={10} /> Mnemonic
        </button>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] sm:h-[600px] max-h-[calc(100vh-140px)] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden z-[100] animate-pop-in">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 bg-brand-dark text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div className="truncate">
            <h3 className="font-extrabold text-sm tracking-tight">Medico Research Assistant</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[180px]">Active Resource: {resource.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-lg bg-brand-blue text-white flex items-center justify-center shrink-0 mt-1 mr-2 shadow-sm">
                <Bot size={14} />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'w-auto' : 'w-full'}`}>
              <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                ? 'bg-brand-blue text-white rounded-tr-none'
                : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                <div
                  className="whitespace-pre-wrap selection:bg-brand-yellow selection:text-brand-dark"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
                />
              </div>
            </div>
          </div>
        ))}
        {
          isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="w-6 h-6 rounded-lg bg-brand-blue text-white flex items-center justify-center shrink-0 mt-1 mr-2">
                <Bot size={14} />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )
        }
        <div ref={messagesEndRef} />
      </div >

      {/* Input */}
      < div className="p-4 bg-white border-t border-gray-50 shrink-0" >
        <div className="relative flex items-center gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="w-full bg-gray-50 text-brand-dark placeholder-gray-400 rounded-2xl pl-5 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:bg-white border-transparent focus:border-brand-blue/20 transition-all text-sm font-bold"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-dark text-white rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center shadow-md active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <MessageCircle size={10} className="text-gray-300" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300">Medico AI Research Mentor</p>
        </div>
      </div >
    </div >
  );
};