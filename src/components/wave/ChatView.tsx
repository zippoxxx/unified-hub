import { useState } from "react";
import { Send, Smile, Paperclip, Image, BarChart3, User, FolderOpen, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaveAvatar from "./WaveAvatar";
import { chats, chatMessages } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface Props {
  chatId: string | null;
}

const EMOJIS = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"];

const ChatView = ({ chatId }: Props) => {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Selecione uma conversa para começar</p>
      </div>
    );
  }

  const chat = chats.find((c) => c.id === chatId);
  const messages = chatMessages[chatId] || [];

  if (!chat) return null;

  const handleSend = () => {
    if (message.trim()) setMessage("");
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
        <WaveAvatar name={chat.name} online={chat.online} />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{chat.name}</h2>
          <p className="text-xs text-primary">8730 (TI)</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button className="p-1.5 hover:bg-muted rounded"><User className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-muted rounded"><FolderOpen className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-muted rounded"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 wave-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.sent ? "justify-end" : "justify-start")}>
            <div className="max-w-[70%]">
              <div className={cn(
                "px-3 py-2 rounded-lg text-sm",
                msg.sent ? "bg-wave-bubble-sent text-foreground" : "bg-card border border-border text-foreground"
              )}>
                {msg.image === "claudio" ? (
                  <div className="w-48 h-12 bg-primary/10 rounded flex items-center justify-center text-xl font-bold text-primary">
                    Claudio
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="border-t border-border bg-card p-3 max-h-48 overflow-y-auto wave-scrollbar">
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => { setMessage((m) => m + e); setShowEmoji(false); }} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2 shrink-0">
        <button onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Smile className="w-5 h-5" /></button>
        <button className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Paperclip className="w-5 h-5" /></button>
        <button className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Image className="w-5 h-5" /></button>
        <button className="p-1.5 hover:bg-muted rounded text-muted-foreground"><BarChart3 className="w-5 h-5" /></button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite as mensagens"
          className="flex-1 h-9 bg-wave-input-bg border-border text-sm"
        />
        <button onClick={handleSend} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatView;
