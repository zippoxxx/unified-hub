import { useState, useEffect } from "react";
import { Search, Users, Star, MessageSquare, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import WaveAvatar from "./WaveAvatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ContactFilter = "all" | "favorites";

interface ProfileRow {
  user_id: string;
  display_name: string;
  extension: string | null;
  department: string | null;
  is_online: boolean;
}

interface Props {
  selectedContact: string | null;
  onSelectContact: (id: string) => void;
  onStartChat: (userId: string) => void;
}

const ContactsPanel = ({ selectedContact, onSelectContact, onStartChat }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("favorite_user_id").eq("user_id", user.id);
    setFavorites(new Set(data?.map((f) => f.favorite_user_id) || []));
  };

  useEffect(() => { fetchFavorites(); }, [user]);

  const filters = [
    { id: "all" as const, label: "Todos", icon: Users },
    { id: "favorites" as const, label: "Favoritos", icon: Star },
  ];

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar nome, ramal ou setor" className="pl-8 h-8 text-sm bg-wave-input-bg border-border" />
        </div>
      </div>

      <div className="space-y-0.5 px-2">
        {filters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              filter === id ? "bg-muted text-foreground font-medium" : "text-foreground hover:bg-muted/60"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
              id === "all" ? "bg-primary" : "bg-amber-500"
            )}>
              <Icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto wave-scrollbar mt-2" />
    </div>
  );
};

const ContactsView = ({ contactId, onStartChat }: { contactId: string | null; onStartChat?: (userId: string) => void }) => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const { user } = useAuth();

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, display_name, extension, department, is_online");
    if (data) setProfiles(data);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("favorite_user_id").eq("user_id", user.id);
    setFavorites(new Set(data?.map((f) => f.favorite_user_id) || []));
  };

  useEffect(() => {
    fetchProfiles();
    fetchFavorites();
  }, [user]);

  const handleAddFavorite = async (favoriteUserId: string) => {
    if (!user) return;
    if (favorites.has(favoriteUserId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("favorite_user_id", favoriteUserId);
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, favorite_user_id: favoriteUserId });
      toast.success("Adicionado aos favoritos");
    }
    fetchFavorites();
  };

  // Listen for filter changes from sidebar (use a simple approach via URL hash or shared state)
  // For now, add a local filter toggle in the view header

  const filtered = profiles
    .filter((p) => p.user_id !== user?.id)
    .filter((p) => {
      if (filter === "favorites") return favorites.has(p.user_id);
      return true;
    })
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.display_name.toLowerCase().includes(q) ||
        (p.extension || "").toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q)
      );
    });

  const grouped: Record<string, ProfileRow[]> = {};
  filtered.forEach((p) => {
    const letter = p.display_name[0]?.toUpperCase() || "#";
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(p);
  });

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card gap-4">
        <h2 className="text-base font-semibold text-foreground">Contatos</h2>
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant={filter === "all" ? "default" : "ghost"} onClick={() => setFilter("all")} className="h-7 text-xs">Todos</Button>
          <Button size="sm" variant={filter === "favorites" ? "default" : "ghost"} onClick={() => setFilter("favorites")} className="h-7 text-xs">
            <Star className="w-3 h-3 mr-1" /> Favoritos
          </Button>
        </div>
      </div>

      <div className="px-6 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, ramal ou setor..." className="pl-8 h-9 text-sm bg-wave-input-bg border-border" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto wave-scrollbar relative">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {search ? "Nenhum contato encontrado" : "Nenhum usuário cadastrado"}
          </p>
        )}

        {/* Alphabet index */}
        {Object.keys(grouped).length > 0 && (
          <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center text-[10px] text-primary font-medium z-10">
            {Object.keys(grouped).sort().map((l) => (
              <span key={l} className="leading-tight px-1 cursor-pointer hover:text-primary/70">{l}</span>
            ))}
          </div>
        )}

        {Object.entries(grouped).sort().map(([letter, items]) => (
          <div key={letter}>
            <div className="px-6 py-2 text-xs font-medium text-primary">
              {letter} ({items.length})
            </div>
            {items.map((p) => (
              <div key={p.user_id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors">
                <WaveAvatar name={p.display_name} online={p.is_online} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{p.display_name}</span>
                  <p className="text-xs text-muted-foreground">{p.extension || "—"} · {p.department || "—"}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                    title="Conversar"
                    onClick={() => onStartChat?.(p.user_id)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn("h-8 w-8 p-0", favorites.has(p.user_id) ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
                    title={favorites.has(p.user_id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    onClick={() => handleAddFavorite(p.user_id)}
                  >
                    <Star className={cn("w-4 h-4", favorites.has(p.user_id) && "fill-current")} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export { ContactsPanel, ContactsView };
