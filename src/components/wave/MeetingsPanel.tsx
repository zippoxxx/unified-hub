import { useState, useEffect } from "react";
import { Video, Calendar, LogIn, Search, LayoutGrid, User, Clock } from "lucide-react";
import WaveAvatar from "./WaveAvatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import ScheduleMeetingDialog from "./ScheduleMeetingDialog";
import JoinMeetingDialog from "./JoinMeetingDialog";
import { toast } from "sonner";

interface MeetingRow {
  id: string;
  title: string;
  meeting_code: string;
  password: string;
  room_type: string;
  status: string;
  recurrence: string | null;
  scheduled_at: string | null;
  ended_at: string | null;
  creator_id: string;
  created_at: string;
  creatorName?: string;
}

interface Props {
  onSelectMeeting: (id: string) => void;
}

const MeetingsPanel = ({ onSelectMeeting }: Props) => {
  const [view, setView] = useState<"list" | "rooms">("list");
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { user } = useAuth();

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    const creatorIds = [...new Set(data.map((m) => m.creator_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", creatorIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

    setMeetings(data.map((m) => ({ ...m, creatorName: profileMap.get(m.creator_id) || "Usuário" })));
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleInstantMeeting = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        title: `Reunião rápida`,
        password: String(Math.floor(1000 + Math.random() * 9000)),
        room_type: "virtual" as const,
        status: "in_progress" as const,
        creator_id: user.id,
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) { toast.error("Erro ao criar reunião"); return; }

    await supabase.from("meeting_participants").insert({ meeting_id: data.id, user_id: user.id, joined_at: new Date().toISOString() });
    toast.success(`Reunião criada! Código: ${data.meeting_code}`);
    fetchMeetings();
    onSelectMeeting(data.id);
  };

  const inProgressMeetings = meetings.filter((m) => m.status === "in_progress");

  const statusBadge = (status: string) => {
    if (status === "in_progress") return <Badge className="bg-primary text-primary-foreground text-[10px]">Em Andamento</Badge>;
    if (status === "finished") return <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>;
    return <Badge variant="outline" className="text-[10px]">Agendado</Badge>;
  };

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-4 text-sm border-b border-border pb-2">
          <button onClick={() => setView("list")} className={cn("pb-1", view === "list" ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            Lista de Reuniões
          </button>
          <button onClick={() => setView("rooms")} className={cn("pb-1", view === "rooms" ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            Sala de reuniões
          </button>
        </div>
      </div>

      <div className="px-3 flex gap-2 py-2">
        <button onClick={handleInstantMeeting} className="px-3 py-1.5 bg-wave-online text-primary-foreground rounded text-xs font-medium flex items-center gap-1">
          <Video className="w-3 h-3" /> Reunião agora
        </button>
        <button onClick={() => setShowSchedule(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Agenda
        </button>
        <button onClick={() => setShowJoin(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1">
          <LogIn className="w-3 h-3" /> Entrar
        </button>
      </div>

      {view === "list" ? (
        <>
          <div className="px-4 py-2">
            <span className="text-xs text-muted-foreground font-medium">Histórico da reunião</span>
          </div>
          <div className="flex-1 overflow-y-auto wave-scrollbar">
            {meetings.map((m) => (
              <div key={m.id} onClick={() => onSelectMeeting(m.id)} className="mx-3 mb-2 border border-border rounded-lg p-3 hover:bg-muted/40 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString("pt-BR") : new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {statusBadge(m.status)}
                </div>
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>ID: {m.meeting_code}</p>
                  <p>Criador: {m.creatorName}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto wave-scrollbar p-3">
          {inProgressMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Video className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma sala disponível</p>
              <p className="text-xs text-muted-foreground mt-1">Crie uma reunião para começar</p>
            </div>
          ) : (
            inProgressMeetings.map((m) => (
              <div key={m.id} onClick={() => onSelectMeeting(m.id)} className="mb-2 border border-primary/30 bg-primary/5 rounded-lg p-3 cursor-pointer hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-wave-online animate-pulse" />
                  <span className="text-sm font-medium text-foreground">{m.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">Código: {m.meeting_code}</p>
              </div>
            ))
          )}
        </div>
      )}

      <ScheduleMeetingDialog open={showSchedule} onOpenChange={setShowSchedule} onCreated={fetchMeetings} />
      <JoinMeetingDialog open={showJoin} onOpenChange={setShowJoin} onJoined={(id) => { onSelectMeeting(id); fetchMeetings(); }} />
    </div>
  );
};

const MeetingsView = ({ meetingId }: { meetingId: string | null }) => {
  const [meeting, setMeeting] = useState<MeetingRow | null>(null);
  const [participants, setParticipants] = useState<{ name: string; extension: string | null }[]>([]);

  useEffect(() => {
    if (!meetingId) return;

    supabase.from("meetings").select("*").eq("id", meetingId).maybeSingle().then(async ({ data }) => {
      if (!data) return;
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", data.creator_id).maybeSingle();
      setMeeting({ ...data, creatorName: profile?.display_name || "Usuário" });
    });

    supabase.from("meeting_participants").select("user_id").eq("meeting_id", meetingId).then(async ({ data }) => {
      if (!data) return;
      const userIds = data.map((p) => p.user_id);
      const { data: profiles } = await supabase.from("profiles").select("display_name, extension").in("user_id", userIds);
      setParticipants(profiles?.map((p) => ({ name: p.display_name, extension: p.extension })) || []);
    });
  }, [meetingId]);

  if (!meetingId || !meeting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Selecione uma reunião</p>
      </div>
    );
  }

  const statusBadge = meeting.status === "in_progress"
    ? <Badge className="bg-primary text-primary-foreground">Em Andamento</Badge>
    : meeting.status === "finished"
    ? <Badge variant="secondary">Finalizado</Badge>
    : <Badge variant="outline">Agendado</Badge>;

  return (
    <div className="flex-1 bg-background h-full overflow-y-auto wave-scrollbar">
      <div className="max-w-md mx-auto p-6">
        <div className="flex justify-end mb-4">{statusBadge}</div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{meeting.title}</h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <LayoutGrid className="w-4 h-4" />
            <span>Código: {meeting.meeting_code}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Criador: {meeting.creatorName}</span>
          </div>
          {meeting.scheduled_at && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{new Date(meeting.scheduled_at).toLocaleString("pt-BR")}</span>
            </div>
          )}
          {meeting.room_type && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Video className="w-4 h-4" />
              <span>{meeting.room_type === "virtual" ? "Virtual" : "Presencial"}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-primary mb-3">Participantes ({participants.length})</h3>
          <div className="space-y-3">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <WaveAvatar name={p.name} size="md" />
                <span className="text-sm text-foreground">{p.name} {p.extension ? `(${p.extension})` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { MeetingsPanel, MeetingsView };
