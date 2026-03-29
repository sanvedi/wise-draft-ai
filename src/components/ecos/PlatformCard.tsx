import { motion } from "framer-motion";
import { Copy, Eye, CheckCircle2, Loader2, Check, Send } from "lucide-react";
import { PlatformIcon } from "@/lib/platformIcons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleCopyContent = async () => {
    if (!data.content) return;
    try {
      await navigator.clipboard.writeText(data.content);
      toast({ title: "Copied!", description: `${data.platform} content copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={data.platform} className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{data.platform}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {data.status === "generating" && <Loader2 className="w-3 h-3 text-agent-drafter animate-spin" />}
          {data.status === "published" && <CheckCircle2 className="w-3 h-3 text-primary" />}
          <span className={`text-xs font-mono ${color}`}>{label}</span>
        </div>
      </div>

      {data.content && (
        <div className="flex-1 rounded-lg bg-muted/30 border border-border p-2.5 mb-3 max-h-28 overflow-y-auto">
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{data.content}</p>
        </div>
      )}

      {!data.content && data.status === "idle" && (
        <div className="flex-1 flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border p-4 mb-3">
          <span className="text-xs text-muted-foreground">Content will appear here</span>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {data.content && data.status === "preview" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(data.platform)}
              className="flex-1 text-xs border-border text-muted-foreground rounded-lg"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
            </Button>
            <Button
              size="sm"
              onClick={handleCopyContent}
              className="flex-1 text-xs bg-primary text-primary-foreground rounded-lg"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
          </>
        )}
        {data.status === "published" && (
          <div className="w-full text-center py-1.5">
            <span className="text-xs text-primary flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> Live</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlatformCard;
