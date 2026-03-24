import { motion } from "framer-motion";
import { BookOpen, ShieldCheck, Palette, Rocket, Brain, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const agents = [
  { name: "Drafter", subtitle: "Content Architect", model: "Gemini 3 Flash", icon: BookOpen, color: "agent-drafter", desc: "Creates initial content drafts optimized for each platform" },
  { name: "Reviewer", subtitle: "Brand Compliance", model: "GPT-5 Mini (RLAIF)", icon: ShieldCheck, color: "agent-reviewer", desc: "Audits content against brand DNA and guidelines" },
  { name: "Customizer", subtitle: "Viral Optimizer", model: "Gemini 2.5 Pro", icon: Palette, color: "agent-customizer", desc: "Transforms content into viral-worthy platform variants" },
  { name: "Publisher", subtitle: "Distribution", model: "Buffer API", icon: Rocket, color: "agent-publisher", desc: "Distributes approved content across all channels" },
  { name: "Learner", subtitle: "Analytics AI", model: "GPT-5 Mini", icon: Brain, color: "agent-learner", desc: "Learns from post performance to improve future content" },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-8"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex p-4 rounded-2xl bg-primary/10 glow-primary"
        >
          <Sparkles className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
          Sutra <span className="text-gradient">Pravartak</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI-powered multi-agent content engine that drafts, reviews, optimizes, and publishes
          viral-worthy content across every platform — with human oversight at every step.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate("/brand")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-sm px-6 py-5 rounded-xl glow-primary"
          >
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/generate")}
            className="border-border text-foreground hover:bg-muted font-display text-sm px-6 py-5 rounded-xl"
          >
            Skip to Generate
          </Button>
        </div>
      </motion.section>

      {/* Process Flow */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-foreground">Agent Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-2">Five specialized AI agents work in sequence to create perfect content</p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="glass rounded-xl p-5 space-y-3 relative group hover:glow-primary transition-all duration-500"
              >
                <div className="glass-highlight absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-${agent.color}/10`}>
                      <agent.icon className={`w-5 h-5 text-${agent.color}`} />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-sm font-display font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{agent.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{agent.desc}</p>
                  <div className="mt-3 text-[9px] font-mono text-primary/60 bg-primary/5 rounded-md px-2 py-1">
                    {agent.model}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HITL callout */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-8 text-center space-y-3 glow-accent"
      >
        <h3 className="text-lg font-display font-bold text-foreground">Human-in-the-Loop Approval</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Nothing publishes without your explicit approval. Rate content for RLHF training,
          provide feedback, and iterate until it's perfect.
        </p>
      </motion.section>
    </div>
  );
};

export default HomePage;
