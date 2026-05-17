import React, { useState } from 'react';

const MAX_LEN = 2000;

interface Props {
  onSend: (content: string) => void;
  connected: boolean;
  roomName: string;
}

const MessageInput: React.FC<Props> = ({ onSend, connected, roomName }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const over = text.length > MAX_LEN;

  return (
    <div className="border-t border-[#2a2a50] px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={!connected}
            placeholder={connected ? `Написать в # ${roomName}…` : 'Подключение...'}
            rows={1}
            className={`w-full ginput resize-none leading-5 py-2.5 pr-16 max-h-32 overflow-y-auto ${
              over ? 'border-red-500 focus:border-red-500' : ''
            }`}
            style={{ minHeight: '42px' }}
          />
          <span
            className={`absolute bottom-2.5 right-3 text-xs ${
              over ? 'text-red-400' : 'text-slate-600'
            }`}
          >
            {text.length}/{MAX_LEN}
          </span>
        </div>
        <button
          onClick={handleSend}
          disabled={!connected || !text.trim() || over}
          className="gbtn-primary py-2.5 px-4 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↑
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-1">Enter — отправить · Shift+Enter — новая строка</p>
    </div>
  );
};

export default MessageInput;
