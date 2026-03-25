import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const agents = [
  { name: "Drafter", role: "Content Architect", model: "Gemini 3 Flash", step: "01", desc: "Generates initial content drafts tailored to each platform's format and audience expectations." },
  { name: "Reviewer", role: "Brand Compliance", model: "GPT-5 Mini (Reasoning)", step: "02", desc: "Validates every draft against your brand DNA — tone, terminology, visual identity, and guidelines." },
  { name: "Customizer", role: "Viral Optimizer", model: "Gemini 3.1 Pro", step: "03", desc: "Rewrites content for maximum engagement using platform-specific hooks, hashtags, and formatting." },
  { name: "Publisher", role: "Distribution", model: "Buffer API", step: "04", desc: "Pushes approved content to your connected channels with proper scheduling and targeting." },
  { name: "Learner", role: "Analytics AI", model: "Gemini 3 Flash", step: "05", desc: "Studies post performance over time and feeds insights back to improve future content quality." },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto">
      {/* Hero — left-aligned, editorial feel */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl space-y-5 mb-20"
      >
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Multi-Agent Content Engine
        </p>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-[1.1]">
          Sutra <span className="text-gradient">Pravartak</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
          Five AI agents draft, review, optimize, and publish your content
          across every platform — with your approval at every step.
        </p>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => navigate("/brand")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-sm px-5 py-5 rounded-lg"
          >
            Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/generate")}
            className="border-border text-foreground hover:bg-muted font-display text-sm px-5 py-5 rounded-lg"
          >
            Skip to Generate
          </Button>
        </div>
      </motion.section>

      {/* Pipeline — numbered list, no icons, clean hierarchy */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <h2 className="text-xl font-display font-semibold text-foreground">How it works</h2>
          <p className="text-sm text-muted-foreground mt-1">Each agent handles a distinct stage of the content lifecycle.</p>
        </motion.div>

        <div className="space-y-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="group rounded-lg border border-border bg-card/60 hover:bg-card transition-colors px-5 py-4 flex items-start gap-5"
            >
              <span className="text-xs font-mono text-muted-foreground pt-0.5 w-5 flex-shrink-0">
                {agent.step}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-sm font-display font-semibold text-foreground">{agent.name}</h3>
                  <span className="text-xs text-muted-foreground">{agent.role}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{agent.desc}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-muted/60 rounded px-2 py-0.5 flex-shrink-0 mt-0.5">
                {agent.model}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HITL — understated, not glowing */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg border border-border bg-card/60 px-6 py-6 max-w-2xl"
      >
        <h3 className="text-sm font-display font-semibold text-foreground mb-1.5">Human-in-the-Loop</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nothing publishes without your explicit approval. Rate outputs to improve
          future generations, provide feedback, and iterate until the content is right.
        </p>
      </motion.section>
    </div>
  );
};

export default HomePage;
