import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, RotateCcw } from "lucide-react";

interface PipelineConnectorProps {
  active: boolean;
  isCycle?: boolean;
  label?: string;
  vertical?: boolean;
}

const PipelineConnector = ({ active, isCycle, label, vertical }: PipelineConnectorProps) => {
  const ArrowIcon = vertical ? ArrowDown : ArrowRight;

  return (
    <div className={`flex ${vertical ? "flex-row" : "flex-col"} items-center justify-center ${vertical ? "py-1 px-2" : "py-1"}`}>
      {label && (
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-1.5">{label}</span>
      )}
      <motion.div animate={{ opacity: active ? 1 : 0.3 }} className="flex items-center gap-1">
        {isCycle ? (
          <RotateCcw className={`w-3.5 h-3.5 ${active ? "text-agent-reviewer animate-spin" : "text-muted-foreground"}`} style={{ animationDuration: "3s" }} />
        ) : (
          <ArrowIcon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
        )}
      </motion.div>
    </div>
  );
};

export default PipelineConnector;
