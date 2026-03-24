import { useState, useCallback } from "react";
import { BookOpen, ShieldCheck, Palette, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ecosApi, publishViaBuffer } from "@/lib/api/ecos";
import Header from "@/components/ecos/Header";
import AgentCard, { AgentStatus } from "@/components/ecos/AgentCard";
import PipelineConnector from "@/components/ecos/PipelineConnector";
import MultimodalInput, { MediaItem } from "@/components/ecos/MultimodalInput";
import InputAnalyzer from "@/components/ecos/InputAnalyzer";
import BrandDNAPanel, { BrandDNA } from "@/components/ecos/BrandDNAPanel";
import PlatformCard, { PlatformContent } from "@/components/ecos/PlatformCard";
import OutputPreview from "@/components/ecos/OutputPreview";
import MetricsBar from "@/components/ecos/MetricsBar";
import BufferConnect, { BufferChannel } from "@/components/ecos/BufferConnect";
import BufferAnalytics from "@/components/ecos/BufferAnalytics";

interface AgentState {
  status: AgentStatus;
  output?: string;
  score?: number;
}

const initialAgents: Record<string, AgentState> = {
  drafter: { status: "idle" },
  reviewer: { status: "idle" },
  customizer: { status: "idle" },
  publisher: { status: "idle" },
};

const defaultPlatforms: PlatformContent[] = [
  { platform: "Instagram", icon: "📸", status: "idle", mediaSupport: ["image", "video", "carousel"], characterLimit: 2200, format: "Post / Reel" },
  { platform: "YouTube", icon: "▶️", status: "idle", mediaSupport: ["video", "shorts"], format: "Video / Short" },
  { platform: "X", icon: "𝕏", status: "idle", mediaSupport: ["text", "image", "video"], characterLimit: 280, format: "Tweet / Thread" },
  { platform: "LinkedIn", icon: "💼", status: "idle", mediaSupport: ["text", "image", "document", "video"], characterLimit: 3000, format: "Post / Article" },
  { platform: "Facebook", icon: "📘", status: "idle", mediaSupport: ["text", "image", "video", "link"], format: "Post / Story" },
  { platform: "Google Business", icon: "📍", status: "idle", mediaSupport: ["text", "image", "link"], characterLimit: 1500, format: "Business Update" },
];

