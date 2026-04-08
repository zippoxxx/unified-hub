import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Megaphone, Shield } from "lucide-react";
import { toast } from "sonner";
import WaveAvatar from "./WaveAvatar";

interface UserRow {
  user_id: string;
  display_name: string;
  extension: string | null;
  department: string | null;
  is_online: boolean;
  role?: string;
  permissions?: {
    module_chats: boolean;
    module_contacts: boolean;
    module_calls: boolean;
    module_meetings: boolean;
  };
}

const AdminPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [tab, setTab] = useState<"users" | "permissions">("users");
  const { user } = useAuth();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return;

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: perms } = await supabase.from("user_permissions").select("*");

    const roleMap = new Map<string, string>();
    roles?.forEach((r) => roleMap.set(r.user_id, r.role));

    const permMap = new Map<string, UserRow["permissions"]>();
    perms?.forEach((p) => permMap.set(p.user_id, {
      module_chats: p.module_chats,
      module_contacts: p.module_contacts,
      module_calls: p.module_calls,
      module_meetings: p.module_meetings,
    }));

    setUsers(profiles.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      extension: p.extension,
      department: p.department,
      is_online: p.is_online,
      role: roleMap.get(p.user_id) || "user",
      permissions: permMap.get(p.user_id),
    })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !user) return;
    await supabase.from("broadcasts").insert({ sender_id: user.id, message: broadcastMsg.trim() });
    toast.success("Broadcast enviado!");
    setBroadcastMsg("");
    setShowBroadcast(false);
  };

  const handleTogglePermission = async (userId: string, module: string, value: boolean) => {
    const updateData: Record<string, boolean> = { [module]: value };
    await supabase.from("user_permissions").update(updateData as any).eq("user_id", userId);
    fetchUsers();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "moderator" | "user" });
    toast.success("Permissão atualizada");
    fetchUsers();
  };

  const handleUpdateProfile = async (userId: string, displayName: string, extension: string, department: string) => {
    await supabase.from("profiles").update({ display_name: displayName, extension, department }).eq("user_id", userId);
    toast.success("Perfil atualizado");
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="w-[600px] border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Gestão
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCreateUser(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Usuário
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowBroadcast(true)}>
            <Megaphone className="w-4 h-4 mr-1" /> Broadcast
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button onClick={() => setTab("users")} className={`flex-1 py-2 text-sm font-medium ${tab === "users" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
          Usuários
        </button>
        <button onClick={() => setTab("permissions")} className={`flex-1 py-2 text-sm font-medium ${tab === "permissions" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
          Permissões de Módulos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto wave-scrollbar p-4">
        {tab === "users" ? (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40">
                <WaveAvatar name={u.display_name} online={u.is_online} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{u.display_name}</span>
                  <p className="text-xs text-muted-foreground">{u.extension || "—"} · {u.department || "—"}</p>
                </div>
                <Select value={u.role} onValueChange={(v) => handleChangeRole(u.user_id, v)}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <button onClick={() => setEditingUser(u)} className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.user_id} className="p-3 rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground mb-2">{u.display_name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["module_chats", "module_contacts", "module_meetings"] as const).map((mod) => (
                    <div key={mod} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{mod.replace("module_", "")}</span>
                      <Switch
                        checked={u.permissions?.[mod] ?? true}
                        onCheckedChange={(v) => handleTogglePermission(u.user_id, mod, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Enviar Aviso Geral</DialogTitle></DialogHeader>
          <Textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Mensagem do broadcast..." rows={4} />
          <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim()} className="w-full">Enviar para todos</Button>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <CreateUserDialog open={showCreateUser} onOpenChange={setShowCreateUser} onCreated={fetchUsers} />

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateProfile} />
      )}
    </div>
  );
};

const CreateUserDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ext, setExt] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha nome, e-mail e senha");
      return;
    }

    setLoading(true);
    try {
      // Use Supabase Auth to create the user via edge function or directly
      // Since we can't use admin API from client, we sign up a new user
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: { data: { display_name: name.trim() } },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update profile with extension and department after trigger creates it
      // Small delay to allow the trigger to fire
      setTimeout(async () => {
        const { data: profiles } = await supabase.from("profiles").select("user_id").eq("display_name", name.trim()).limit(1);
        if (profiles?.[0]) {
          await supabase.from("profiles").update({ extension: ext, department: dept }).eq("user_id", profiles[0].user_id);
        }
        onCreated();
      }, 2000);

      toast.success("Usuário criado! Um e-mail de confirmação foi enviado.");
      setName(""); setEmail(""); setPassword(""); setExt(""); setDept("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha inicial" type="password" />
          <Input value={ext} onChange={(e) => setExt(e.target.value)} placeholder="Ramal" />
          <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Departamento / Setor" />
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditUserDialog = ({ user, onClose, onSave }: {
  user: UserRow;
  onClose: () => void;
  onSave: (userId: string, name: string, ext: string, dept: string) => void;
}) => {
  const [name, setName] = useState(user.display_name);
  const [ext, setExt] = useState(user.extension || "");
  const [dept, setDept] = useState(user.department || "");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input value={ext} onChange={(e) => setExt(e.target.value)} placeholder="Ramal" />
          <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Departamento" />
          <Button onClick={() => onSave(user.user_id, name, ext, dept)} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
