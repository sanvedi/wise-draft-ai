import { useCallback, useEffect, useRef, useState } from "react";
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
import { buildPublishText, getMatchingBufferChannelIds } from "@/lib/buffer";

const ApprovalPage = () => {
  const { toast } = useToast();
  const store = usePipelineStore();
  const navigate = useNavigate();
  const autoLoaded = useRef(false);

  const ensureChannelsLoaded = useCallback(async () => {
    if (store.bufferChannels.length > 0) return store.bufferChannels;

    const orgResult = await getBufferOrganizations();
    if (!orgResult.success || !orgResult.organizations?.length) {
      throw new Error(orgResult.error || "Buffer is not connected.");
    }

    const orgId = orgResult.organizations[0].id;
    store.setBufferOrgId(orgId);
    const channelResult = await getBufferChannels(orgId);
    if (!channelResult.success) {
      throw new Error(channelResult.error || "Could not load Buffer channels.");
    }

    const activeChannels = (channelResult.channels || []).filter((channel: any) => !channel.isLocked);
    store.setBufferChannels(activeChannels);
    if (store.selectedChannelIds.length === 0) {
      store.setSelectedChannelIds(activeChannels.map((channel: any) => channel.id));
    }

    return activeChannels;
  }, [store]);

  useEffect(() => {
    if (autoLoaded.current || store.bufferChannels.length > 0) return;
    autoLoaded.current = true;

    ensureChannelsLoaded().catch(() => undefined);
  }, [ensureChannelsLoaded, store.bufferChannels.length]);

  const publishPlatforms = useCallback(async (platformsToPublish: typeof store.platforms) => {
    const channels = await ensureChannelsLoaded();
    let successCount = 0;
    let failCount = 0;

    for (const platformData of platformsToPublish) {
      const targetIds = getMatchingBufferChannelIds(platformData.platform, channels, store.selectedChannelIds);
      if (!targetIds.length || !platformData.content) {
        store.updatePlatform(platformData.platform, { status: "failed" });
        failCount += 1;
        continue;
      }

      store.updatePlatform(platformData.platform, { status: "publishing" as const });
      const result = await publishViaBuffer([
        {
          platform: platformData.platform,
          content: buildPublishText(platformData.content),
        },
      ], targetIds);

      if (result.success) {
        store.updatePlatform(platformData.platform, { status: "published" });
        successCount += 1;
      } else {
        store.updatePlatform(platformData.platform, { status: "failed" });
        failCount += 1;
      }
    }

    return { successCount, failCount };
  }, [ensureChannelsLoaded, store]);

  const handlePublish = useCallback(async (platform: string) => {
    const platformData = store.platforms.find((item) => item.platform === platform && item.content);
    if (!platformData) return;

    try {
      const { successCount } = await publishPlatforms([platformData]);
      if (successCount > 0) {
        toast({ title: "Published", description: `${platform} is live via Buffer.` });
      } else {
        toast({ title: "Publish Failed", description: `No selected Buffer channel matched ${platform}.`, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Could not publish via Buffer.",
        variant: "destructive",
      });
      store.updatePlatform(platform, { status: "failed" });
    }
  }, [publishPlatforms, store, toast]);

  const handlePublishAll = useCallback(async (rating: number, feedback: string) => {
    const readyPlatforms = store.platforms.filter((platform) => platform.status === "preview" && platform.content);
    if (readyPlatforms.length === 0) return;

    store.updateAgent("publisher", { status: "running" });
    store.setPreviewStatus("approved");

    try {
      const { successCount, failCount } = await publishPlatforms(readyPlatforms);

      if (failCount === 0) {
        store.updateAgent("publisher", { status: "complete", output: `Published ${successCount} posts via Buffer (${rating}★)` });
        store.updateAgent("learner", { status: "running", output: "Analyzing post performance data..." });
        setTimeout(() => store.updateAgent("learner", { status: "complete", output: feedback || "Performance baseline recorded" }), 2000);
        toast({ title: "All Published", description: `${successCount} posts were sent via Buffer.` });
        return;
      }

      store.setPreviewStatus("review");
      store.updateAgent("publisher", { status: "complete", output: `${successCount} published, ${failCount} failed` });
      toast({ title: "Partially Published", description: `${successCount} succeeded and ${failCount} failed.`, variant: "destructive" });
    } catch (error) {
      store.setPreviewStatus("review");
      store.updateAgent("publisher", { status: "failed", output: error instanceof Error ? error.message : "Publish failed" });
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Could not publish via Buffer.",
        variant: "destructive",
      });
    }
  }, [publishPlatforms, store, toast]);

  const handleReject = useCallback(() => {
    store.setPreviewStatus("generating");
    store.updateAgent("customizer", { status: "running" });
    store.updateAgent("publisher", { status: "idle" });
    store.setPlatforms(store.platforms.map((platform) => ({ ...platform, status: "generating" as const })));

    setTimeout(() => {
      store.updateAgent("customizer", { status: "complete", output: "Revised per human feedback" });
      store.setPlatforms(store.platforms.map((platform) => ({ ...platform, status: "preview" as const })));
      store.setPreviewStatus("review");
    }, 2000);
  }, [store]);

  const hasContent = store.platforms.some((platform) => platform.content);
  const readyCount = store.platforms.filter((platform) => platform.status === "preview" && platform.content).length;

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
          <div className="lg:col-span-5">
            <OutputPreview
              content={store.previewContent}
              platform="all-platforms"
              status={store.previewStatus}
              onApprove={handlePublishAll}
              onReject={handleReject}
            />
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Platform Distribution</h3>
              <PublishAllButton count={readyCount} onPublishAll={() => handlePublishAll(5, "Bulk publish")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {store.platforms.map((platform, index) => (
                <PlatformCard
                  key={platform.platform}
                  data={platform}
                  onPublish={handlePublish}
                  onPreview={() => store.setPreviewContent(platform.content || null)}
                  index={index}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <BufferConnect
              channels={store.bufferChannels}
              selectedChannelIds={store.selectedChannelIds}
              onChannelsLoaded={(channels) => {
                store.setBufferChannels(channels);
                store.setSelectedChannelIds(channels.map((channel) => channel.id));
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

function PublishAllButton({ count, onPublishAll }: { count: number; onPublishAll: () => Promise<void> }) {
  const [publishing, setPublishing] = useState(false);
  const [allDone, setAllDone] = useState(false);

  if (count === 0) return null;

  const handleClick = async () => {
    setPublishing(true);
    try {
      await onPublishAll();
      setAllDone(true);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Button size="sm" onClick={handleClick} disabled={publishing || allDone} className="gap-1.5 text-xs">
      {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : allDone ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
      {publishing ? "Publishing…" : allDone ? "All Published" : `Publish All (${count})`}
    </Button>
  );
}

export default ApprovalPage;
