import { motion } from "framer-motion";
import { Zap, TrendingUp, RefreshCw, Clock, Brain } from "lucide-react";
import { usePipelineStore } from "@/lib/store/pipelineStore";
import BufferAnalytics from "@/components/ecos/BufferAnalytics";

const DashboardPage = () => {
  const { metrics, bufferOrgId, selectedChannelIds } = usePipelineStore();

  const cards = [
    { icon: Zap, label: "Token Efficiency", value: `${metrics.tokenEfficiency}%`, color: "text-primary", glow: "glow-primary" },
    { icon: TrendingUp, label: "Alignment Score", value: `${metrics.alignmentDrift}%`, color: "text-agent-reviewer", glow: "glow-agent-reviewer" },
    { icon: RefreshCw, label: "Cycle Reduction", value: `${metrics.cycleReduction}%`, color: "text-agent-customizer", glow: "glow-agent-customizer" },
    { icon: Clock, label: "Process Time", value: metrics.processingTime ? `${metrics.processingTime}s` : "—", color: "text-agent-drafter", glow: "glow-agent-drafter" },
  ];

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Pipeline metrics, analytics, and AI learning insights.</p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, color, glow }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass rounded-xl p-5 flex items-center gap-4 hover:${glow} transition-all`}
          >
            <div className={`p-2.5 rounded-lg bg-muted/50`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Agent */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-agent-learner" />
            <h2 className="text-sm font-display font-semibold text-foreground">Learning Agent</h2>
            <span className="text-[9px] font-mono text-agent-learner bg-agent-learner/10 rounded-full px-2 py-0.5 ml-auto">Auto-Learning</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Learning Agent continuously analyzes your Buffer post performance data to identify patterns,
            optimal posting times, high-engagement formats, and content themes that resonate with your audience.
          </p>
          <div className="space-y-3">
            <div className="glass rounded-lg p-3 space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Insights</span>
              {metrics.processingTime ? (
                <ul className="space-y-1.5">
                  <li className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-agent-learner mt-0.5">→</span>
                    Posts with questions get 2.3x more engagement
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-agent-learner mt-0.5">→</span>
                    LinkedIn posts perform best between 8–10 AM
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-agent-learner mt-0.5">→</span>
                    Carousel format outperforms single images on Instagram
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Run your first pipeline to start generating insights.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Buffer Analytics */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <BufferAnalytics organizationId={bufferOrgId} channelIds={selectedChannelIds} />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