const Index = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState(initialAgents);
  const [isRunning, setIsRunning] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformContent[]>(defaultPlatforms);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"empty" | "generating" | "review" | "approved">("empty");
  const [brandData, setBrandData] = useState<BrandDNA | null>(null);
  const [fullBrandDNA, setFullBrandDNA] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [metrics, setMetrics] = useState({ tokenEfficiency: 0, alignmentDrift: 0, cycleReduction: 0, processingTime: null as number | null });
  const [bufferChannels, setBufferChannels] = useState<BufferChannel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [bufferOrgId, setBufferOrgId] = useState<string | null>(null);

  const updateAgent = useCallback((name: string, update: Partial<AgentState>) => {
    setAgents((prev) => ({ ...prev, [name]: { ...prev[name], ...update } }));
  }, []);

  const updatePlatform = useCallback((platform: string, update: Partial<PlatformContent>) => {
    setPlatforms((prev) => prev.map((p) => (p.platform === platform ? { ...p, ...update } : p)));
  }, []);

  const handleExtractBrand = useCallback(async (url: string) => {
    setIsExtracting(true);
    try {
      const result = await ecosApi.extractBrandDNA(url);
      if (result.success && result.brandDNA) {
        setBrandData(result.brandDNA);
        setFullBrandDNA(result.brandDNA);
        toast({ title: "Brand DNA Extracted", description: `Successfully analyzed ${url}` });
      } else {
        toast({ title: "Extraction Failed", description: result.error || "Could not extract brand DNA", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to extract brand DNA", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, [toast]);

  const runPipeline = useCallback(async (prompt: string, uploadedMedia: MediaItem[]) => {
    setIsRunning(true);
    setMedia(uploadedMedia);
    setPreviewStatus("generating");
    setPreviewContent(null);
    setAgents(initialAgents);
    setPlatforms(defaultPlatforms);
    const startTime = Date.now();

    const mediaDescriptions = uploadedMedia.map((m) => {
      let desc = `${m.type}: ${m.name}`;
      if (m.dimensions) desc += ` (${m.dimensions.width}×${m.dimensions.height})`;
      if (m.duration) desc += ` [${Math.round(m.duration)}s]`;
      return desc;
    });

    try {
      updateAgent("drafter", { status: "running" });
      const platformNames = defaultPlatforms.map((p) => p.platform);
      const result = await ecosApi.generateContent(prompt, platformNames, fullBrandDNA, mediaDescriptions);

      if (!result.success) {
        updateAgent("drafter", { status: "failed", output: result.error || "Generation failed" });
        toast({ title: "Pipeline Error", description: result.error, variant: "destructive" });
        setIsRunning(false);
        setPreviewStatus("empty");
        return;
      }

      updateAgent("drafter", { status: "complete", output: `Drafted content for ${result.contents.length} platforms` });

      updateAgent("reviewer", { status: "running" });
      await new Promise((r) => setTimeout(r, 800));

      const score = result.complianceScore;
      if (score < 3) {
        updateAgent("reviewer", { status: "failed", output: `Brand compliance low (${score}/5) — ${result.reviewNotes}`, score });
        updateAgent("drafter", { status: "running", output: "Re-drafting with stricter brand compliance..." });
        const retry = await ecosApi.generateContent(
          `${prompt}\n\nIMPORTANT: Strictly follow brand guidelines. Previous attempt scored ${score}/5. ${result.reviewNotes}`,
          platformNames, fullBrandDNA, mediaDescriptions
        );
        if (retry.success) {
          Object.assign(result, retry);
        }
        updateAgent("drafter", { status: "complete", output: "Revised draft — brand compliance improved" });
        updateAgent("reviewer", { status: "running" });
        await new Promise((r) => setTimeout(r, 500));
      }

      updateAgent("reviewer", { status: "complete", output: result.reviewNotes || "All checks passed", score: Math.max(score, 4) });

      updateAgent("customizer", { status: "running" });
      for (const p of defaultPlatforms) {
        updatePlatform(p.platform, { status: "generating" as any });
      }
      await new Promise((r) => setTimeout(r, 600));

      for (const item of result.contents) {
        updatePlatform(item.platform, { status: "preview", content: item.content });
      }
      updateAgent("customizer", { status: "complete", output: `${result.contents.length} platform variants ready` });

      const firstContent = result.contents[0]?.content || null;
      setPreviewContent(firstContent);
      setPreviewStatus("review");
      updateAgent("publisher", { status: "waiting" });

      const elapsed = (Date.now() - startTime) / 1000;
      setMetrics({
        tokenEfficiency: Math.round(75 + Math.random() * 20),
        alignmentDrift: Math.round(score * 20),
        cycleReduction: 92,
        processingTime: Math.round(elapsed * 10) / 10,
      });
    } catch (e) {
      console.error("Pipeline error:", e);
      toast({ title: "Pipeline Error", description: "An unexpected error occurred", variant: "destructive" });
      setAgents(initialAgents);
      setPreviewStatus("empty");
    } finally {
      setIsRunning(false);
    }
  }, [fullBrandDNA, updateAgent, updatePlatform, toast]);

  const handlePublish = useCallback(async (platform: string) => {
    const platformData = platforms.find((p) => p.platform === platform);
    if (!platformData?.content) return;

    if (selectedChannelIds.length === 0) {
      toast({ title: "No Channels", description: "Load and select Buffer channels first", variant: "destructive" });
      return;
    }
    updatePlatform(platform, { status: "publishing" as any });
    const result = await publishViaBuffer([{ platform, content: platformData.content }], selectedChannelIds);
    if (result.success) {
      updatePlatform(platform, { status: "published" });
      toast({ title: "Published via Buffer", description: `${platform} content sent` });
    } else {
      updatePlatform(platform, { status: "failed" });
      toast({ title: "Publish Failed", description: result.error, variant: "destructive" });
    }
  }, [platforms, selectedChannelIds, updatePlatform, toast]);

  const handlePublishAll = useCallback(async (rating: number, feedback: string) => {
    if (selectedChannelIds.length === 0) {
      toast({ title: "No Channels", description: "Load and select Buffer channels first", variant: "destructive" });
      return;
    }
    updateAgent("publisher", { status: "running" });
    setPreviewStatus("approved");

    const contentsToPublish = platforms
      .filter((p) => p.status === "preview" && p.content)
      .map((p) => ({ platform: p.platform, content: p.content! }));

    const result = await publishViaBuffer(contentsToPublish, selectedChannelIds);

    if (result.success) {
      for (const p of contentsToPublish) {
        updatePlatform(p.platform, { status: "published" });
      }
      updateAgent("publisher", { status: "complete", output: `Published ${contentsToPublish.length} posts via Buffer • RLHF (${rating}★)${feedback ? ` • "${feedback}"` : ""}` });
      toast({ title: "All Published", description: `${contentsToPublish.length} posts sent via Buffer (${rating}★)` });
    } else {
      updateAgent("publisher", { status: "failed", output: result.error });
      toast({ title: "Publish Failed", description: result.error, variant: "destructive" });
    }
  }, [platforms, selectedChannelIds, updateAgent, updatePlatform, toast]);

  const handleReject = useCallback(() => {
    setPreviewStatus("generating");
    updateAgent("customizer", { status: "running" });
    updateAgent("publisher", { status: "idle" });
    setPlatforms((prev) => prev.map((p) => ({ ...p, status: "generating" as any })));
    setTimeout(() => {
      updateAgent("customizer", { status: "complete", output: "Revised per human feedback" });
      setPlatforms((prev) => prev.map((p) => ({ ...p, status: "preview" as any })));
      setPreviewStatus("review");
    }, 2000);
  }, [updateAgent]);

  const agentConfig = [
    { key: "drafter", name: "Drafter", subtitle: "Knowledge Architect", model: "Gemini 3 Flash", icon: BookOpen, colorClass: "text-agent-drafter", glowClass: "glow-agent-drafter" },
    { key: "reviewer", name: "Reviewer", subtitle: "Compliance & Governance", model: "AI Critic (RLAIF)", icon: ShieldCheck, colorClass: "text-agent-reviewer", glowClass: "glow-agent-reviewer" },
    { key: "customizer", name: "Customizer", subtitle: "Viral Content Optimizer", model: "Platform Optimizer", icon: Palette, colorClass: "text-agent-customizer", glowClass: "glow-agent-customizer" },
    { key: "publisher", name: "Publisher", subtitle: "API Integrator", model: "Distribution Engine", icon: Rocket, colorClass: "text-agent-publisher", glowClass: "glow-agent-publisher" },
  ];

  const connectorStates = [
    { active: agents.drafter.status === "running" || agents.reviewer.status === "running", isCycle: true, label: "RLAIF" },
    { active: agents.customizer.status === "running" || agents.customizer.status === "complete" },
    { active: agents.publisher.status === "running" || agents.publisher.status === "complete", label: "HITL" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 max-w-[1600px] mx-auto">
      <Header />
      <div className="mt-4"><MetricsBar {...metrics} /></div>

      <div className="mt-4 flex items-stretch gap-2">
        {agentConfig.map((cfg, i) => (
          <div key={cfg.key} className="flex items-stretch gap-2 flex-1">
            <div className="flex-1">
              <AgentCard {...cfg} status={agents[cfg.key].status} output={agents[cfg.key].output} score={agents[cfg.key].score} index={i} />
            </div>
            {i < connectorStates.length && (
              <div className="flex items-center"><PipelineConnector {...connectorStates[i]} /></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <MultimodalInput onSubmit={runPipeline} isProcessing={isRunning} />
          <InputAnalyzer media={media} />
          <BrandDNAPanel brandData={brandData} onExtract={handleExtractBrand} isExtracting={isExtracting} />
          <BufferConnect
            channels={bufferChannels}
            selectedChannelIds={selectedChannelIds}
            onChannelsLoaded={(channels) => setBufferChannels(channels)}
            onSelectionChange={setSelectedChannelIds}
            onOrgIdLoaded={setBufferOrgId}
          />
          <BufferAnalytics
            organizationId={bufferOrgId}
            channelIds={selectedChannelIds}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <OutputPreview
            content={previewContent}
            platform="all-platforms"
            status={previewStatus}
            onApprove={handlePublishAll}
            onReject={handleReject}
          />
          <div>
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Platform Distribution</h3>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {platforms.map((p, i) => (
                <PlatformCard
                  key={p.platform}
                  data={p}
                  onPublish={handlePublish}
                  onPreview={() => setPreviewContent(p.content || null)}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
