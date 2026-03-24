import { useState, useCallback } from "react";
import { BookOpen, ShieldCheck, Palette, Rocket } from "lucide-react";
import Header from "@/components/ecos/Header";
import AgentCard, { AgentStatus } from "@/components/ecos/AgentCard";
import PipelineConnector from "@/components/ecos/PipelineConnector";
import MultimodalInput, { MediaItem } from "@/components/ecos/MultimodalInput";
import InputAnalyzer from "@/components/ecos/InputAnalyzer";
import BrandDNAPanel, { BrandDNA } from "@/components/ecos/BrandDNAPanel";
import PlatformCard, { PlatformContent } from "@/components/ecos/PlatformCard";
import OutputPreview from "@/components/ecos/OutputPreview";
import MetricsBar from "@/components/ecos/MetricsBar";

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
  { platform: "WordPress", icon: "📝", status: "idle", mediaSupport: ["text", "image", "html"], format: "Blog Post" },
];

const Index = () => {
  const [agents, setAgents] = useState(initialAgents);
  const [isRunning, setIsRunning] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformContent[]>(defaultPlatforms);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"empty" | "generating" | "review" | "approved">("empty");
  const [brandData, setBrandData] = useState<BrandDNA | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [metrics, setMetrics] = useState({ tokenEfficiency: 0, alignmentDrift: 0, cycleReduction: 0, processingTime: null as number | null });

  const updateAgent = useCallback((name: string, update: Partial<AgentState>) => {
    setAgents((prev) => ({ ...prev, [name]: { ...prev[name], ...update } }));
  }, []);

  const updatePlatform = useCallback((platform: string, update: Partial<PlatformContent>) => {
    setPlatforms((prev) => prev.map((p) => (p.platform === platform ? { ...p, ...update } : p)));
  }, []);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleExtractBrand = useCallback(async (url: string) => {
    setIsExtracting(true);
    await delay(2500);
    // Simulated Pomelli extraction — will be replaced with real API
    setBrandData({
      colors: [
        { name: "Primary", hex: "#2563EB" },
        { name: "Secondary", hex: "#10B981" },
        { name: "Accent", hex: "#F59E0B" },
        { name: "Dark", hex: "#1E293B" },
        { name: "Light", hex: "#F8FAFC" },
      ],
      fonts: ["Inter", "Source Serif Pro"],
      tone: "Professional yet approachable. Data-driven with a human touch. Avoids jargon, prefers clear language.",
      guidelines: [
        "Always lead with customer benefit, not features",
        "Use active voice and present tense",
        "Include data points to support claims",
        "Maintain inclusive and accessible language",
      ],
    });
    setIsExtracting(false);
  }, []);

  const runPipeline = useCallback(async (prompt: string, uploadedMedia: MediaItem[]) => {
    setIsRunning(true);
    setMedia(uploadedMedia);
    setPreviewStatus("generating");
    setPreviewContent(null);
    setAgents(initialAgents);
    setPlatforms(defaultPlatforms);
    const startTime = Date.now();

    const brandContext = brandData
      ? `\n[Brand: ${brandData.tone} | Colors: ${brandData.colors.map((c) => c.hex).join(", ")} | Fonts: ${brandData.fonts.join(", ")}]`
      : "";
    const mediaContext = uploadedMedia.length
      ? `\n[Media: ${uploadedMedia.map((m) => `${m.type}(${m.name})`).join(", ")}]`
      : "";

    // Stage 1: Drafter
    updateAgent("drafter", { status: "running" });
    await delay(2200);
    const draftOutput = `${prompt.slice(0, 300)}${prompt.length > 300 ? "..." : ""}${brandContext}${mediaContext}\n\n[RAG synthesis: 4 sources cross-referenced | Brand alignment: Active]`;
    updateAgent("drafter", { status: "complete", output: "Draft synthesized with brand DNA context" });

    // Stage 2: Reviewer (RLAIF)
    updateAgent("reviewer", { status: "running" });
    await delay(1800);
    const score = Math.random() > 0.25 ? 4 : 2;
    if (score < 3) {
      updateAgent("reviewer", { status: "failed", output: "Brand tone mismatch — regenerating", score });
      updateAgent("drafter", { status: "running" });
      await delay(1500);
      updateAgent("drafter", { status: "complete", output: "Revised with brand compliance" });
      updateAgent("reviewer", { status: "running" });
      await delay(1200);
    }
    updateAgent("reviewer", { status: "complete", output: "Brand & compliance checks passed", score: Math.max(score, 4) });

    // Stage 3: Customizer — generate per-platform content
    updateAgent("customizer", { status: "running" });
    const platformContents: Record<string, string> = {
      Instagram: `✨ ${prompt.slice(0, 100)}...\n\n${brandData ? `🎨 On-brand visuals aligned with ${brandData.colors[0].hex}` : "📸 Visual-first format"}\n\n#ContentMarketing #BrandStrategy`,
      YouTube: `🎬 Title: ${prompt.slice(0, 60)}\n\nDescription:\n${prompt.slice(0, 200)}...\n\nTimestamps:\n0:00 - Intro\n0:30 - Key Points\n2:00 - Summary\n\nTags: content, strategy, brand`,
      X: `${prompt.slice(0, 240)}${prompt.length > 240 ? "..." : ""}\n\n🧵 1/3`,
      LinkedIn: `📊 ${prompt.slice(0, 250)}...\n\n${brandData ? `Aligned with our brand voice: ${brandData.tone.slice(0, 80)}` : ""}\n\nWhat are your thoughts? Drop a comment below 👇`,
      Facebook: `${prompt.slice(0, 350)}${prompt.length > 350 ? "..." : ""}\n\n${uploadedMedia.length > 0 ? `📎 ${uploadedMedia.length} media attached` : ""}\n\n👍 Like | 💬 Comment | ↗️ Share`,
      WordPress: `# ${prompt.slice(0, 60)}\n\n## Introduction\n\n${prompt}\n\n${brandData ? `---\n*Published following ${brandData.fonts[0]} editorial standards*` : ""}\n\n## Key Takeaways\n\n- Point 1\n- Point 2\n- Point 3`,
    };

    for (const p of defaultPlatforms) {
      updatePlatform(p.platform, { status: "generating" });
    }
    await delay(2000);
    for (const p of defaultPlatforms) {
      updatePlatform(p.platform, { status: "preview", content: platformContents[p.platform] });
    }
    updateAgent("customizer", { status: "complete", output: "6 platform variants generated" });

    setPreviewContent(platformContents.LinkedIn);
    setPreviewStatus("review");
    updateAgent("publisher", { status: "waiting" });

    setMetrics({
      tokenEfficiency: Math.round(78 + Math.random() * 15),
      alignmentDrift: Math.round(88 + Math.random() * 10),
      cycleReduction: 92,
      processingTime: Math.round((Date.now() - startTime) / 100) / 10,
    });
    setIsRunning(false);
  }, [brandData, updateAgent, updatePlatform]);

  const handlePublish = useCallback(async (platform: string) => {
    updatePlatform(platform, { status: "publishing" as any });
    await delay(1500);
    updatePlatform(platform, { status: "published" });
  }, [updatePlatform]);

  const handlePublishAll = useCallback(async (rating: number, feedback: string) => {
    updateAgent("publisher", { status: "running" });
    setPreviewStatus("approved");
    for (const p of platforms) {
      if (p.status === "preview") {
        updatePlatform(p.platform, { status: "publishing" as any });
        await delay(800);
        updatePlatform(p.platform, { status: "published" });
      }
    }
    updateAgent("publisher", { status: "complete", output: `Published to all platforms • RLHF data captured (${rating}★)` });
  }, [platforms, updateAgent, updatePlatform]);

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
    { key: "drafter", name: "Drafter", subtitle: "Knowledge Architect", model: "Claude 3.5 Sonnet", icon: BookOpen, colorClass: "text-agent-drafter", glowClass: "glow-agent-drafter" },
    { key: "reviewer", name: "Reviewer", subtitle: "Compliance & Governance", model: "GPT-4o (Critic)", icon: ShieldCheck, colorClass: "text-agent-reviewer", glowClass: "glow-agent-reviewer" },
    { key: "customizer", name: "Customizer", subtitle: "Multimodal Adaptation", model: "Gemini 1.5 Pro", icon: Palette, colorClass: "text-agent-customizer", glowClass: "glow-agent-customizer" },
    { key: "publisher", name: "Publisher", subtitle: "API Integrator", model: "Internal Runtime", icon: Rocket, colorClass: "text-agent-publisher", glowClass: "glow-agent-publisher" },
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

      {/* Agent Pipeline */}
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

      {/* Main content: Left (Input + Brand) | Right (Output + Platforms) */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <MultimodalInput onSubmit={runPipeline} isProcessing={isRunning} />
          <InputAnalyzer media={media} />
          <BrandDNAPanel brandData={brandData} onExtract={handleExtractBrand} isExtracting={isExtracting} />
        </div>

        {/* Right column */}
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
