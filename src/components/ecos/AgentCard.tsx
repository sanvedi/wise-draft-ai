import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export type AgentStatus = "idle" | "running" | "complete" | "failed" | "waiting";

interface AgentCardProps {
  name: string;
  subtitle: string;
  model: string;
  icon: LucideIcon;
  status: AgentStatus;
  colorClass: string;
  glowClass: string;
  output?: string;
  score?: number;
  index: number;
}

const statusConfig: Record<AgentStatus, { label: string; dotClass: string }> = {
  idle: { label: "Idle", dotClass: "bg-muted-foreground" },
  running: { label: "Processing", dotClass: "bg-agent-drafter animate-pulse-glow" },
  complete: { label: "Complete", dotClass: "bg-primary" },
  failed: { label: "Failed", dotClass: "bg-destructive" },
  waiting: { label: "Waiting", dotClass: "bg-muted-foreground animate-pulse" },
};

const AgentCard = ({ name, subtitle, model, icon: Icon, status, colorClass, glowClass, output, score, index }: AgentCardProps) => {
  const { label, dotClass } = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`rounded-lg border bg-card p-4 transition-all duration-300 ${
        status === "running" ? glowClass + " border-opacity-60" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${colorClass} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-3">
        Model: {model}
      </div>

      {score !== undefined && status === "complete" && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-muted-foreground">SCORE</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score * 20}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${score >= 4 ? "bg-primary" : score >= 3 ? "bg-agent-reviewer" : "bg-destructive"}`}
            />
          </div>
          <span className="text-xs font-mono text-foreground">{score}/5</span>
        </div>
      )}

      {output && (
        <div className="mt-2 max-h-24 overflow-y-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">{output}</p>
        </div>
      )}
    </motion.div>
  );
};

export default AgentCard;
