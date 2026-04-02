import { useState } from "react";
import { Search, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaveAvatar from "./WaveAvatar";
import { chats, type ChatItem } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface Props {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
}

const ChatPanel = ({ selectedChat, onSelectChat }: Props) => {
  const [search, setSearch] = useState("");
  const pinned = chats.filter((c) => c.pinned);
  const recent = chats.filter((c) => !c.pinned);
  const filtered = (items: ChatItem[]) =>
    items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const ChatRow = ({ chat }: { chat: ChatItem }) => (
    <button
      onClick={() => onSelectChat(chat.id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left",
        selectedChat === chat.id && "bg-muted"
      )}
    >
      <WaveAvatar name={chat.name} online={chat.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground truncate">{chat.name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{chat.time}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
      </div>
      {chat.unread && chat.unread > 0 && (
        <span className="min-w-[20px] h-5 rounded-full bg-wave-sidebar-active text-[11px] font-bold text-primary-foreground flex items-center justify-center px-1.5">
          {chat.unread}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar"
            className="pl-8 h-8 text-sm bg-wave-input-bg border-border"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto wave-scrollbar">
        {filtered(pinned).length > 0 && (
          <>
            <div className="px-4 py-1.5 flex items-center gap-1.5">
              <Pin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Fixado</span>
            </div>
            {filtered(pinned).map((c) => <ChatRow key={c.id} chat={c} />)}
          </>
        )}

        {filtered(recent).length > 0 && (
          <>
            <div className="px-4 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">Chats recentes</span>
            </div>
            {filtered(recent).map((c) => <ChatRow key={c.id} chat={c} />)}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
