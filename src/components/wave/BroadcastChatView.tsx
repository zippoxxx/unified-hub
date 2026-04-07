import { useState, useEffect, useRef } from "react";
import { Send, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BroadcastMsg {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  senderName?: string;
}

const BroadcastChatView = () => {
  const [messages, setMessages] = useState<BroadcastMsg[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user, isAdmin } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: true });

    if (!data) return;

    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", senderIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    setMessages(data.map((m) => ({ ...m, senderName: profileMap.get(m.sender_id) || "Admin" })));
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("broadcast-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !isAdmin) return;
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("broadcasts").insert({ sender_id: user.id, message: content });
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg">
          📢
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Aviso Geral</h2>
          <p className="text-xs text-muted-foreground">Mensagens enviadas pelo administrador</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 wave-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[70%]">
              <span className="text-[10px] text-primary font-medium mb-0.5 block">
                <Megaphone className="w-3 h-3 inline mr-1" />
                {msg.senderName}
              </span>
              <div className="px-3 py-2 rounded-lg text-sm bg-primary/10 border border-primary/20 text-foreground">
                {msg.message}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input - only for admins */}
      {isAdmin ? (
        <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Enviar aviso geral..."
            className="flex-1 h-9 bg-wave-input-bg border-border text-sm"
          />
          <button onClick={handleSend} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-t border-border bg-card px-4 py-3 shrink-0">
          <p className="text-xs text-muted-foreground text-center">Apenas administradores podem enviar avisos</p>
        </div>
      )}
    </div>
  );
};

export default BroadcastChatView;
