import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Megaphone } from "lucide-react";

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

const BroadcastBanner = () => {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch latest broadcast
    supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBroadcast(data);
      });

    // Subscribe to new broadcasts
    const channel = supabase
      .channel("broadcasts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, (payload) => {
        setBroadcast(payload.new as Broadcast);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!broadcast || dismissed.has(broadcast.id)) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center gap-3 text-sm shrink-0">
      <Megaphone className="w-4 h-4 shrink-0" />
      <p className="flex-1">{broadcast.message}</p>
      <button onClick={() => setDismissed((s) => new Set(s).add(broadcast.id))} className="p-1 hover:bg-primary-foreground/20 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default BroadcastBanner;
