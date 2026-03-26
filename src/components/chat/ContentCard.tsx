import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, RotateCcw, FileText, Presentation, BookOpen, Newspaper, Image, Video, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { GeneratedPlatformContent } from "@/lib/store/chatStore";
import { getPlatformIcon } from "@/lib/platformIcons";
import { PlatformPreview } from "./PlatformPreview";
import { useBrandStore } from "@/lib/store/brandStore";

interface ContentCardProps {
  contents: GeneratedPlatformContent[];
  approval?: "approved" | "rejected" | null;
  onApprove: () => void;
  onReject: () => void;
  onRetry: () => void;
  onExport: (format: "slides" | "pdf" | "blog" | "article") => void;
  onGenerateMedia?: (type: "image" | "video", platform: string) => void;
  mediaGenerating?: { type: "image" | "video"; platform: string } | null;
  generatedMedia?: Record<string, { imageUrl?: string; videoUrl?: string }>;
}

export function ContentCard({
  contents, approval, onApprove, onReject, onRetry, onExport,
  onGenerateMedia, mediaGenerating, generatedMedia,
}: ContentCardProps) {
  const [activePlatform, setActivePlatform] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const current = contents[activePlatform];
  const currentMedia = generatedMedia?.[current?.platform];

  const isMediaGenerating = mediaGenerating &&
    mediaGenerating.platform === current?.platform;

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
      <div className="p-4 space-y-3">
        {/* Preview toggle */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5 text-xs h-7"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
        </div>

        {showPreview ? (
          <PlatformPreview
            platform={current?.platform}
            content={current?.content || ""}
            hashtags={current?.hashtags}
            imageUrl={currentMedia?.imageUrl}
          />
        ) : (
          <>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{current?.content}</p>
            {current?.hashtags && current.hashtags.length > 0 && (
              <p className="text-xs text-primary mt-3">{current.hashtags.join(" ")}</p>
            )}
          </>
        )}

        {/* Generated media preview */}
        {!showPreview && currentMedia?.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={currentMedia.imageUrl} alt={`Generated for ${current.platform}`} className="w-full object-cover max-h-64" />
          </div>
        )}
        {!showPreview && currentMedia?.videoUrl && (
          <div className="rounded-lg overflow-hidden border border-border">
            <video src={currentMedia.videoUrl} controls className="w-full max-h-64" />
          </div>
        )}

        {/* Media generation buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateMedia?.("image", current.platform)}
            disabled={!!isMediaGenerating}
            className="gap-1.5 text-xs h-7"
          >
            {isMediaGenerating && mediaGenerating?.type === "image" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Image className="w-3.5 h-3.5" />
            )}
            {currentMedia?.imageUrl ? "Regenerate Image" : "Generate Image"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateMedia?.("video", current.platform)}
            disabled={!!isMediaGenerating}
            className="gap-1.5 text-xs h-7"
          >
            {isMediaGenerating && mediaGenerating?.type === "video" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Video className="w-3.5 h-3.5" />
            )}
            {currentMedia?.videoUrl ? "Regenerate Video" : "Generate Video"}
          </Button>
        </div>
      </div>

      {/* Approval actions */}
      {!approval && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onApprove} className="gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-8">
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject} className="gap-1.5 text-destructive hover:bg-destructive/10 h-8">
            <ThumbsDown className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRetry} className="gap-1.5 text-muted-foreground h-8">
            <RotateCcw className="w-4 h-4" />
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
