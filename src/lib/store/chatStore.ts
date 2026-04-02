import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  platforms?: string[];
  generatedContent?: GeneratedPlatformContent[];
  status?: "sending" | "generating" | "complete" | "error";
  approval?: "approved" | "rejected" | "publishing" | null;
  timestamp: Date;
  brandApplied?: boolean;
  generatedMedia?: Record<string, { imageUrl?: string; videoUrl?: string }>;
}

export interface GeneratedPlatformContent {
  platform: string;
  content: string;
  hashtags?: string[];
  viralScore?: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;

  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, update: Partial<ChatMessage>) => void;
  setIsGenerating: (generating: boolean) => void;
  deleteConversation: (id: string) => void;
  getActiveConversation: () => Conversation | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isGenerating: false,

  createConversation: () => {
    const id = crypto.randomUUID();
    const conversation: Conversation = {
      id,
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date(),
      messages: [],
    };
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              lastMessage: message.content.slice(0, 80),
              timestamp: new Date(),
              title: c.messages.length === 0 && message.role === "user"
                ? message.content.slice(0, 40) || "New conversation"
                : c.title,
            }
          : c
      ),
    })),

  updateMessage: (conversationId, messageId, update) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...update } : m
              ),
            }
          : c
      ),
    })),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  deleteConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    })),

  getActiveConversation: () => {
    const state = get();
    return state.conversations.find((c) => c.id === state.activeConversationId);
  },
}));
