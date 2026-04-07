import { useState, useEffect } from "react";
import { Search, Pin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaveAvatar from "./WaveAvatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateGroupDialog from "./CreateGroupDialog";

interface ChannelWithPreview {
  id: string;
  name: string | null;
  type: string;
  owner_id: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: number;
  otherUserName?: string;
  otherUserOnline?: boolean;
  otherUserStatus?: string;
}

interface Props {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
}

const ChatPanel = ({ selectedChat, onSelectChat }: Props) => {
  const [search, setSearch] = useState("");
  const [channels, setChannels] = useState<ChannelWithPreview[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { user } = useAuth();

  const fetchChannels = async () => {
    if (!user) return;

    const { data: memberEntries } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", user.id);

    if (!memberEntries?.length) { setChannels([]); return; }

    const channelIds = memberEntries.map((m) => m.channel_id);

    const { data: channelsData } = await supabase
      .from("channels")
      .select("*")
      .in("id", channelIds);

    if (!channelsData) return;

    // Get last message for each channel
    const enriched: ChannelWithPreview[] = await Promise.all(
      channelsData.map(async (ch) => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("channel_id", ch.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let otherUserName = ch.name;
        let otherUserOnline = false;
        let otherUserStatus = "offline";

        if (ch.type === "direct") {
          const { data: members } = await supabase
            .from("channel_members")
            .select("user_id")
            .eq("channel_id", ch.id)
            .neq("user_id", user.id)
            .limit(1);

          if (members?.[0]) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("display_name, is_online, status")
              .eq("user_id", members[0].user_id)
              .maybeSingle();
            if (prof) {
              otherUserName = prof.display_name;
              otherUserOnline = prof.is_online;
              otherUserStatus = prof.status || (prof.is_online ? "online" : "offline");
            }
          }
        }

        const lastMsg = msgs?.[0];
        return {
          ...ch,
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
          otherUserName: otherUserName || "Chat",
          otherUserOnline,
          otherUserStatus,
        } as ChannelWithPreview;
      })
    );

    setChannels(enriched);
  };

  useEffect(() => {
    fetchChannels();

    // Subscribe to new messages to refresh list
    const channel = supabase
      .channel("chat-panel-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchChannels();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = channels.filter((c) => {
    const name = c.type === "direct" ? c.otherUserName : c.name;
    return (name || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" className="pl-8 h-8 text-sm bg-wave-input-bg border-border" />
        </div>
        <button onClick={() => setShowCreateGroup(true)} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="Novo grupo">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto wave-scrollbar">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa</p>
        )}
        {filtered.map((ch) => {
          const displayName = ch.type === "direct" ? ch.otherUserName : ch.name;
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChat(ch.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left",
                selectedChat === ch.id && "bg-muted"
              )}
            >
              <WaveAvatar name={displayName || "?"} status={(ch.otherUserStatus as any) || "offline"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{ch.lastMessageTime}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{ch.lastMessage}</p>
              </div>
            </button>
          );
        })}
      </div>

      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} onCreated={fetchChannels} />
    </div>
  );
};

export default ChatPanel;
