import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Check, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBufferOrganizations, getBufferChannels } from "@/lib/api/ecos";

export interface BufferChannel {
  id: string;
  name: string;
  service: string;
  avatar: string;
  isLocked: boolean;
}

interface BufferConnectProps {
  channels: BufferChannel[];
  selectedChannelIds: string[];
  onChannelsLoaded: (channels: BufferChannel[]) => void;
  onSelectionChange: (ids: string[]) => void;
}

const BufferConnect = ({ channels, selectedChannelIds, onChannelsLoaded, onSelectionChange }: BufferConnectProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get organizations
      const orgResult = await getBufferOrganizations();
      if (!orgResult.success || !orgResult.organizations?.length) {
        throw new Error(orgResult.error || "No organizations found in your Buffer account");
      }

      // Step 2: Get channels for first organization
      const orgId = orgResult.organizations[0].id;
      const channelResult = await getBufferChannels(orgId);
      if (!channelResult.success) {
        throw new Error(channelResult.error || "Failed to fetch channels");
      }

      const activeChannels = (channelResult.channels || []).filter((c: BufferChannel) => !c.isLocked);
      onChannelsLoaded(activeChannels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (id: string) => {
    onSelectionChange(
      selectedChannelIds.includes(id)
        ? selectedChannelIds.filter((c) => c !== id)
        : [...selectedChannelIds, id]
    );
  };

  const serviceLabel = (service: string) => {
    const map: Record<string, string> = {
      twitter: "𝕏", facebook: "Facebook", instagram: "Instagram",
      linkedin: "LinkedIn", pinterest: "Pinterest", tiktok: "TikTok",
      youtube: "YouTube", mastodon: "Mastodon", bluesky: "Bluesky",
      threads: "Threads", googlebusiness: "Google Business",
    };
    return map[service] || service;
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
          <h3 className="text-xs font-semibold text-foreground">Buffer Channels</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchChannels}
          disabled={loading}
          className="text-[9px] font-mono uppercase text-muted-foreground"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="ml-1">{channels.length ? "Refresh" : "Load Channels"}</span>
        </Button>
      </div>

      {error && (
        <p className="text-[10px] text-destructive font-mono">{error}</p>
      )}

      {channels.length === 0 && !loading && !error && (
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          Click "Load Channels" to fetch your Buffer channels. Generate an API key at publish.buffer.com/settings/api.
        </p>
      )}

      {channels.length > 0 && (
        <div className="space-y-1.5">
          {channels.map((ch) => {
            const selected = selectedChannelIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                {ch.avatar && (
                  <img src={ch.avatar} alt="" className="w-5 h-5 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-foreground block truncate">
                    {ch.name}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">{serviceLabel(ch.service)}</span>
                </div>
                {selected && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          <p className="text-[9px] text-muted-foreground font-mono mt-1">
            {selectedChannelIds.length} of {channels.length} channels selected
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BufferConnect;
