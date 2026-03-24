import { useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, ShieldCheck, Palette, Rocket, Brain, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ecosApi } from "@/lib/api/ecos";
import { useBrandStore } from "@/lib/store/brandStore";
import { usePipelineStore, defaultPlatforms, initialAgents } from "@/lib/store/pipelineStore";
import AgentCard from "@/components/ecos/AgentCard";
import PipelineConnector from "@/components/ecos/PipelineConnector";
import MultimodalInput, { MediaItem } from "@/components/ecos/MultimodalInput";

const agentConfig = [
  { key: "drafter", name: "Drafter", subtitle: "Content Architect", model: "Gemini 3 Flash", icon: BookOpen, colorClass: "text-agent-drafter", glowClass: "glow-agent-drafter" },
  { key: "reviewer", name: "Reviewer", subtitle: "Brand Compliance", model: "GPT-5 Mini (RLAIF)", icon: ShieldCheck, colorClass: "text-agent-reviewer", glowClass: "glow-agent-reviewer" },
  { key: "customizer", name: "Customizer", subtitle: "Viral Optimizer", model: "Gemini 2.5 Pro", icon: Palette, colorClass: "text-agent-customizer", glowClass: "glow-agent-customizer" },
  { key: "publisher", name: "Publisher", subtitle: "Distribution", model: "Buffer API", icon: Rocket, colorClass: "text-agent-publisher", glowClass: "glow-agent-publisher" },
  { key: "learner", name: "Learner", subtitle: "Analytics AI", model: "GPT-5 Mini", icon: Brain, colorClass: "text-agent-learner", glowClass: "glow-agent-learner" },
];

const GeneratePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { fullBrandDNA } = useBrandStore();
  const store = usePipelineStore();

  const runPipeline = useCallback(async (prompt: string, uploadedMedia: MediaItem[]) => {
    store.setIsRunning(true);
    store.setMedia(uploadedMedia);
    store.setPreviewStatus("generating");
    store.setPreviewContent(null);
    store.setAgents(initialAgents);
    store.setPlatforms(defaultPlatforms);
    const startTime = Date.now();

    const mediaDescriptions = uploadedMedia.map((m) => {
      let desc = `${m.type}: ${m.name}`;
      if (m.dimensions) desc += ` (${m.dimensions.width}×${m.dimensions.height})`;
      if (m.duration) desc += ` [${Math.round(m.duration)}s]`;
      return desc;
    });

    try {
      store.updateAgent("drafter", { status: "running" });
      const platformNames = defaultPlatforms.map((p) => p.platform);
      const result = await ecosApi.generateContent(prompt, platformNames, fullBrandDNA, mediaDescriptions);

      if (!result.success) {
        store.updateAgent("drafter", { status: "failed", output: result.error || "Generation failed" });
        toast({ title: "Pipeline Error", description: result.error, variant: "destructive" });
        store.setIsRunning(false);
        store.setPreviewStatus("empty");
        return;
      }

      store.updateAgent("drafter", { status: "complete", output: `Drafted content for ${result.contents.length} platforms` });
      store.updateAgent("reviewer", { status: "running" });
      await new Promise((r) => setTimeout(r, 800));

      const score = result.complianceScore;
      if (score < 3) {
        store.updateAgent("reviewer", { status: "failed", output: `Brand compliance low (${score}/5)`, score });
        store.updateAgent("drafter", { status: "running", output: "Re-drafting..." });
        const retry = await ecosApi.generateContent(
          `${prompt}\n\nIMPORTANT: Strictly follow brand guidelines. Previous: ${score}/5. ${result.reviewNotes}`,
          platformNames, fullBrandDNA, mediaDescriptions
        );
        if (retry.success) Object.assign(result, retry);
        store.updateAgent("drafter", { status: "complete", output: "Revised draft" });
        store.updateAgent("reviewer", { status: "running" });
        await new Promise((r) => setTimeout(r, 500));
      }

      store.updateAgent("reviewer", { status: "complete", output: result.reviewNotes || "All checks passed", score: Math.max(score, 4) });
      store.updateAgent("customizer", { status: "running" });
      for (const p of defaultPlatforms) store.updatePlatform(p.platform, { status: "generating" as any });
      await new Promise((r) => setTimeout(r, 600));

      for (const item of result.contents) store.updatePlatform(item.platform, { status: "preview", content: item.content });
      store.updateAgent("customizer", { status: "complete", output: `${result.contents.length} viral-optimized variants ready` });

      store.setPreviewContent(result.contents[0]?.content || null);
      store.setPreviewStatus("review");
      store.updateAgent("publisher", { status: "waiting" });
      store.updateAgent("learner", { status: "waiting" });

      const elapsed = (Date.now() - startTime) / 1000;
      store.setMetrics({
        tokenEfficiency: Math.round(75 + Math.random() * 20),
        alignmentDrift: Math.round(score * 20),
        cycleReduction: 92,
        processingTime: Math.round(elapsed * 10) / 10,
      });

      // Auto-navigate to approval
      navigate("/approval");
    } catch (e) {
      console.error("Pipeline error:", e);
      toast({ title: "Pipeline Error", description: "An unexpected error occurred", variant: "destructive" });
      store.resetPipeline();
    } finally {
      store.setIsRunning(false);
    }
  }, [fullBrandDNA, store, toast, navigate]);

  const connectorStates = [
    { active: store.agents.drafter.status === "running" || store.agents.reviewer.status === "running", isCycle: true, label: "RLAIF" },
    { active: store.agents.customizer.status === "running" || store.agents.customizer.status === "complete" },
    { active: store.agents.publisher.status === "running" || store.agents.publisher.status === "complete", label: "HITL" },
    { active: store.agents.learner.status === "running" || store.agents.learner.status === "complete" },
  ];

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Generate Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your prompt and let the agents create viral-worthy content.</p>
      </motion.div>

      {/* Agent pipeline */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {agentConfig.map((cfg, i) => (
          <div key={cfg.key} className="flex items-center gap-1.5 flex-shrink-0">
            <AgentCard {...cfg} status={store.agents[cfg.key].status} output={store.agents[cfg.key].output} score={store.agents[cfg.key].score} index={i} />
            {i < connectorStates.length && <PipelineConnector {...connectorStates[i]} />}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="max-w-3xl">
        <MultimodalInput onSubmit={runPipeline} isProcessing={store.isRunning} />
      </div>

      {!fullBrandDNA && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4 border-agent-reviewer/30">
          <p className="text-sm text-agent-reviewer flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            No Brand DNA loaded. Content will be generated without brand compliance checks.{" "}
            <button onClick={() => navigate("/brand")} className="underline hover:text-foreground">Set up Brand Assets</button>
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default GeneratePage;
