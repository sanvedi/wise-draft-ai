import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/lib/store/chatStore";
import { ContentCard } from "./ContentCard";

interface ChatMessageProps {
  message: ChatMessageType;
  onApprove: (messageId: string) => void;
  onReject: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onExport: (messageId: string, format: "slides" | "pdf" | "blog" | "article") => void;
  onGenerateMedia?: (messageId: string, type: "image" | "video", platform: string) => void;
  mediaGenerating?: { type: "image" | "video"; platform: string } | null;
}

export function ChatMessage({ message, onApprove, onReject, onRetry, onExport, onGenerateMedia, mediaGenerating }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
            {message.content}
            {message.platforms && message.platforms.length > 0 && (
              <p className="text-xs opacity-70 mt-1">{message.platforms.join(", ")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {message.content && (
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-foreground">
                {message.content}
              </div>
            )}
            {message.generatedContent && message.generatedContent.length > 0 && (
              <ContentCard
                contents={message.generatedContent}
                approval={message.approval}
                onApprove={() => onApprove(message.id)}
                onReject={() => onReject(message.id)}
                onRetry={() => onRetry(message.id)}
                onExport={(format) => onExport(message.id, format)}
                onGenerateMedia={(type, platform) => onGenerateMedia?.(message.id, type, platform)}
                mediaGenerating={mediaGenerating}
                generatedMedia={message.generatedMedia}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

