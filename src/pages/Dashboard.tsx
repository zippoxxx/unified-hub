import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NarrowSidebar, { type WaveTab } from "@/components/wave/NarrowSidebar";
import ChatPanel from "@/components/wave/ChatPanel";
import ChatView from "@/components/wave/ChatView";
import { ContactsPanel, ContactsView } from "@/components/wave/ContactsPanel";
import { CallsPanel, CallsView } from "@/components/wave/CallsPanel";
import { MeetingsPanel, MeetingsView } from "@/components/wave/MeetingsPanel";
import AdminPanel from "@/components/wave/AdminPanel";
import BroadcastBanner from "@/components/wave/BroadcastBanner";

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
      case "contacts": return <ContactsPanel selectedContact={selectedContact} onSelectContact={setSelectedContact} />;
      case "calls": return <CallsPanel />;
      case "meetings": return <MeetingsPanel onSelectMeeting={setSelectedMeeting} />;
      case "admin": return <AdminPanel />;
      default: return <ChatPanel selectedChat={selectedChat} onSelectChat={setSelectedChat} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chats": return <ChatView chatId={selectedChat} />;
      case "contacts": return <ContactsView contactId={selectedContact} />;
      case "calls": return <CallsView />;
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
