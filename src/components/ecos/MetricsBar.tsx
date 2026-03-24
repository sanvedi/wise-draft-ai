import { motion } from "framer-motion";
import { Zap, TrendingUp, RefreshCw, Clock } from "lucide-react";

interface MetricsBarProps {
  tokenEfficiency: number;
  alignmentDrift: number;
  cycleReduction: number;
  processingTime: number | null;
}

const MetricsBar = ({ tokenEfficiency, alignmentDrift, cycleReduction, processingTime }: MetricsBarProps) => {
  const metrics = [
    { icon: Zap, label: "Token Efficiency", value: `${tokenEfficiency}%`, color: "text-primary" },
    { icon: TrendingUp, label: "Alignment Score", value: `${alignmentDrift}%`, color: "text-agent-reviewer" },
    { icon: RefreshCw, label: "Cycle Reduction", value: `${cycleReduction}%`, color: "text-agent-customizer" },
    { icon: Clock, label: "Process Time", value: processingTime ? `${processingTime}s` : "—", color: "text-agent-drafter" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-4 gap-3"
    >
      {metrics.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          <Icon className={`w-4 h-4 ${color}`} />
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-semibold text-foreground font-mono">{value}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default MetricsBar;
