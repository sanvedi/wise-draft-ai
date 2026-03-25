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
      className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Content Preview</h2>
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 border border-border p-4 min-h-[180px]">
        {status === "empty" && (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <p className="text-sm text-muted-foreground">Awaiting pipeline output...</p>
          </div>
        )}
        {status === "generating" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Agents are processing...</p>
          </div>
        )}
        {(status === "review" || status === "approved") && content && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </motion.div>
        )}
      </div>

      {status === "review" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-3 border-t border-border"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Rate this content
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-1 transition-colors">
                  <Star className={`w-6 h-6 ${s <= rating ? "fill-agent-reviewer text-agent-reviewer" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Optional feedback to improve future content..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onApprove(rating, feedback)}
              disabled={rating === 0}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-5"
            >
              <Send className="w-4 h-4 mr-2" />
              Approve & Publish
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              className="text-sm border-border text-muted-foreground hover:text-foreground py-5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Revise
            </Button>
          </div>
        </motion.div>
      )}

      {status === "approved" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"
        >
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-primary">Content approved and queued for distribution</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OutputPreview;
