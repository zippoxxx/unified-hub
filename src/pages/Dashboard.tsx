import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NarrowSidebar, { type WaveTab } from "@/components/wave/NarrowSidebar";
import ChatPanel from "@/components/wave/ChatPanel";
import ChatView from "@/components/wave/ChatView";
import { ContactsPanel, ContactsView } from "@/components/wave/ContactsPanel";
import { CallsPanel, CallsView } from "@/components/wave/CallsPanel";
import { MeetingsPanel, MeetingsView } from "@/components/wave/MeetingsPanel";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<WaveTab>("chats");
  const [selectedChat, setSelectedChat] = useState<string | null>("4");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("wave-logged-in")) navigate("/");
  }, [navigate]);

  const renderPanel = () => {
    switch (activeTab) {
      case "chats": return <ChatPanel selectedChat={selectedChat} onSelectChat={setSelectedChat} />;
      case "contacts": return <ContactsPanel selectedContact={selectedContact} onSelectContact={setSelectedContact} />;
      case "calls": return <CallsPanel />;
      case "meetings": return <MeetingsPanel />;
      default: return <ChatPanel selectedChat={selectedChat} onSelectChat={setSelectedChat} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chats": return <ChatView chatId={selectedChat} />;
      case "contacts": return <ContactsView contactId={selectedContact} />;
      case "calls": return <CallsView />;
      case "meetings": return <MeetingsView meetingId={null} />;
      default: return <ChatView chatId={selectedChat} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <NarrowSidebar active={activeTab} onTabChange={setActiveTab} />
      {renderPanel()}
      {renderContent()}
    </div>
  );
};

export default Dashboard;
