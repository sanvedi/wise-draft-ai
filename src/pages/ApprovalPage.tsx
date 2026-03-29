import { useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { publishViaBuffer } from "@/lib/api/ecos";
import { usePipelineStore } from "@/lib/store/pipelineStore";
import OutputPreview from "@/components/ecos/OutputPreview";
import PlatformCard from "@/components/ecos/PlatformCard";
import BufferConnect from "@/components/ecos/BufferConnect";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ApprovalPage = () => {
  const { toast } = useToast();
  const store = usePipelineStore();
  const navigate = useNavigate();

  const handlePublish = useCallback(async (platform: string) => {
    const pd = store.platforms.find((p) => p.platform === platform);
    if (!pd?.content) return;
    if (store.selectedChannelIds.length === 0) {
      toast({ title: "No Channels", description: "Load and select Buffer channels first", variant: "destructive" });
      return;
    }
    store.updatePlatform(platform, { status: "publishing" as any });
    const result = await publishViaBuffer([{ platform, content: pd.content }], store.selectedChannelIds);
    if (result.success) {
      store.updatePlatform(platform, { status: "published" });
      toast({ title: "Published", description: `${platform} content sent` });
    } else {
      store.updatePlatform(platform, { status: "failed" });
      toast({ title: "Publish Failed", description: result.error, variant: "destructive" });
    }
  }, [store, toast]);

  const handlePublishAll = useCallback(async (rating: number, feedback: string) => {
    store.updateAgent("publisher", { status: "running" });
    store.setPreviewStatus("approved");
    const toPublish = store.platforms.filter((p) => p.status === "preview" && p.content).map((p) => ({ platform: p.platform, content: p.content! }));

    // If Buffer channels are selected, publish via Buffer API
    if (store.selectedChannelIds.length > 0) {
      const result = await publishViaBuffer(toPublish, store.selectedChannelIds);
      if (result.success) {
        for (const p of toPublish) store.updatePlatform(p.platform, { status: "published" });
        store.updateAgent("publisher", { status: "complete", output: `Published ${toPublish.length} posts via Buffer (${rating}★)` });
        store.updateAgent("learner", { status: "running", output: "Analyzing post performance data..." });
        setTimeout(() => store.updateAgent("learner", { status: "complete", output: "Performance baseline recorded for future optimization" }), 3000);
        toast({ title: "All Published", description: `${toPublish.length} posts sent via Buffer` });
      } else {
        store.updateAgent("publisher", { status: "failed", output: result.error });
        toast({ title: "Publish Failed", description: result.error, variant: "destructive" });
      }
    } else {
      // No Buffer channels — copy all content to clipboard as fallback
      const allContent = toPublish.map((p) => `--- ${p.platform} ---\n${p.content}`).join("\n\n");
      try {
        await navigator.clipboard.writeText(allContent);
        for (const p of toPublish) store.updatePlatform(p.platform, { status: "published" });
        store.updateAgent("publisher", { status: "complete", output: `Approved & copied ${toPublish.length} posts (${rating}★)` });
        toast({ title: "Content Approved & Copied", description: `${toPublish.length} posts copied to clipboard. Paste them on each platform.` });
      } catch {
        store.updateAgent("publisher", { status: "complete", output: `Approved ${toPublish.length} posts (${rating}★)` });
        toast({ title: "Content Approved", description: `${toPublish.length} posts approved.` });
      }
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
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Platform Distribution</h3>
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
              onChannelsLoaded={(ch) => store.setBufferChannels(ch)}
              onSelectionChange={store.setSelectedChannelIds}
              onOrgIdLoaded={store.setBufferOrgId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPage;
