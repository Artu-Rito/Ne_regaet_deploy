import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const MessageList: React.FC<Props> = ({ messages, currentUserId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // Scroll to bottom when room changes (messages reset)
  useEffect(() => {
    isNearBottom.current = true;
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages[0]?.room_slug]);

  // Auto-scroll only if user is already near the bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Пока нет сообщений. Будьте первым!
      </div>
    );
  }

  let lastDate = '';

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
      {messages.map((msg) => {
        const msgDate = formatDate(msg.created_at);
        const showDateSep = msgDate !== lastDate;
        lastDate = msgDate;
        const isMine = msg.user_id === currentUserId;

        return (
          <React.Fragment key={msg.id}>
            {showDateSep && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#2a2a50]" />
                <span className="text-xs text-slate-500">{msgDate}</span>
                <div className="flex-1 h-px bg-[#2a2a50]" />
              </div>
            )}
            <div className={`flex items-start gap-2.5 group ${isMine ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  isMine ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                {msg.nickname?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-baseline gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-semibold text-slate-300">{msg.nickname}</span>
                  <span className="text-xs text-slate-600 digital">{formatTime(msg.created_at)}</span>
                </div>
                <div
                  className={`mt-0.5 px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-indigo-600/30 text-slate-100 rounded-tr-sm'
                      : 'bg-[#1a1a3a] text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
