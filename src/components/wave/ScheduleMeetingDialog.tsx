import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const ScheduleMeetingDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [title, setTitle] = useState("");
  const [roomType, setRoomType] = useState<"virtual" | "presential">("virtual");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("user_id, display_name").neq("user_id", user.id).then(({ data }) => {
      if (data) setUsers(data);
    });
  }, [open, user]);

  const handleSchedule = async () => {
    if (!user || !title.trim() || !date || password.length < 4) {
      toast.error("Preencha todos os campos. Senha mínima: 4 dígitos.");
      return;
    }
    setSubmitting(true);

    const scheduledAt = new Date(date);
    const [h, m] = time.split(":").map(Number);
    scheduledAt.setHours(h, m);

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title: title.trim(),
        password,
        room_type: roomType,
        status: "scheduled" as const,
        recurrence: recurrence || null,
        scheduled_at: scheduledAt.toISOString(),
        creator_id: user.id,
      })
      .select()
      .single();

    if (error || !meeting) {
      toast.error("Erro ao agendar reunião");
      setSubmitting(false);
      return;
    }

    const participants = [user.id, ...selectedUsers].map((uid) => ({
      meeting_id: meeting.id,
      user_id: uid,
    }));
    await supabase.from("meeting_participants").insert(participants);

    toast.success(`Reunião agendada! Código: ${meeting.meeting_code}`);
    setTitle(""); setPassword(""); setSelectedUsers([]); setDate(undefined);
    setSubmitting(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Reunião</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da reunião" />

          <Select value={roomType} onValueChange={(v) => setRoomType(v as "virtual" | "presential")}>
            <SelectTrigger><SelectValue placeholder="Tipo de sala" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="presential">Presencial</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28" />
          </div>

          <Select value={recurrence} onValueChange={setRecurrence}>
            <SelectTrigger><SelectValue placeholder="Recorrência (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem recorrência</SelectItem>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>

          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Senha (mín. 4 dígitos)" maxLength={8} />

          <div>
            <p className="text-sm font-medium mb-2">Convidados</p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {users.map((u) => (
                <label key={u.user_id} className="flex items-center gap-3 p-1.5 rounded hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={selectedUsers.includes(u.user_id)}
                    onCheckedChange={() => setSelectedUsers((s) => s.includes(u.user_id) ? s.filter((id) => id !== u.user_id) : [...s, u.user_id])}
                  />
                  <span className="text-sm">{u.display_name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSchedule} disabled={submitting} className="w-full">
            {submitting ? "Agendando..." : "Agendar Reunião"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
