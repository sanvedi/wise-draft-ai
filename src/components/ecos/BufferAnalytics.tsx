import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Loader2, Calendar, Send as SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBufferPosts } from "@/lib/api/ecos";

interface BufferPost {
  id: string;
  text: string;
  status: string;
  createdAt: string;
  dueAt: string;
  channelId: string;
  channelService: string;
  via: string;
}

interface ChannelStats {
  service: string;
  count: number;
}

interface BufferAnalyticsProps {
  organizationId: string | null;
  channelIds: string[];
}

const BufferAnalytics = ({ organizationId, channelIds }: BufferAnalyticsProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<BufferPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchAnalytics = async () => {
    if (!organizationId) {
      setError("Load Buffer channels first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getBufferPosts(organizationId, channelIds.length > 0 ? channelIds : undefined);
      if (!result.success) throw new Error(result.error);
      setPosts(result.posts || []);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const channelStats: ChannelStats[] = posts.reduce((acc, post) => {
    const existing = acc.find((s) => s.service === post.channelService);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ service: post.channelService, count: 1 });
    }
    return acc;
  }, [] as ChannelStats[]);

  const apiPosts = posts.filter((p) => p.via === "api").length;
  const recentPosts = posts.slice(0, 5);

  const serviceLabel = (service: string) => {
    const map: Record<string, string> = {
      twitter: "𝕏", facebook: "Facebook", instagram: "Instagram",
      linkedin: "LinkedIn", pinterest: "Pinterest", tiktok: "TikTok",
      youtube: "YouTube", mastodon: "Mastodon", bluesky: "Bluesky",
      threads: "Threads", googlebusiness: "Google Biz",
    };
    return map[service] || service;
  };

  const serviceColor = (service: string) => {
    const map: Record<string, string> = {
      twitter: "bg-blue-500/20 text-blue-400",
      facebook: "bg-indigo-500/20 text-indigo-400",
      instagram: "bg-pink-500/20 text-pink-400",
      linkedin: "bg-sky-500/20 text-sky-400",
      youtube: "bg-red-500/20 text-red-400",
      googlebusiness: "bg-emerald-500/20 text-emerald-400",
    };
    return map[service] || "bg-muted text-muted-foreground";
  };

  const maxCount = Math.max(...channelStats.map((s) => s.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-agent-reviewer" />
          <h3 className="text-xs font-semibold text-foreground">Buffer Analytics</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchAnalytics}
          disabled={loading}
          className="text-[9px] font-mono uppercase text-muted-foreground"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="ml-1">{loaded ? "Refresh" : "Load Analytics"}</span>
        </Button>
      </div>

      {error && <p className="text-[10px] text-destructive font-mono">{error}</p>}

      {!loaded && !loading && !error && (
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          Click "Load Analytics" to view your recent Buffer post activity.
        </p>
      )}

      {loaded && (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-muted/30 border border-border p-2 text-center">
              <p className="text-lg font-bold text-foreground">{posts.length}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Total Sent</p>
            </div>
            <div className="rounded-md bg-muted/30 border border-border p-2 text-center">
              <p className="text-lg font-bold text-foreground">{channelStats.length}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Channels</p>
            </div>
            <div className="rounded-md bg-muted/30 border border-border p-2 text-center">
              <p className="text-lg font-bold text-foreground">{apiPosts}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Via API</p>
            </div>
          </div>

          {/* Channel breakdown bar chart */}
          {channelStats.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Posts by Channel</p>
              {channelStats
                .sort((a, b) => b.count - a.count)
                .map((stat) => (
                  <div key={stat.service} className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono w-16 truncate ${serviceColor(stat.service).split(" ")[1]}`}>
                      {serviceLabel(stat.service)}
                    </span>
                    <div className="flex-1 h-4 bg-muted/20 rounded-sm overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-sm ${serviceColor(stat.service).split(" ")[0]}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-foreground w-6 text-right">{stat.count}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Recent posts */}
          {recentPosts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent Posts</p>
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-2 p-1.5 rounded-md bg-muted/10 border border-border/50">
                  <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${serviceColor(post.channelService)}`}>
                    {serviceLabel(post.channelService)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground truncate">{post.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-muted-foreground font-mono flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.via === "api" && (
                        <span className="text-[8px] text-primary font-mono flex items-center gap-0.5">
                          <SendIcon className="w-2.5 h-2.5" />
                          API
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {posts.length === 0 && (
            <p className="text-[10px] text-muted-foreground font-mono text-center py-2">No sent posts found</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default BufferAnalytics;
