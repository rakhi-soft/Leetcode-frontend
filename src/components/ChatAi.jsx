import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axiosClient from '../utils/axiosClient';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';

const SUGGESTIONS = [
  'Explain this problem in simple terms',
  'Give me a hint without the full solution',
  'What approach should I use?',
];

function ChatAi({ problem, onClose }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { message: '' } });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const borders = useThemedBorder();
  const messageValue = watch('message');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || sending) return;
    const userMessage = { role: 'user', parts: [{ text: trimmed }] };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    reset();
    setSending(true);
    try {
      const response = await axiosClient.post('/ai/chat', {
        messages: updatedMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode,
      });
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: response.data.message }] }]);
    } catch (error) {
      const errorText = error.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: errorText }] }]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (data) => sendMessage(data.message);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      <div className={`flex items-center justify-between px-4 h-11 min-h-11 border-b shrink-0 ${borders.divider}`}>
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Sparkles size={16} className="text-secondary" />
          <span>Leet</span>
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-square h-8 min-h-8 w-8 rounded-lg" aria-label="Close chat"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="font-semibold text-base mb-2">Hi, I&apos;m Leet</h3>
            <p className="text-sm text-base-content/60 leading-relaxed max-w-[240px]">Ask me anything about this problem.</p>
            <div className="mt-6 w-full space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => { setValue('message', s); textareaRef.current?.focus(); }} className={`w-full text-left text-sm px-3 py-2.5 rounded-xl border hover:bg-base-200 ${borders.card}`}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] text-sm leading-relaxed px-3 py-2 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-content rounded-br-sm' : 'bg-base-200 text-base-content rounded-bl-sm'}`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {sending && <div className="flex justify-start"><div className="bg-base-200 px-3 py-2 rounded-xl"><span className="loading loading-dots loading-sm" /></div></div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={`shrink-0 p-3 border-t ${borders.divider}`}>
        <div className={`rounded-xl border bg-base-100 overflow-hidden ${borders.card}`}>
          <textarea {...register('message', { required: true, minLength: 2 })} ref={(el) => { register('message').ref(el); textareaRef.current = el; }} rows={3} placeholder="Ask a question..." className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm outline-none placeholder:text-base-content/40" onKeyDown={handleKeyDown} />
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="badge badge-ghost badge-sm rounded-full font-normal">Gemini Flash</span>
            <button type="submit" disabled={sending || !messageValue?.trim() || messageValue.trim().length < 2} className="btn btn-primary btn-sm btn-circle h-8 min-h-8 w-8 rounded-full" aria-label="Send"><ArrowUp size={16} /></button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
