import { useState, useCallback } from "react";
import { BookOpen, ShieldCheck, Palette, Rocket } from "lucide-react";
import Header from "@/components/ecos/Header";
import AgentCard, { AgentStatus } from "@/components/ecos/AgentCard";
import PipelineConnector from "@/components/ecos/PipelineConnector";
import InputPanel, { PipelineConfig } from "@/components/ecos/InputPanel";
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

const Index = () => {
  const [agents, setAgents] = useState(initialAgents);
  const [isRunning, setIsRunning] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"empty" | "generating" | "review" | "approved">("empty");
  const [platform, setPlatform] = useState("linkedin");
  const [metrics, setMetrics] = useState({ tokenEfficiency: 0, alignmentDrift: 0, cycleReduction: 0, processingTime: null as number | null });

  const updateAgent = useCallback((name: string, update: Partial<AgentState>) => {
    setAgents((prev) => ({ ...prev, [name]: { ...prev[name], ...update } }));
  }, []);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runPipeline = useCallback(async (input: string, config: PipelineConfig) => {
    setIsRunning(true);
    setPreviewStatus("generating");
    setPreviewContent(null);
    setAgents(initialAgents);
    setPlatform(config.targetPlatform);
    const startTime = Date.now();

    // Stage 1: Drafter
    updateAgent("drafter", { status: "running" });
    await delay(2000);
    const draftOutput = `Based on the provided source material, here is a structured ${config.tone} draft optimized for ${config.targetPlatform}:\n\n${input.slice(0, 200)}${input.length > 200 ? "..." : ""}\n\n[RAG-enhanced synthesis complete — 3 internal sources referenced, 2 policy docs cross-checked]`;
    updateAgent("drafter", { status: "complete", output: "Draft synthesized from RAG pipeline" });

    // Stage 2: Reviewer (RLAIF loop)
    updateAgent("reviewer", { status: "running" });
    await delay(1800);
    const reviewScore = Math.random() > 0.3 ? 4 : 2;

    if (reviewScore < 3) {
      // Simulate RLAIF rejection cycle
      updateAgent("reviewer", { status: "failed", output: "Policy violation detected — regenerating", score: reviewScore });
      updateAgent("drafter", { status: "running", output: "Re-drafting based on RLAIF feedback..." });
      await delay(1500);
      updateAgent("drafter", { status: "complete", output: "Revised draft — compliance issues resolved" });
      updateAgent("reviewer", { status: "running" });
      await delay(1200);
      updateAgent("reviewer", { status: "complete", output: "Compliance check passed on revision", score: 4 });
    } else {
      updateAgent("reviewer", { status: "complete", output: "All governance checks passed", score: reviewScore });
    }

    // Stage 3: Customizer
    updateAgent("customizer", { status: "running" });
    await delay(1600);
    const customizedContent = `📋 ${config.targetPlatform.toUpperCase()} — ${config.tone.charAt(0).toUpperCase() + config.tone.slice(1)} Format\n\n${draftOutput}\n\n${config.includeVisuals ? "🎨 Visual Assets: 2 infographic suggestions generated\n📊 Data visualization: Product comparison chart recommended" : ""}\n\n✅ Platform-optimized • Brand-compliant • ${config.tone} tone applied`;
    updateAgent("customizer", { status: "complete", output: `Adapted for ${config.targetPlatform} with ${config.tone} tone` });

    setPreviewContent(customizedContent);
    setPreviewStatus("review");

    // Stage 4: Publisher waits
    updateAgent("publisher", { status: "waiting" });

    const elapsed = ((Date.now() - startTime) / 1000);
    setMetrics({
      tokenEfficiency: Math.round(78 + Math.random() * 15),
      alignmentDrift: Math.round(88 + Math.random() * 10),
      cycleReduction: 92,
      processingTime: Math.round(elapsed * 10) / 10,
    });
    setIsRunning(false);
  }, [updateAgent]);

  const handleApprove = useCallback(async (rating: number, feedback: string) => {
    updateAgent("publisher", { status: "running" });
    setPreviewStatus("approved");
    await delay(1200);
    updateAgent("publisher", { status: "complete", output: `Published to ${platform} API • RLHF data captured (${rating}★)${feedback ? ` • Feedback: "${feedback}"` : ""}` });
  }, [platform, updateAgent]);

  const handleReject = useCallback(() => {
    setPreviewStatus("generating");
    updateAgent("customizer", { status: "running" });
    updateAgent("publisher", { status: "idle" });
    setTimeout(() => {
      updateAgent("customizer", { status: "complete", output: "Revised based on human feedback" });
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
    { active: agents.publisher.status === "running" || agents.publisher.status === "complete", label: "HITL Gate" },
  ];

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      <Header />

      <div className="mt-6">
        <MetricsBar {...metrics} />
      </div>

      {/* Agent Pipeline */}
      <div className="mt-6 flex items-stretch gap-2">
        {agentConfig.map((cfg, i) => (
          <div key={cfg.key} className="flex items-stretch gap-2 flex-1">
            <div className="flex-1">
              <AgentCard
                {...cfg}
                status={agents[cfg.key].status}
                output={agents[cfg.key].output}
                score={agents[cfg.key].score}
                index={i}
              />
            </div>
            {i < connectorStates.length && (
              <div className="flex items-center">
                <PipelineConnector {...connectorStates[i]} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input + Output */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <InputPanel onStart={runPipeline} isRunning={isRunning} />
        <OutputPreview
          content={previewContent}
          platform={platform}
          status={previewStatus}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};

export default Index;
