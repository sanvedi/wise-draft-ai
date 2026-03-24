import { motion } from "framer-motion";
import { Eye, Star, Send, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface OutputPreviewProps {
  content: string | null;
  platform: string;
  status: "empty" | "generating" | "review" | "approved";
  onApprove: (rating: number, feedback: string) => void;
  onReject: () => void;
}

const OutputPreview = ({ content, platform, status, onApprove, onReject }: OutputPreviewProps) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-border bg-card p-5 space-y-4 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Content Preview</h2>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {platform}
        </span>
      </div>

      <div className="rounded-md bg-muted/30 border border-border p-4 min-h-[200px]">
        {status === "empty" && (
          <div className="flex items-center justify-center h-full min-h-[180px]">
            <p className="text-xs text-muted-foreground font-mono">Awaiting pipeline output...</p>
          </div>
        )}
        {status === "generating" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Agents are processing...</p>
          </div>
        )}
        {(status === "review" || status === "approved") && content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
              {content}
            </div>
          </motion.div>
        )}
      </div>

      {status === "review" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2 border-t border-border"
        >
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
              HITL Rating (RLHF Data)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${s <= rating ? "fill-agent-reviewer text-agent-reviewer" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Optional: Add stylistic feedback for RLHF fine-tuning..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-md p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16 font-mono"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(rating, feedback)}
              disabled={rating === 0}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-[10px] uppercase tracking-wider"
            >
              <Send className="w-3 h-3 mr-1.5" />
              Approve & Publish
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wider border-border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Revise
            </Button>
          </div>
        </motion.div>
      )}

      {status === "approved" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20"
        >
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-mono text-primary">Content approved and queued for distribution</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OutputPreview;
