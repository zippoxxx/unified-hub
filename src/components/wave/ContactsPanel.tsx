import { useState } from "react";
import { Search, Users, Star, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaveAvatar from "./WaveAvatar";
import { contacts } from "@/data/mockData";
import { cn } from "@/lib/utils";

type ContactFilter = "all" | "favorites" | "company";

const filters = [
  { id: "all" as const, label: "Todos", icon: Users },
  { id: "favorites" as const, label: "Favoritos", icon: Star },
  { id: "company" as const, label: "Contatos da empresa (100)", icon: Building2 },
];

interface Props {
  selectedContact: string | null;
  onSelectContact: (id: string) => void;
}

const ContactsPanel = ({ selectedContact, onSelectContact }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  // Group by first letter
  const grouped: Record<string, typeof contacts> = {};
  filtered.forEach((c) => {
    const letter = c.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" className="pl-8 h-8 text-sm bg-wave-input-bg border-border" />
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
              id === "all" ? "bg-primary" : id === "favorites" ? "bg-amber-500" : "bg-primary"
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

const ContactsView = ({ contactId }: { contactId: string | null }) => {
  const filtered = contacts;
  const grouped: Record<string, typeof contacts> = {};
  filtered.forEach((c) => {
    const letter = c.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card">
        <h2 className="text-base font-semibold text-foreground">Todos</h2>
      </div>
      <div className="flex-1 overflow-y-auto wave-scrollbar relative">
        {/* Alphabet index */}
        <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center text-[10px] text-primary font-medium z-10">
          {"ABCDEFGHIJKLMNOPQRST".split("").map((l) => (
            <span key={l} className="leading-tight px-1 cursor-pointer hover:text-primary/70">{l}</span>
          ))}
        </div>

        {Object.entries(grouped).sort().map(([letter, items]) => (
          <div key={letter}>
            <div className="px-6 py-2 text-xs font-medium text-primary">
              {letter} ({items.length})
            </div>
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <WaveAvatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {c.external && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Externo</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.extension} ({c.department})</p>
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
