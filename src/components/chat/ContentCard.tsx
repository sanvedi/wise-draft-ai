import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, RotateCcw, FileText, Presentation, BookOpen, Newspaper, Image, Video, Loader2, Eye, EyeOff, Copy, Send, Check, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import type { GeneratedPlatformContent } from "@/lib/store/chatStore";
import { getPlatformIcon } from "@/lib/platformIcons";
import { PlatformPreview } from "./PlatformPreview";
import { useBrandStore } from "@/lib/store/brandStore";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { publishViaBuffer, getBufferOrganizations, getBufferChannels } from "@/lib/api/ecos";

const platformToService: Record<string, string[]> = {
  "Instagram": ["instagram"],
  "YouTube": ["youtube"],
  "X": ["twitter"],
  "LinkedIn": ["linkedin"],
  "Facebook": ["facebook"],
  "Google Business": ["googlebusiness", "google"],
  "Pinterest": ["pinterest"],
  "TikTok": ["tiktok"],
  "Threads": ["threads"],
  "Bluesky": ["bluesky"],
  "Mastodon": ["mastodon"],
};

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
  const [copied, setCopied] = useState(false);
  const { fullBrandDNA } = useBrandStore();
  const { toast } = useToast();
  const brandName = fullBrandDNA?.organizationName;
  const brandLogoUrl = fullBrandDNA?.logoUrl;
  const current = contents[activePlatform];
  const currentMedia = generatedMedia?.[current?.platform];

  const isMediaGenerating = mediaGenerating &&
    mediaGenerating.platform === current?.platform;

  const handleCopy = async () => {
    const text = current?.content || "";
    const hashtags = current?.hashtags?.join(" ") || "";
    const fullText = hashtags ? `${text}\n\n${hashtags}` : text;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast({ title: "Copied!", description: "Content copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<Record<string, boolean>>({});

  const handlePublishViaBuffer = useCallback(async () => {
    const platform = current?.platform || "";
    const text = current?.content || "";
    const hashtags = current?.hashtags?.join(" ") || "";
    const fullText = hashtags ? `${text}\n\n${hashtags}` : text;

    if (!fullText.trim()) return;

    setPublishing(true);
    try {
      // Get Buffer channels
      const orgResult = await getBufferOrganizations();
      if (!orgResult.success || !orgResult.organizations?.length) {
        toast({ title: "Buffer Not Connected", description: "Connect Buffer in Integrations to publish directly.", variant: "destructive" });
        setPublishing(false);
        return;
      }
      const orgId = orgResult.organizations[0].id;
      const channelResult = await getBufferChannels(orgId);
      if (!channelResult.success || !channelResult.channels?.length) {
        toast({ title: "No Channels Found", description: "No active Buffer channels available.", variant: "destructive" });
        setPublishing(false);
        return;
      }
      const activeChannels = (channelResult.channels || []).filter((c: any) => !c.isLocked);

      // Find matching channel for this platform
      const services = platformToService[platform];
      const matchedChannel = services
        ? activeChannels.find((ch: any) => services.includes(ch.service?.toLowerCase()))
        : undefined;

      const targetIds = matchedChannel ? [matchedChannel.id] : activeChannels.map((c: any) => c.id).slice(0, 1);

      if (targetIds.length === 0) {
        toast({ title: "No Matching Channel", description: `No Buffer channel for ${platform}. Content copied instead.`, variant: "destructive" });
        handleCopy();
        setPublishing(false);
        return;
      }

      const result = await publishViaBuffer([{ platform, content: fullText }], targetIds);
      if (result.success) {
        setPublished((prev) => ({ ...prev, [platform]: true }));
        toast({ title: "Published!", description: `${platform} content sent via Buffer` });
      } else {
        toast({ title: "Publish Failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Publish Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  }, [current, toast, handleCopy]);

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
              onClick={() => { setActivePlatform(i); setCopied(false); }}
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
        {/* Preview toggle + Copy/Post actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="gap-1.5 text-xs h-7 px-2"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy content to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePostDirectly}
                    className="gap-1.5 text-xs h-7 px-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open {current?.platform || "platform"} to post</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
            brandName={brandName}
            brandLogoUrl={brandLogoUrl}
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

        {/* Media generation buttons with engine labels */}
        <div className="flex flex-wrap gap-2 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                Engine: Nano Banana (Gemini 2.5 Flash Image)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                Engine: Nano Banana + Veo (Video Generation)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Export options — always visible */}
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Export</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <Button size="sm" variant="outline" onClick={() => onExport("slides")} className="gap-1.5 text-xs h-7">
              <Presentation className="w-3.5 h-3.5" /> Slide Deck
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("pdf")} className="gap-1.5 text-xs h-7">
              <FileText className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("blog")} className="gap-1.5 text-xs h-7">
              <BookOpen className="w-3.5 h-3.5" /> Blog Post
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport("article")} className="gap-1.5 text-xs h-7">
              <Newspaper className="w-3.5 h-3.5" /> Article
            </Button>
          </div>
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

      {approval === "approved" && (
        <div className="px-4 pb-4 flex items-center gap-2 text-xs text-primary">
          <ThumbsUp className="w-3.5 h-3.5" /> Content approved
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
