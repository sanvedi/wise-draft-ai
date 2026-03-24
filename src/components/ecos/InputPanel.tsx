import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Play, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InputPanelProps {
  onStart: (input: string, config: PipelineConfig) => void;
  isRunning: boolean;
}

export interface PipelineConfig {
  targetPlatform: string;
  tone: string;
  includeVisuals: boolean;
}

const InputPanel = ({ onStart, isRunning }: InputPanelProps) => {
  const [input, setInput] = useState("");
  const [config, setConfig] = useState<PipelineConfig>({
    targetPlatform: "linkedin",
    tone: "professional",
    includeVisuals: true,
  });
  const [showConfig, setShowConfig] = useState(false);

  const platforms = ["linkedin", "blog", "twitter", "email"];
  const tones = ["professional", "casual", "technical", "executive"];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Content Input</h2>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <Textarea
        placeholder="Paste your source content, technical docs, product brief, or any raw material for the agents to process..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[140px] bg-muted/30 border-border text-sm text-foreground placeholder:text-muted-foreground resize-none font-mono text-xs"
      />

      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
        <Upload className="w-3 h-3" />
        <span>Or drag & drop files (PDF, DOCX, MD)</span>
      </div>

      {showConfig && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="space-y-3 pt-2 border-t border-border"
        >
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Target Platform
            </label>
            <div className="flex gap-1.5">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setConfig({ ...config, targetPlatform: p })}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    config.targetPlatform === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Tone
            </label>
            <div className="flex gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig({ ...config, tone: t })}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    config.tone === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeVisuals}
              onChange={(e) => setConfig({ ...config, includeVisuals: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-xs text-muted-foreground">Generate visual asset suggestions</span>
          </label>
        </motion.div>
      )}

      <Button
        onClick={() => onStart(input, config)}
        disabled={!input.trim() || isRunning}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
      >
        {isRunning ? (
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Pipeline Running
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Play className="w-3 h-3" />
            Run ECOS Pipeline
          </span>
        )}
      </Button>
    </motion.div>
  );
};

export default InputPanel;
