import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, RotateCcw, Download, FileText, Presentation, BookOpen, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { GeneratedPlatformContent } from "@/lib/store/chatStore";
import { getPlatformIcon } from "@/lib/platformIcons";

interface ContentCardProps {
  contents: GeneratedPlatformContent[];
  approval?: "approved" | "rejected" | null;
  onApprove: () => void;
  onReject: () => void;
  onRetry: () => void;
  onExport: (format: "slides" | "pdf" | "blog" | "article") => void;
}

export function ContentCard({ contents, approval, onApprove, onReject, onRetry, onExport }: ContentCardProps) {
  const [activePlatform, setActivePlatform] = useState(0);
  const current = contents[activePlatform];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden max-w-xl"
    >
      {/* Platform tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {contents.map((c, i) => {
          const Icon = getPlatformIcon(c.platform);
          return (
            <button
              key={c.platform}
              onClick={() => setActivePlatform(i)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                i === activePlatform
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {c.platform}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{current?.content}</p>
        {current?.hashtags && current.hashtags.length > 0 && (
          <p className="text-xs text-primary mt-3">{current.hashtags.join(" ")}</p>
        )}
      </div>

      {/* Approval actions */}
      {!approval && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onApprove} className="gap-1.5 text-success hover:text-success hover:bg-success/10 h-8">
            <ThumbsUp className="w-4 h-4" /> Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
            <ThumbsDown className="w-4 h-4" /> Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={onRetry} className="gap-1.5 text-muted-foreground h-8">
            <RotateCcw className="w-4 h-4" /> Retry
          </Button>
        </div>
      )}

      {/* Approved state with exports */}
      {approval === "approved" && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-primary">
            <ThumbsUp className="w-3.5 h-3.5" /> Content approved
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onExport("slides")} className="gap-1.5 text-xs h-8">
              <Presentation className="w-3.5 h-3.5" /> Slide Deck
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("pdf")} className="gap-1.5 text-xs h-8">
              <FileText className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("blog")} className="gap-1.5 text-xs h-8">
              <BookOpen className="w-3.5 h-3.5" /> Blog Post
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("article")} className="gap-1.5 text-xs h-8">
              <Newspaper className="w-3.5 h-3.5" /> Article
            </Button>
          </div>
        </div>
      )}

      {approval === "rejected" && (
        <div className="px-4 pb-4 flex items-center gap-2 text-xs text-destructive">
          <ThumbsDown className="w-3.5 h-3.5" /> Content rejected
        </div>
      )}
    </motion.div>
  );
}
