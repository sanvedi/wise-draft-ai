import { motion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";

interface PipelineConnectorProps {
  active: boolean;
  isCycle?: boolean;
  label?: string;
}

const PipelineConnector = ({ active, isCycle, label }: PipelineConnectorProps) => (
  <div className="flex flex-col items-center justify-center py-1">
    {label && (
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</span>
    )}
    <motion.div
      animate={{ opacity: active ? 1 : 0.3 }}
      className="flex items-center gap-1"
    >
      {isCycle ? (
        <RotateCcw className={`w-3.5 h-3.5 ${active ? "text-agent-reviewer animate-spin" : "text-muted-foreground"}`} style={{ animationDuration: "3s" }} />
      ) : (
        <ArrowRight className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      )}
    </motion.div>
  </div>
);

export default PipelineConnector;
