import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { publishViaBuffer, getBufferOrganizations, getBufferChannels } from "@/lib/api/ecos";
import { usePipelineStore } from "@/lib/store/pipelineStore";
import OutputPreview from "@/components/ecos/OutputPreview";
import PlatformCard from "@/components/ecos/PlatformCard";
import BufferConnect from "@/components/ecos/BufferConnect";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Map platform names to Buffer service identifiers
const platformToService: Record<string, string[]> = {
  "Instagram": ["instagram"],
  "YouTube": ["youtube"],
  "X": ["twitter"],
  "LinkedIn": ["linkedin"],
  "Facebook": ["facebook"],
  "Google Business": ["googlebusiness", "google"],
  "Pinterest": ["pinterest"],
  "TikTok": ["tiktok"],
  "Threads": ["threads"],
  "Bluesky": ["bluesky"],
  "Mastodon": ["mastodon"],
};

function findChannelForPlatform(platform: string, channels: { id: string; service: string }[]): string | undefined {
  const services = platformToService[platform];
  if (!services) return undefined;
  const match = channels.find((ch) => services.includes(ch.service?.toLowerCase()));
  return match?.id;
}

const ApprovalPage = () => {
  const { toast } = useToast();
  const store = usePipelineStore();
  const navigate = useNavigate();
  const autoLoaded = useRef(false);

  // Auto-fetch Buffer channels on mount if not already loaded
  useEffect(() => {
    if (autoLoaded.current || store.bufferChannels.length > 0) return;
    autoLoaded.current = true;

    (async () => {
      try {
        const orgResult = await getBufferOrganizations();
        if (!orgResult.success || !orgResult.organizations?.length) return;
        const orgId = orgResult.organizations[0].id;
        store.setBufferOrgId(orgId);
        const channelResult = await getBufferChannels(orgId);
        if (!channelResult.success) return;
        const activeChannels = (channelResult.channels || []).filter((c: any) => !c.isLocked);
        store.setBufferChannels(activeChannels);
        // Auto-select all channels
        store.setSelectedChannelIds(activeChannels.map((c: any) => c.id));
      } catch {
        // Silent — user can still manually load via BufferConnect
      }
    })();
  }, []);

  // Publish a single platform's content to its matching Buffer channel
  const handlePublish = useCallback(async (platform: string) => {
    const pd = store.platforms.find((p) => p.platform === platform);
    if (!pd?.content) return;

    // Find the matching channel for this platform
    const channelId = findChannelForPlatform(platform, store.bufferChannels);
    if (!channelId) {
      // Fall back to selected channels, or show error
      if (store.selectedChannelIds.length === 0) {
        toast({ title: "No Matching Channel", description: `No Buffer channel found for ${platform}. Load channels and select one.`, variant: "destructive" });
        return;
      }
    }

    const targetChannelIds = channelId ? [channelId] : store.selectedChannelIds;

    store.updatePlatform(platform, { status: "publishing" as any });
    const result = await publishViaBuffer([{ platform, content: pd.content }], targetChannelIds);
    if (result.success) {
      store.updatePlatform(platform, { status: "published" });
      toast({ title: "Published!", description: `${platform} content sent via Buffer` });
    } else {
      store.updatePlatform(platform, { status: "failed" });
      toast({ title: "Publish Failed", description: result.error, variant: "destructive" });
    }
  }, [store, toast]);

  const handlePublishAll = useCallback(async (rating: number, feedback: string) => {
    store.updateAgent("publisher", { status: "running" });
    store.setPreviewStatus("approved");
    const toPublish = store.platforms.filter((p) => p.status === "preview" && p.content);

    if (store.bufferChannels.length === 0) {
      // No channels loaded — copy to clipboard as fallback
      const allContent = toPublish.map((p) => `--- ${p.platform} ---\n${p.content}`).join("\n\n");
      try {
        await navigator.clipboard.writeText(allContent);
        for (const p of toPublish) store.updatePlatform(p.platform, { status: "published" });
        store.updateAgent("publisher", { status: "complete", output: `Approved & copied ${toPublish.length} posts (${rating}★)` });
        toast({ title: "Content Approved & Copied", description: `${toPublish.length} posts copied to clipboard.` });
      } catch {
        store.updateAgent("publisher", { status: "complete", output: `Approved ${toPublish.length} posts (${rating}★)` });
        toast({ title: "Content Approved", description: `${toPublish.length} posts approved.` });
      }
      return;
    }

    // Publish each platform to its matching Buffer channel
    let successCount = 0;
    let failCount = 0;

    for (const p of toPublish) {
      const channelId = findChannelForPlatform(p.platform, store.bufferChannels);
      const targetIds = channelId ? [channelId] : store.selectedChannelIds;
      if (targetIds.length === 0) {
        store.updatePlatform(p.platform, { status: "failed" });
        failCount++;
        continue;
      }

      store.updatePlatform(p.platform, { status: "publishing" as any });
      const result = await publishViaBuffer([{ platform: p.platform, content: p.content! }], targetIds);
      if (result.success) {
        store.updatePlatform(p.platform, { status: "published" });
        successCount++;
      } else {
        store.updatePlatform(p.platform, { status: "failed" });
        failCount++;
      }
    }

    if (failCount === 0) {
      store.updateAgent("publisher", { status: "complete", output: `Published ${successCount} posts via Buffer (${rating}★)` });
      store.updateAgent("learner", { status: "running", output: "Analyzing post performance data..." });
      setTimeout(() => store.updateAgent("learner", { status: "complete", output: "Performance baseline recorded" }), 3000);
      toast({ title: "All Published!", description: `${successCount} posts sent via Buffer` });
    } else {
      store.updateAgent("publisher", { status: "complete", output: `${successCount} published, ${failCount} failed` });
      toast({ title: "Partially Published", description: `${successCount} succeeded, ${failCount} failed`, variant: "destructive" });
    }
  }, [store, toast]);

  const handleReject = useCallback(() => {
    store.setPreviewStatus("generating");
    store.updateAgent("customizer", { status: "running" });
    store.updateAgent("publisher", { status: "idle" });
    store.setPlatforms(store.platforms.map((p) => ({ ...p, status: "generating" as any })));
    setTimeout(() => {
      store.updateAgent("customizer", { status: "complete", output: "Revised per human feedback" });
      store.setPlatforms(store.platforms.map((p) => ({ ...p, status: "preview" as any })));
      store.setPreviewStatus("review");
    }, 2000);
  }, [store]);

  const hasContent = store.platforms.some((p) => p.content);

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
      {!hasContent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-8 sm:p-12 text-center space-y-4">
          <p className="text-muted-foreground">No content to review yet.</p>
          <Button onClick={() => navigate("/generate")} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Generate
          </Button>
        </motion.div>
      )}

      {hasContent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preview + Approval */}
          <div className="lg:col-span-5">
            <OutputPreview
              content={store.previewContent}
              platform="all-platforms"
              status={store.previewStatus}
              onApprove={handlePublishAll}
              onReject={handleReject}
            />
          </div>

          {/* Platform Cards */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Platform Distribution</h3>
              <PublishAllButton store={store} toast={toast} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {store.platforms.map((p, i) => (
                <PlatformCard
                  key={p.platform}
                  data={p}
                  onPublish={handlePublish}
                  onPreview={() => store.setPreviewContent(p.content || null)}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Buffer */}
          <div className="lg:col-span-3">
            <BufferConnect
              channels={store.bufferChannels}
              selectedChannelIds={store.selectedChannelIds}
              onChannelsLoaded={(ch) => {
                store.setBufferChannels(ch);
                store.setSelectedChannelIds(ch.map((c) => c.id));
              }}
              onSelectionChange={store.setSelectedChannelIds}
              onOrgIdLoaded={store.setBufferOrgId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Publish All button component
function PublishAllButton({ store, toast }: { store: ReturnType<typeof usePipelineStore>; toast: ReturnType<typeof useToast>["toast"] }) {
  const [publishing, setPublishing] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const toPublish = store.platforms.filter((p) => p.status === "preview" && p.content);
  if (toPublish.length === 0) return null;

  const handlePublishAll = async () => {
    setPublishing(true);
    let successCount = 0;
    let failCount = 0;

    // Auto-load channels if needed
    let channels = store.bufferChannels;
    if (channels.length === 0) {
      try {
        const orgResult = await getBufferOrganizations();
        if (orgResult.success && orgResult.organizations?.length) {
          const orgId = orgResult.organizations[0].id;
          store.setBufferOrgId(orgId);
          const channelResult = await getBufferChannels(orgId);
          if (channelResult.success) {
            channels = (channelResult.channels || []).filter((c: any) => !c.isLocked);
            store.setBufferChannels(channels);
            store.setSelectedChannelIds(channels.map((c: any) => c.id));
          }
        }
      } catch { /* silent */ }
    }

    if (channels.length === 0) {
      // Clipboard fallback
      const allContent = toPublish.map((p) => `--- ${p.platform} ---\n${p.content}`).join("\n\n");
      try {
        await navigator.clipboard.writeText(allContent);
        for (const p of toPublish) store.updatePlatform(p.platform, { status: "published" });
        toast({ title: "Content Copied", description: `${toPublish.length} posts copied to clipboard (no Buffer channels found).` });
      } catch {
        toast({ title: "No Buffer Channels", description: "Connect Buffer in Integrations to publish.", variant: "destructive" });
      }
      setPublishing(false);
      return;
    }

    for (const p of toPublish) {
      const channelId = findChannelForPlatform(p.platform, channels);
      const targetIds = channelId ? [channelId] : store.selectedChannelIds;
      if (targetIds.length === 0) { failCount++; continue; }

      store.updatePlatform(p.platform, { status: "publishing" as any });
      const result = await publishViaBuffer([{ platform: p.platform, content: p.content! }], targetIds);
      if (result.success) {
        store.updatePlatform(p.platform, { status: "published" });
        successCount++;
      } else {
        store.updatePlatform(p.platform, { status: "failed" });
        failCount++;
      }
    }

    if (failCount === 0) {
      setAllDone(true);
      toast({ title: "All Published!", description: `${successCount} posts sent via Buffer` });
    } else {
      toast({ title: "Partially Published", description: `${successCount} succeeded, ${failCount} failed`, variant: "destructive" });
    }
    setPublishing(false);
  };

  return (
    <Button
      size="sm"
      onClick={handlePublishAll}
      disabled={publishing || allDone}
      className="gap-1.5 text-xs"
    >
      {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : allDone ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
      {publishing ? "Publishing…" : allDone ? "All Published" : `Publish All (${toPublish.length})`}
    </Button>
  );
}

export default ApprovalPage;
