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
  complete: { label: "Done", dotClass: "bg-primary" },
  failed: { label: "Failed", dotClass: "bg-destructive" },
  waiting: { label: "Waiting", dotClass: "bg-muted-foreground animate-pulse" },
};

const AgentCard = ({ name, subtitle, model, icon: Icon, status, colorClass, glowClass, output, score, index }: AgentCardProps) => {
  const { label, dotClass } = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`rounded-xl border bg-card p-3 sm:p-4 transition-all duration-300 min-w-0 ${
        status === "running" ? glowClass + " border-opacity-60" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{label}</span>
        </div>
      </div>

      <div className="text-xs font-mono text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 mb-2 truncate">
        {model}
      </div>

      {score !== undefined && status === "complete" && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground">Score</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score * 20}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${score >= 4 ? "bg-primary" : score >= 3 ? "bg-agent-reviewer" : "bg-destructive"}`}
            />
          </div>
          <span className="text-xs font-mono text-foreground font-semibold">{score}/5</span>
        </div>
      )}

      {output && (
        <div className="mt-1 max-h-16 overflow-y-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">{output}</p>
        </div>
      )}
    </motion.div>
  );
};

export default AgentCard;
