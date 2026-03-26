import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/lib/store/chatStore";
import { ContentCard } from "./ContentCard";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onApprove: (messageId: string) => void;
  onReject: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onExport: (messageId: string, format: "slides" | "pdf" | "blog" | "article") => void;
}

export function ChatMessage({ message, onApprove, onReject, onRetry, onExport }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-primary font-display font-bold text-xs">A</span>
        </div>
      )}

      <div className={cn("max-w-2xl", isUser ? "order-first" : "")}>
        {/* Text content */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            {message.content}
            {message.platforms && message.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-primary-foreground/20">
                {message.platforms.map((p) => (
                  <span key={p} className={cn("text-xs px-2 py-0.5 rounded-full", isUser ? "bg-primary-foreground/20" : "bg-background")}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generated content card */}
        {message.generatedContent && message.generatedContent.length > 0 && (
          <div className="mt-3">
            <ContentCard
              contents={message.generatedContent}
              approval={message.approval}
              onApprove={() => onApprove(message.id)}
              onReject={() => onReject(message.id)}
              onRetry={() => onRetry(message.id)}
              onExport={(format) => onExport(message.id, format)}
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-foreground font-medium text-xs">U</span>
        </div>
      )}
    </motion.div>
  );
}
