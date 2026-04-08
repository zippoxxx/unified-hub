
import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, User, FolderOpen, Trash2, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaveAvatar from "./WaveAvatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface Props {
  chatId: string | null;
}

interface MessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  senderName?: string;
}

const EMOJIS = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"];


const ChatView = ({ chatId }: Props) => {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [channelInfo, setChannelInfo] = useState<{ name: string | null; type: string; owner_id: string } | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!chatId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", chatId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", senderIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    setMessages(data.map((m) => ({ ...m, senderName: profileMap.get(m.sender_id) || "Usuário" })));
  };

  useEffect(() => {
    if (!chatId) return;

    fetchMessages();

    supabase.from("channels").select("name, type, owner_id").eq("id", chatId).maybeSingle().then(({ data }) => {
      if (data) {
        setChannelInfo(data);
        if (data.type === "direct" && user) {
          supabase
            .from("channel_members")
            .select("user_id")
            .eq("channel_id", chatId)
            .neq("user_id", user.id)
            .limit(1)
            .then(({ data: members }) => {
              if (members?.[0]) {
                supabase.from("profiles").select("display_name").eq("user_id", members[0].user_id).maybeSingle().then(({ data: p }) => {
                  if (p) setOtherUserName(p.display_name);
                });
              }
            });
        }
      }
    });

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${chatId}` }, (payload) => {
        const newMsg = payload.new as MessageRow;
        supabase.from("profiles").select("display_name").eq("user_id", newMsg.sender_id).maybeSingle().then(({ data: p }) => {
          setMessages((prev) => [...prev, { ...newMsg, senderName: p?.display_name || "Usuário" }]);
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `channel_id=eq.${chatId}` }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${chatId}` }, (payload) => {
        const updated = payload.new as MessageRow;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, content: updated.content } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, user]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Selecione uma conversa para começar</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    const content = message.trim();
    setMessage("");
    await supabase.from("messages").insert({ channel_id: chatId, sender_id: user.id, content });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("chat-files").upload(filePath, file);
    if (error) { toast.error("Erro ao enviar arquivo"); return; }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(filePath);

    await supabase.from("messages").insert({
      channel_id: chatId,
      sender_id: user.id,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
    });
  };

  const handleDeleteMessage = async (msgId: string) => {
    await supabase.from("messages").delete().eq("id", msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast.success("Mensagem apagada");
  };

  const handleStartEdit = (msg: MessageRow) => {
    setEditingId(msg.id);
    setEditText(msg.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await supabase.from("messages").update({ content: editText.trim() }).eq("id", editingId);
    setMessages((prev) => prev.map((m) => m.id === editingId ? { ...m, content: editText.trim() } : m));
    setEditingId(null);
    setEditText("");
    toast.success("Mensagem editada");
  };

  const handleReply = (msg: MessageRow) => {
    setReplyId(msg.id);
    setMessage(`@${msg.senderName}: `);
  };

  const handleSendReply = async () => {
    if (!message.trim() || !user) return;
    const content = message.trim();
    setMessage("");
    await supabase.from("messages").insert({ channel_id: chatId, sender_id: user.id, content, reply_id: replyId });
    setReplyId(null);
  };

  const displayName = channelInfo?.type === "direct" ? otherUserName : channelInfo?.name || "Chat";

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
        <WaveAvatar name={displayName} />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{displayName}</h2>
          <p className="text-xs text-primary">{channelInfo?.type === "group" ? "Grupo" : ""}</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button className="p-1.5 hover:bg-muted rounded"><User className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-muted rounded"><FolderOpen className="w-4 h-4" /></button>
          {channelInfo?.owner_id === user?.id && channelInfo?.type === "group" && (
            <button
              className="p-1.5 hover:bg-muted rounded text-destructive"
              title="Deletar grupo"
              onClick={async () => {
                await supabase.from("channels").delete().eq("id", chatId);
                toast.success("Grupo deletado");
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 wave-scrollbar">
        {messages.map((msg) => {
          const isSent = msg.sender_id === user?.id;
          const isEditing = editingId === msg.id;

          return (
            <ContextMenu key={msg.id}>
              <ContextMenuTrigger asChild>
                <div className={cn("flex", isSent ? "justify-end" : "justify-start")}>
                  <div className="max-w-[70%]">
                    {!isSent && channelInfo?.type === "group" && (
                      <span className="text-[10px] text-primary font-medium mb-0.5 block">{msg.senderName}</span>
                    )}
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-sm",
                      isSent ? "bg-wave-bubble-sent text-foreground" : "bg-card border border-border text-foreground"
                    )}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingId(null); }}
                            className="h-7 text-sm"
                          />
                          <button onClick={handleSaveEdit} className="p-1 hover:bg-muted rounded text-primary"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="w-4 h-4" /></button>
                        </div>
                      ) : msg.file_url ? (
                        msg.file_type?.startsWith("image/") ? (
                          <img src={msg.file_url} alt={msg.file_name || "image"} className="max-w-full rounded max-h-48" />
                        ) : (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            📎 {msg.file_name}
                          </a>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </ContextMenuTrigger>
              {isSent && (
                <ContextMenuContent>
                  {msg.content && !msg.file_url && (
                    <ContextMenuItem onClick={() => handleStartEdit(msg)}>
                      <Pencil className="w-4 h-4 mr-2" /> Editar mensagem
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteMessage(msg.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Apagar mensagem
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleReply(msg)}>
                    <Pencil className="w-4 h-4 mr-2" /> Responder mensagem
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
              {!isSent && (
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleReply(msg)}>
                    <Pencil className="w-4 h-4 mr-2" /> Responder mensagem
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          );
        })}
        <div ref={messagesEndRef} />
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
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Paperclip className="w-5 h-5" /></button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
          placeholder={replyId ? `Responder a ${messages.find((m) => m.id === replyId)?.senderName}` : "Digite as mensagens"}
          className="flex-1 h-9 bg-wave-input-bg border-border text-sm"
        />
        <button onClick={handleSendReply} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatView;
