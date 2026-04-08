import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, updateProfile } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url }).eq("user_id", user.id);
      updateProfile({ avatar_url });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-1" side="right" align="start">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors"
        >
          <Camera className="w-4 h-4" />
          {uploading ? "Enviando..." : "Alterar foto"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        <div className="h-px bg-border my-1" />
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Status</p>
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
