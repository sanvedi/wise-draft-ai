import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Check, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface BufferProfile {
  id: string;
  service: string;
  serviceUsername: string;
  avatar: string;
  formatted: string;
}

interface BufferConnectProps {
  profiles: BufferProfile[];
  selectedProfileIds: string[];
  onProfilesLoaded: (profiles: BufferProfile[]) => void;
  onSelectionChange: (ids: string[]) => void;
}

const BufferConnect = ({ profiles, selectedProfileIds, onProfilesLoaded, onSelectionChange }: BufferConnectProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("publish-buffer", {
        body: { action: "list-profiles" },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      onProfilesLoaded(data.profiles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const toggleProfile = (id: string) => {
    onSelectionChange(
      selectedProfileIds.includes(id)
        ? selectedProfileIds.filter((p) => p !== id)
        : [...selectedProfileIds, id]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-agent-customizer" />
          <h3 className="text-xs font-semibold text-foreground">Buffer Distribution</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchProfiles}
          disabled={loading}
          className="text-[9px] font-mono uppercase text-muted-foreground"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="ml-1">{profiles.length ? "Refresh" : "Load Profiles"}</span>
        </Button>
      </div>

      {error && (
        <p className="text-[10px] text-destructive font-mono">{error}</p>
      )}

      {profiles.length === 0 && !loading && !error && (
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          Click "Load Profiles" to fetch your connected Buffer channels. Make sure your Buffer access token is configured.
        </p>
      )}

      {profiles.length > 0 && (
        <div className="space-y-1.5">
          {profiles.map((p) => {
            const selected = selectedProfileIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProfile(p.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                {p.avatar && (
                  <img src={p.avatar} alt="" className="w-5 h-5 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-foreground block truncate">
                    @{p.serviceUsername}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">{p.formatted}</span>
                </div>
                {selected && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          <p className="text-[9px] text-muted-foreground font-mono mt-1">
            {selectedProfileIds.length} of {profiles.length} channels selected
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BufferConnect;
