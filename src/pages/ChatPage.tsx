import { useCallback, useRef, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { AccountPanel } from "@/components/chat/AccountPanel";
import { useToast } from "@/hooks/use-toast";
import { ecosApi } from "@/lib/api/ecos";
import { useBrandStore } from "@/lib/store/brandStore";
import { useChatStore, type ChatMessage as ChatMessageType } from "@/lib/store/chatStore";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { GeneratingIndicator } from "@/components/chat/GeneratingIndicator";
import { FAQPanel } from "@/components/chat/FAQPanel";
import { Button } from "@/components/ui/button";
import { useBrandTheme } from "@/hooks/useBrandTheme";

const ChatPage = () => {
  useBrandTheme();
  const { toast } = useToast();
  const { fullBrandDNA, setBrandData, setFullBrandDNA } = useBrandStore();
  const store = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [mediaGenerating, setMediaGenerating] = useState<{ type: "image" | "video"; platform: string } | null>(null);

  const activeConversation = store.getActiveConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, store.isGenerating]);

  const handleSend = useCallback(async (prompt: string, platforms: string[], files: File[]) => {
    let convId = store.activeConversationId;
    if (!convId) {
      convId = store.createConversation();
    }

    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      platforms,
      timestamp: new Date(),
      status: "complete",
    };
    store.addMessage(convId, userMsg);

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessageType = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "generating",
    };
    store.addMessage(convId, assistantMsg);
    store.setIsGenerating(true);

    try {
      const result = await ecosApi.generateContent(prompt, platforms, fullBrandDNA);

      if (!result.success) {
        store.updateMessage(convId, assistantId, {
          content: result.error || "Something went wrong. Please try again.",
          status: "error",
        });
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        store.updateMessage(convId, assistantId, {
          content: `Here's your content tailored for ${platforms.join(", ")}. Review it below and approve, reject, or retry.`,
          generatedContent: result.contents.map((c) => ({
            platform: c.platform,
            content: c.content,
            hashtags: c.hashtags,
            viralScore: c.viralScore,
          })),
          status: "complete",
          approval: null,
        });
      }
    } catch (e) {
      store.updateMessage(convId, assistantId, {
        content: "An unexpected error occurred. Please try again.",
        status: "error",
      });
    } finally {
      store.setIsGenerating(false);
    }
  }, [store, fullBrandDNA, toast]);

  const handleApprove = useCallback((messageId: string) => {
    const convId = store.activeConversationId;
    if (!convId) return;
    store.updateMessage(convId, messageId, { approval: "approved" });
    toast({ title: "Content approved", description: "You can now export in your preferred format." });
  }, [store, toast]);

  const handleReject = useCallback((messageId: string) => {
    const convId = store.activeConversationId;
    if (!convId) return;
    store.updateMessage(convId, messageId, { approval: "rejected" });
  }, [store]);

  const handleRetry = useCallback(async (messageId: string) => {
    const convId = store.activeConversationId;
    if (!convId) return;
    const conv = store.conversations.find((c) => c.id === convId);
    const msgIndex = conv?.messages.findIndex((m) => m.id === messageId);
    if (!conv || msgIndex === undefined || msgIndex < 1) return;

    const userMsg = conv.messages[msgIndex - 1];
    if (userMsg.role === "user") {
      handleSend(userMsg.content, userMsg.platforms || [], []);
    }
  }, [store, handleSend]);

  const handleExport = useCallback((messageId: string, format: "slides" | "pdf" | "blog" | "article") => {
    toast({ title: "Export started", description: `Generating ${format}... This will be ready shortly.` });
  }, [toast]);

  const handleGenerateMedia = useCallback(async (messageId: string, type: "image" | "video", platform: string) => {
    const convId = store.activeConversationId;
    if (!convId) return;

    const conv = store.conversations.find((c) => c.id === convId);
    const msg = conv?.messages.find((m) => m.id === messageId);
    const platformContent = msg?.generatedContent?.find((c) => c.platform === platform);
    if (!platformContent) return;

    setMediaGenerating({ type, platform });

    try {
      const result = await ecosApi.generateMedia(type, platform, platformContent.content, fullBrandDNA);

      if (!result.success) {
        toast({ title: "Media generation failed", description: result.error, variant: "destructive" });
        return;
      }

      const existingMedia = msg?.generatedMedia || {};
      const updatedMedia = { ...existingMedia };

      if (type === "image" && result.url) {
        updatedMedia[platform] = { ...updatedMedia[platform], imageUrl: result.url };
        toast({ title: "Image generated", description: `Image for ${platform} is ready.` });
      } else if (type === "video") {
        updatedMedia[platform] = {
          ...updatedMedia[platform],
          imageUrl: result.thumbnailUrl || updatedMedia[platform]?.imageUrl,
        };
        toast({
          title: "Video content ready",
          description: `Thumbnail and video script for ${platform} generated.`,
        });
      }

      store.updateMessage(convId, messageId, { generatedMedia: updatedMedia });
    } catch (e) {
      toast({ title: "Error", description: "Could not generate media.", variant: "destructive" });
    } finally {
      setMediaGenerating(null);
    }
  }, [store, fullBrandDNA, toast]);

  const handleBrandLoad = useCallback(async (url: string) => {
    toast({ title: "Loading brand kit", description: `Extracting brand identity from ${url}...` });
    try {
      const result = await ecosApi.extractBrandDNA(url);
      if (result.success && result.brandDNA) {
        setBrandData(result.brandDNA);
        setFullBrandDNA(result.brandDNA);
        toast({ title: "Brand kit applied", description: `${result.brandDNA.organizationName || "Brand"} identity loaded successfully.` });
      } else {
        toast({ title: "Brand extraction failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not extract brand data.", variant: "destructive" });
    }
  }, [setBrandData, setFullBrandDNA, toast]);

  return (
    <div className="h-screen flex bg-background">
      <AnimatePresence>
        {showFAQ && <FAQPanel onClose={() => setShowFAQ(false)} />}
        {showAccount && <AccountPanel onClose={() => setShowAccount(false)} />}
      </AnimatePresence>

      <ChatSidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(false)} onShowFAQ={() => setShowFAQ(true)} onShowAccount={() => setShowAccount(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center gap-3 border-b border-border px-4 bg-background/80 backdrop-blur-sm">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
              <PanelLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="text-sm font-medium text-foreground">
            {activeConversation?.title || "The Content Alchemist"}
          </span>
          {fullBrandDNA && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 ml-auto">
              Brand: {(fullBrandDNA as any).organizationName || "Active"}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-display font-bold text-lg">A</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  The Content <span className="text-primary">Alchemist</span>
                </h1>
                <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                  Transform your ideas into polished, platform-ready content. Select your platforms, describe your content, and let the magic happen.
                </p>
              </div>
            ) : (
              activeConversation.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRetry={handleRetry}
                  onExport={handleExport}
                  onGenerateMedia={handleGenerateMedia}
                  mediaGenerating={mediaGenerating}
                />
              ))
            )}

            {store.isGenerating && <GeneratingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={store.isGenerating}
          brandWebsite={null}
          onBrandLoad={handleBrandLoad}
        />
      </div>
    </div>
  );
};

export default ChatPage;
