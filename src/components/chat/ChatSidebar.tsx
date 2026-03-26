import { Plus, MessageSquare, Trash2, HelpCircle, LogOut, PanelLeftClose } from "lucide-react";
import { useChatStore } from "@/lib/store/chatStore";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onShowFAQ: () => void;
}

export function ChatSidebar({ collapsed, onToggle, onShowFAQ }: ChatSidebarProps) {
  const { conversations, activeConversationId, createConversation, setActiveConversation, deleteConversation } = useChatStore();
  const { user, signOut } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (collapsed) return null;

  return (
    <aside className="w-72 h-full border-r border-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-display font-bold text-xs">A</span>
          </div>
          <span className="font-display font-semibold text-sm text-foreground">The Content Alchemist</span>
        </div>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground p-1">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Button
          onClick={() => createConversation()}
          variant="outline"
          className="w-full justify-start gap-2 text-sm h-9 border-dashed"
        >
          <Plus className="w-4 h-4" /> New conversation
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveConversation(conv.id)}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "w-full text-left rounded-lg px-3 py-2.5 flex items-start gap-2.5 transition-colors group",
              activeConversationId === conv.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.title}</p>
              <p className="text-xs text-muted-foreground truncate">{formatDistanceToNow(conv.timestamp, { addSuffix: true })}</p>
            </div>
            {hoveredId === conv.id && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onShowFAQ}>
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
        {user && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">{user.email}</span>
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive p-1" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
