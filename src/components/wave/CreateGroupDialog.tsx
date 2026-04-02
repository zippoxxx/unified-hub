import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  display_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("profiles")
      .select("user_id, display_name")
      .neq("user_id", user.id)
      .then(({ data }) => { if (data) setUsers(data); });
  }, [open, user]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({ name: name.trim(), type: "group" as const, owner_id: user.id })
      .select()
      .single();

    if (error || !channel) {
      toast.error("Erro ao criar grupo");
      setSubmitting(false);
      return;
    }

    // Add owner + selected members
    const members = [user.id, ...selected].map((uid) => ({
      channel_id: channel.id,
      user_id: uid,
    }));

    await supabase.from("channel_members").insert(members);

    toast.success("Grupo criado!");
    setName("");
    setSelected([]);
    setSubmitting(false);
    onOpenChange(false);
    onCreated();
  };

  const toggleUser = (uid: string) => {
    setSelected((s) => s.includes(uid) ? s.filter((id) => id !== uid) : [...s, uid]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do grupo" />
          <div className="max-h-48 overflow-y-auto space-y-2">
            {users.map((u) => (
              <label key={u.user_id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={selected.includes(u.user_id)} onCheckedChange={() => toggleUser(u.user_id)} />
                <span className="text-sm">{u.display_name}</span>
              </label>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>}
          </div>
          <Button onClick={handleCreate} disabled={submitting || !name.trim()} className="w-full">
            {submitting ? "Criando..." : "Criar Grupo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
