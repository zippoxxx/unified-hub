import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: (meetingId: string) => void;
}

const JoinMeetingDialog = ({ open, onOpenChange, onJoined }: Props) => {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleJoin = async () => {
    if (!user || !code.trim() || !password.trim()) {
      toast.error("Preencha o ID e a senha da reunião");
      return;
    }
    setSubmitting(true);

    const { data: meeting } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_code", code.trim())
      .maybeSingle();

    if (!meeting) {
      toast.error("Reunião não encontrada");
      setSubmitting(false);
      return;
    }

    if (meeting.password !== password) {
      toast.error("Senha incorreta");
      setSubmitting(false);
      return;
    }

    // Add as participant
    await supabase.from("meeting_participants").upsert(
      { meeting_id: meeting.id, user_id: user.id, joined_at: new Date().toISOString() },
      { onConflict: "meeting_id,user_id" }
    );

    toast.success("Você entrou na reunião!");
    setCode("");
    setPassword("");
    setSubmitting(false);
    onOpenChange(false);
    onJoined(meeting.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar em Reunião</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ID da Reunião" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
          <Button onClick={handleJoin} disabled={submitting} className="w-full">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinMeetingDialog;
