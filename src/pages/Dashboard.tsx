import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NarrowSidebar, { type WaveTab } from "@/components/wave/NarrowSidebar";
import ChatPanel from "@/components/wave/ChatPanel";
import ChatView from "@/components/wave/ChatView";
import { ContactsPanel, ContactsView } from "@/components/wave/ContactsPanel";
import { MeetingsPanel, MeetingsView } from "@/components/wave/MeetingsPanel";
import AdminPanel from "@/components/wave/AdminPanel";
import BroadcastBanner from "@/components/wave/BroadcastBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<WaveTab>("chats");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const { user, loading, permissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  // Start or open a direct chat with a user
  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;

    // Find existing direct channel between the two users
    const { data: myChannels } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", user.id);

    if (myChannels) {
      for (const mc of myChannels) {
        const { data: ch } = await supabase
          .from("channels")
          .select("id, type")
          .eq("id", mc.channel_id)
          .eq("type", "direct")
          .maybeSingle();

        if (ch) {
          const { data: otherMember } = await supabase
            .from("channel_members")
            .select("user_id")
            .eq("channel_id", ch.id)
            .eq("user_id", otherUserId)
            .maybeSingle();

          if (otherMember) {
            setSelectedChat(ch.id);
            setActiveTab("chats");
            return;
          }
        }
      }
    }

    // Create new direct channel
    const { data: newChannel, error } = await supabase
      .from("channels")
      .insert({ owner_id: user.id, type: "direct" })
      .select()
      .single();

    if (error || !newChannel) {
      toast.error("Erro ao criar conversa");
      return;
    }

    await supabase.from("channel_members").insert([
      { channel_id: newChannel.id, user_id: user.id },
      { channel_id: newChannel.id, user_id: otherUserId },
    ]);

    setSelectedChat(newChannel.id);
    setActiveTab("chats");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return null;

  const renderPanel = () => {
    switch (activeTab) {
      case "chats": return <ChatPanel selectedChat={selectedChat} onSelectChat={setSelectedChat} />;
      case "contacts": return <ContactsPanel selectedContact={selectedContact} onSelectContact={setSelectedContact} onStartChat={handleStartChat} />;
      case "meetings": return <MeetingsPanel onSelectMeeting={setSelectedMeeting} />;
      case "admin": return <AdminPanel />;
      default: return <ChatPanel selectedChat={selectedChat} onSelectChat={setSelectedChat} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chats": return <ChatView chatId={selectedChat} />;
      case "contacts": return <ContactsView contactId={selectedContact} onStartChat={handleStartChat} />;
      case "meetings": return <MeetingsView meetingId={selectedMeeting} />;
      case "admin": return <div className="flex-1 bg-background" />;
      default: return <ChatView chatId={selectedChat} />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <BroadcastBanner />
      <div className="flex-1 flex overflow-hidden">
        <NarrowSidebar active={activeTab} onTabChange={setActiveTab} />
        {renderPanel()}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
