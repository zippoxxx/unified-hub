import { useState } from "react";
import { Video, Calendar, LogIn, Search, List, LayoutGrid, User, Clock } from "lucide-react";
import WaveAvatar from "./WaveAvatar";
import { meetings, type Meeting } from "@/data/mockData";
import { cn } from "@/lib/utils";

const MeetingsPanel = () => (
  <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0 p-0">
    <div className="px-4 pt-4 pb-2">
      <div className="flex gap-4 text-sm border-b border-border pb-2">
        <button className="text-primary font-semibold border-b-2 border-primary pb-1">Lista de Reuniões</button>
        <button className="text-muted-foreground hover:text-foreground pb-1">Sala de reuniões</button>
      </div>
    </div>
    <div className="px-3 flex gap-2 py-2">
      <button className="px-3 py-1.5 bg-wave-online text-primary-foreground rounded text-xs font-medium flex items-center gap-1"><Video className="w-3 h-3" /> Reunião agora</button>
      <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> Agenda</button>
      <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1"><LogIn className="w-3 h-3" /> Entrar</button>
    </div>
    <div className="px-4 py-2">
      <span className="text-xs text-muted-foreground font-medium">Histórico da reunião</span>
    </div>
    <div className="flex-1 overflow-y-auto wave-scrollbar">
      {meetings.map((m) => (
        <MeetingRow key={m.id} meeting={m} />
      ))}
    </div>
  </div>
);

const MeetingRow = ({ meeting }: { meeting: Meeting }) => (
  <div className="mx-3 mb-2 border border-border rounded-lg p-3 hover:bg-muted/40 cursor-pointer transition-colors">
    <div className="flex items-start justify-between mb-1">
      <div>
        <span className="text-[11px] text-muted-foreground">{meeting.date}</span>
        <span className="text-[11px] text-muted-foreground ml-2">{meeting.startTime} - {meeting.endTime}</span>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Finalizado</span>
    </div>
    <p className="text-sm font-medium text-foreground">{meeting.title}</p>
    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
      <p>ID da reunião: {meeting.meetingId}</p>
      <p>O Criador: {meeting.creator} ({meeting.creatorExt})</p>
    </div>
  </div>
);

const MeetingsView = ({ meetingId }: { meetingId: string | null }) => {
  const meeting = meetings[0];
  if (!meeting) return <div className="flex-1 bg-background" />;

  return (
    <div className="flex-1 bg-background h-full overflow-y-auto wave-scrollbar">
      <div className="max-w-md mx-auto p-6">
        <div className="flex justify-end mb-4">
          <span className="text-[11px] px-2 py-1 bg-muted text-muted-foreground rounded">Finalizado</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{meeting.title}</h2>
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{meeting.startTime}</p>
            <p className="text-xs text-muted-foreground">{meeting.date}/2026</p>
          </div>
          <span className="text-sm text-muted-foreground">3 m</span>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{meeting.endTime}</p>
            <p className="text-xs text-muted-foreground">{meeting.date}/2026</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <LayoutGrid className="w-4 h-4" />
            <span>{meeting.meetingId}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{meeting.creator} ({meeting.creatorExt})</span>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-primary mb-3">Convidado(s) ({meeting.participants.length})</h3>
          <div className="space-y-3">
            {meeting.participants.map((p) => (
              <div key={p.extension} className="flex items-center gap-3">
                <WaveAvatar name={p.name} size="md" />
                <span className="text-sm text-foreground">{p.name} ({p.extension})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { MeetingsPanel, MeetingsView };
