import { motion } from "framer-motion";
import { Send, Eye, CheckCircle2, Loader2, Check } from "lucide-react";
import { PlatformIcon } from "@/lib/platformIcons";
import { Button } from "@/components/ui/button";

export type PublishStatus = "idle" | "generating" | "preview" | "publishing" | "published" | "failed";

export interface PlatformContent {
  platform: string;
  icon: string;
  status: PublishStatus;
  content?: string;
  format?: string;
  characterLimit?: number;
  mediaSupport: string[];
}

interface PlatformCardProps {
  data: PlatformContent;
  onPublish: (platform: string) => void;
  onPreview: (platform: string) => void;
  index: number;
}

const statusLabels: Record<PublishStatus, { label: string; color: string }> = {
  idle: { label: "Ready", color: "text-muted-foreground" },
  generating: { label: "Generating", color: "text-agent-drafter" },
  preview: { label: "Preview", color: "text-agent-reviewer" },
  publishing: { label: "Publishing", color: "text-agent-customizer" },
  published: { label: "Published", color: "text-primary" },
  failed: { label: "Failed", color: "text-destructive" },
};

const PlatformCard = ({ data, onPublish, onPreview, index }: PlatformCardProps) => {
  const { label, color } = statusLabels[data.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={data.platform} className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{data.platform}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {data.status === "generating" && <Loader2 className="w-3 h-3 text-agent-drafter animate-spin" />}
          {data.status === "published" && <CheckCircle2 className="w-3 h-3 text-primary" />}
          <span className={`text-[9px] font-mono uppercase tracking-wider ${color}`}>{label}</span>
        </div>
      </div>

      <div className="text-[9px] font-mono text-muted-foreground mb-2 flex flex-wrap gap-1">
        {data.mediaSupport.map((m) => (
          <span key={m} className="px-1.5 py-0.5 rounded bg-muted">{m}</span>
        ))}
        {data.characterLimit && <span className="px-1.5 py-0.5 rounded bg-muted">{data.characterLimit} chars</span>}
      </div>

      {data.content && (
        <div className="flex-1 rounded-md bg-muted/30 border border-border p-2 mb-3 max-h-28 overflow-y-auto">
          <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">{data.content}</p>
        </div>
      )}

      {!data.content && data.status === "idle" && (
        <div className="flex-1 flex items-center justify-center rounded-md bg-muted/20 border border-dashed border-border p-4 mb-3">
          <span className="text-[10px] font-mono text-muted-foreground">Content will appear here</span>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {data.content && data.status === "preview" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(data.platform)}
              className="flex-1 text-[9px] font-mono uppercase border-border text-muted-foreground"
            >
              <Eye className="w-3 h-3 mr-1" /> Preview
            </Button>
            <Button
              size="sm"
              onClick={() => onPublish(data.platform)}
              className="flex-1 text-[9px] font-mono uppercase bg-primary text-primary-foreground"
            >
              <Send className="w-3 h-3 mr-1" /> Publish
            </Button>
          </>
        )}
        {data.status === "published" && (
          <div className="w-full text-center py-1">
            <span className="text-[10px] font-mono text-primary flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Live</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlatformCard;
