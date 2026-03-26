import { Heart, MessageCircle, Repeat2, Share, Bookmark, Send, ThumbsUp, MoreHorizontal } from "lucide-react";
import { getPlatformIcon } from "@/lib/platformIcons";

interface PlatformPreviewProps {
  platform: string;
  content: string;
  hashtags?: string[];
  imageUrl?: string;
}

function TwitterPreview({ content, hashtags, imageUrl }: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="bg-black text-white rounded-xl p-4 text-sm max-w-md">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-muted-foreground/30 shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white">Your Brand</span>
            <span className="text-gray-500">@yourbrand · 1m</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          {hashtags && hashtags.length > 0 && (
            <p className="text-blue-400">{hashtags.join(" ")}</p>
          )}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-700 mt-2">
              <img src={imageUrl} alt="" className="w-full max-h-48 object-cover" />
            </div>
          )}
          <div className="flex justify-between pt-2 text-gray-500 max-w-xs">
            <MessageCircle className="w-4 h-4" />
            <Repeat2 className="w-4 h-4" />
            <Heart className="w-4 h-4" />
            <Share className="w-4 h-4" />
            <Bookmark className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ content, hashtags, imageUrl }: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="bg-black text-white rounded-xl overflow-hidden max-w-md">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 shrink-0" />
        <span className="font-semibold text-sm">yourbrand</span>
        <MoreHorizontal className="w-4 h-4 ml-auto text-gray-400" />
      </div>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 flex items-center justify-center text-gray-500 text-xs">
          Image preview
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex gap-4">
          <Heart className="w-5 h-5" />
          <MessageCircle className="w-5 h-5" />
          <Send className="w-5 h-5" />
          <Bookmark className="w-5 h-5 ml-auto" />
        </div>
        <p className="text-sm">
          <span className="font-semibold">yourbrand </span>
          {content.length > 120 ? content.slice(0, 120) + "…" : content}
        </p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-blue-400">{hashtags.join(" ")}</p>
        )}
      </div>
    </div>
  );
}

function LinkedInPreview({ content, hashtags, imageUrl }: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden max-w-md border border-gray-200">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Your Brand</p>
          <p className="text-xs text-gray-500">1m · 🌐</p>
        </div>
        <MoreHorizontal className="w-4 h-4 ml-auto text-gray-400" />
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content.length > 200 ? content.slice(0, 200) + "…" : content}</p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-blue-600 mt-1">{hashtags.join(" ")}</p>
        )}
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full max-h-48 object-cover" />
      )}
      <div className="flex justify-around border-t border-gray-200 py-2 text-gray-500 text-xs">
        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Comment</span>
        <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /> Repost</span>
        <span className="flex items-center gap-1"><Send className="w-4 h-4" /> Send</span>
      </div>
    </div>
  );
}

function YouTubePreview({ content, imageUrl }: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="bg-[#0f0f0f] text-white rounded-xl overflow-hidden max-w-md">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full aspect-video object-cover" />
      ) : (
        <div className="w-full aspect-video bg-muted-foreground/20 flex items-center justify-center text-gray-500 text-xs">
          Video thumbnail
        </div>
      )}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium line-clamp-2">{content.length > 80 ? content.slice(0, 80) + "…" : content}</p>
        <p className="text-xs text-gray-400">Your Brand · 0 views · Just now</p>
      </div>
    </div>
  );
}

function FacebookPreview({ content, hashtags, imageUrl }: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden max-w-md border border-gray-200">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Your Brand</p>
          <p className="text-xs text-gray-500">Just now · 🌐</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-blue-600 mt-1">{hashtags.join(" ")}</p>
        )}
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full max-h-48 object-cover" />
      )}
      <div className="flex justify-around border-t border-gray-200 py-2 text-gray-500 text-xs">
        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Comment</span>
        <span className="flex items-center gap-1"><Share className="w-4 h-4" /> Share</span>
      </div>
    </div>
  );
}

function GenericPreview({ platform, content, hashtags, imageUrl }: PlatformPreviewProps) {
  const Icon = getPlatformIcon(platform);
  return (
    <div className="bg-card text-foreground rounded-xl border border-border overflow-hidden max-w-md">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="w-4 h-4" />
        <span className="font-semibold text-sm capitalize">{platform}</span>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-primary">{hashtags.join(" ")}</p>
        )}
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-lg" />
        )}
      </div>
    </div>
  );
}

export function PlatformPreview({ platform, content, hashtags, imageUrl }: PlatformPreviewProps) {
  const p = platform.toLowerCase();
  const props = { content, hashtags, imageUrl };

  switch (p) {
    case "x":
      return <TwitterPreview {...props} />;
    case "instagram":
      return <InstagramPreview {...props} />;
    case "linkedin":
      return <LinkedInPreview {...props} />;
    case "youtube":
      return <YouTubePreview {...props} />;
    case "facebook":
      return <FacebookPreview {...props} />;
    default:
      return <GenericPreview platform={platform} {...props} />;
  }
}
