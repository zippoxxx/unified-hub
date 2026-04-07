import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { UserStatus } from "./WaveAvatar";

interface Props {
  currentStatus: UserStatus;
  onStatusChange: (status: UserStatus) => void;
  children: React.ReactNode;
}

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: "online", label: "Online", color: "bg-wave-online" },
  { value: "away", label: "Ausente", color: "bg-wave-away" },
  { value: "busy", label: "Ocupado", color: "bg-wave-busy" },
  { value: "offline", label: "Aparecer offline", color: "bg-wave-offline" },
];

const StatusSelector = ({ currentStatus, onStatusChange, children }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-1" side="right" align="start">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Status</p>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onStatusChange(opt.value); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors",
              currentStatus === opt.value && "bg-muted font-medium"
            )}
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", opt.color)} />
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default StatusSelector;
