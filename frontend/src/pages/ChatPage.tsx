import React, { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import RoomSidebar from '../components/Chat/RoomSidebar';
import MessageList from '../components/Chat/MessageList';
import MessageInput from '../components/Chat/MessageInput';
import { authService } from '../services/authService';

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    rooms,
    messagesByRoom,
    onlineByRoom,
    unreadByRoom,
    activeSlug,
    ws,
    fetchRooms,
    connectToRoom,
    sendMessage,
    startPolling,
    stopPolling,
  } = useChatStore();

  useEffect(() => {
    fetchRooms();
    startPolling();
    return () => stopPolling();
  }, []);

  const handleSelectRoom = (slug: string) => {
    const token = authService.getToken();
    if (!token) return;
    connectToRoom(slug, token);
  };

  const activeRoom = rooms.find((r) => r.slug === activeSlug);
  const messages = (activeSlug ? messagesByRoom[activeSlug] : null) ?? [];
  const online = activeSlug ? (onlineByRoom[activeSlug] ?? 0) : 0;
  const isConnected = ws !== null && ws.readyState === WebSocket.OPEN;

  return (
    <div className="flex h-[calc(100vh-3.5rem-1px)] -mx-4 sm:-mx-6 overflow-hidden">
      {/* Sidebar */}
      <RoomSidebar
        rooms={rooms}
        activeSlug={activeSlug}
        onlineByRoom={onlineByRoom}
        unreadByRoom={unreadByRoom}
        onSelect={handleSelectRoom}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeSlug ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
            <div className="text-5xl">💬</div>
            <h2 className="text-xl font-bold text-white">Выберите комнату</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Слева — список чатов по играм. Выберите интересующую игру и канал.
            </p>
          </div>
        ) : (
          <>
            {/* Room header */}
            <div className="border-b border-[#2a2a50] px-4 py-2.5 flex items-center gap-3 shrink-0">
              <div>
                <span className="text-white font-semibold">
                  # {activeRoom?.name ?? activeSlug}
                </span>
                {activeRoom?.description && (
                  <span className="text-slate-500 text-sm ml-2">{activeRoom.description}</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <span className="text-xs text-slate-400">
                  {isConnected ? `онлайн: ${online}` : 'подключение...'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={user?.id ?? ''}
            />

            {/* Input */}
            <MessageInput
              onSend={sendMessage}
              connected={isConnected}
              roomName={activeRoom?.name ?? activeSlug}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
