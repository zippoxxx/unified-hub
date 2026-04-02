import { useState } from "react";
import { PhoneIncoming, Voicemail, MoreHorizontal, Video, Phone as PhoneIcon, PhoneMissed } from "lucide-react";
import WaveAvatar from "./WaveAvatar";
import { callHistory } from "@/data/mockData";
import { cn } from "@/lib/utils";

const CallsPanel = () => {
  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="space-y-0.5 p-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted text-foreground font-medium text-sm">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <PhoneIncoming className="w-4 h-4 text-primary-foreground" />
          </div>
          <span>Chamadas recentes</span>
          <MoreHorizontal className="w-4 h-4 ml-auto text-muted-foreground" />
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground text-sm hover:bg-muted/60">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <Voicemail className="w-4 h-4 text-primary-foreground" />
          </div>
          <span>Correio de voz</span>
        </button>
      </div>

      {/* Dialer */}
      <div className="px-4 mt-2">
        <input
          placeholder="Digite o nome ou número"
          className="w-full h-8 px-3 text-sm border border-border rounded-md bg-wave-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="grid grid-cols-3 gap-1 mt-3">
          {[
            ["1", ""], ["2", "ABC"], ["3", "DEF"],
            ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
            ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
            ["*", ""], ["0", ""], ["#", ""],
          ].map(([num, letters]) => (
            <button key={num} className="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <span className="text-lg font-medium text-foreground">{num}</span>
              {letters && <span className="text-[9px] text-muted-foreground tracking-widest">{letters}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-3 justify-center pb-3">
          <button className="w-14 h-10 rounded-full bg-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </button>
          <button className="w-14 h-10 rounded-full bg-wave-online flex items-center justify-center">
            <PhoneIcon className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CallsView = () => (
  <div className="flex-1 flex flex-col bg-background h-full">
    <div className="flex-1 overflow-y-auto wave-scrollbar">
      {callHistory.map((call) => (
        <div key={call.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors border-b border-border/50">
          <WaveAvatar name={call.name} online={call.online} />
          <div className="flex-1 min-w-0">
            <span className={cn("text-sm font-medium", call.type === "missed" ? "text-wave-missed" : "text-foreground")}>{call.name}</span>
            <p className="text-xs text-muted-foreground">{call.extension}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <PhoneMissed className="w-4 h-4 text-wave-missed" />
            <span className="text-wave-missed text-xs">Chamada Perdida</span>
          </div>
          <span className="text-xs text-muted-foreground ml-2">{call.date} {call.time}</span>
        </div>
      ))}
    </div>
  </div>
);

export { CallsPanel, CallsView };
