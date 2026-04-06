import { MessageSquare, Users, Video, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import WaveAvatar from "./WaveAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export type WaveTab = "chats" | "contacts" | "meetings" | "admin";

interface Props {
  active: WaveTab;
  onTabChange: (tab: WaveTab) => void;
}

const NarrowSidebar = ({ active, onTabChange }: Props) => {
  const { profile, isAdmin, signOut, permissions } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const tabs: { id: WaveTab; icon: React.ElementType; label: string; badge?: number; visible: boolean }[] = [
    { id: "chats", icon: MessageSquare, label: "Chats", badge: 0, visible: permissions?.module_chats !== false },
    { id: "contacts", icon: Users, label: "Contatos", visible: permissions?.module_contacts !== false },
    { id: "meetings", icon: Video, label: "Reuniões", visible: permissions?.module_meetings !== false },
    { id: "admin", icon: Settings, label: "Gestão", visible: isAdmin },
  ];

  return (
    <div className="w-[68px] bg-wave-sidebar flex flex-col items-center py-4 shrink-0">
      <div className="mb-6">
        <WaveAvatar name={profile?.display_name || "User"} size="md" online />
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {tabs.filter((t) => t.visible).map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-14 h-14 flex flex-col items-center justify-center rounded-lg text-wave-sidebar-fg transition-colors relative",
              active === id ? "bg-wave-sidebar-hover text-wave-sidebar-active" : "hover:bg-wave-sidebar-hover"
            )}
          >
            {active === id && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-wave-sidebar-active" />}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-tight">{label}</span>
            {badge && badge > 0 && (
              <span className="absolute top-1.5 right-2 min-w-[16px] h-4 rounded-full bg-wave-badge text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} className="w-14 h-14 flex flex-col items-center justify-center rounded-lg text-wave-sidebar-fg hover:bg-wave-sidebar-hover transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Sair</span>
      </button>
    </div>
  );
};

export default NarrowSidebar;
