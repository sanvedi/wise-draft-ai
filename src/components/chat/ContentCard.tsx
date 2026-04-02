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
import { buildPublishText, getMatchingBufferChannelIds } from "@/lib/buffer";

interface ContentCardProps {
  contents: GeneratedPlatformContent[];
  approval?: "approved" | "rejected" | "publishing" | null;
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

  const isMediaGenerating = mediaGenerating && mediaGenerating.platform === current?.platform;

  const handleCopy = async () => {
    const fullText = buildPublishText(current?.content || "", current?.hashtags);

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
    const fullText = buildPublishText(current?.content || "", current?.hashtags);

    if (!fullText.trim()) return;

    setPublishing(true);
    try {
      const orgResult = await getBufferOrganizations();
      if (!orgResult.success || !orgResult.organizations?.length) {
        toast({ title: "Buffer Not Connected", description: "Connect Buffer in Integrations to publish directly.", variant: "destructive" });
        return;
      }

      const orgId = orgResult.organizations[0].id;
      const channelResult = await getBufferChannels(orgId);
      if (!channelResult.success || !channelResult.channels?.length) {
        toast({ title: "No Channels Found", description: "No active Buffer channels available.", variant: "destructive" });
        return;
      }

      const targetIds = getMatchingBufferChannelIds(platform, channelResult.channels || []);
      if (targetIds.length === 0) {
        toast({ title: "No Matching Channel", description: `No Buffer channel is connected for ${platform}.`, variant: "destructive" });
        return;
      }

      const result = await publishViaBuffer([{ platform, content: fullText }], [targetIds[0]]);
      if (result.success) {
        setPublished((prev) => ({ ...prev, [platform]: true }));
        toast({ title: "Published!", description: `${platform} content sent via Buffer.` });
      } else {
        toast({ title: "Publish Failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Publish Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  }, [current, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden max-w-xl"
    >
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

      <div className="p-4 space-y-3">
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
                    {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
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
                    onClick={handlePublishViaBuffer}
                    disabled={publishing || published[current?.platform || ""]}
                    className="gap-1.5 text-xs h-7 px-2"
                  >
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : published[current?.platform || ""] ? <Check className="w-3.5 h-3.5 text-primary" /> : <Send className="w-3.5 h-3.5" />}
                    {publishing ? "Publishing…" : published[current?.platform || ""] ? "Published" : "Publish"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Publish to {current?.platform || "platform"} via Buffer</TooltipContent>
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

        <div className="border-t border-border" />

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

      {!approval && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onApprove} className="gap-1.5 text-primary hover:bg-primary/10 h-8">
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

      {approval === "publishing" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Publishing to selected platforms via Buffer…
          </div>
        </div>
      )}

      {approval === "approved" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            Posted successfully via Buffer.
          </div>
        </div>
      )}
    </motion.div>
  );
}
