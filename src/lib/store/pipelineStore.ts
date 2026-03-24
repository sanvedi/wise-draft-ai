import { create } from "zustand";
import type { AgentStatus } from "@/components/ecos/AgentCard";
import type { PlatformContent } from "@/components/ecos/PlatformCard";
import type { MediaItem } from "@/components/ecos/MultimodalInput";
import type { BufferChannel } from "@/components/ecos/BufferConnect";

interface AgentState {
  status: AgentStatus;
  output?: string;
  score?: number;
}

const defaultPlatforms: PlatformContent[] = [
  { platform: "Instagram", icon: "📸", status: "idle", mediaSupport: ["image", "video", "carousel"], characterLimit: 2200, format: "Post / Reel" },
  { platform: "YouTube", icon: "▶️", status: "idle", mediaSupport: ["video", "shorts"], format: "Video / Short" },
  { platform: "X", icon: "𝕏", status: "idle", mediaSupport: ["text", "image", "video"], characterLimit: 280, format: "Tweet / Thread" },
  { platform: "LinkedIn", icon: "💼", status: "idle", mediaSupport: ["text", "image", "document", "video"], characterLimit: 3000, format: "Post / Article" },
  { platform: "Facebook", icon: "📘", status: "idle", mediaSupport: ["text", "image", "video", "link"], format: "Post / Story" },
  { platform: "Google Business", icon: "📍", status: "idle", mediaSupport: ["text", "image", "link"], characterLimit: 1500, format: "Business Update" },
];

const initialAgents: Record<string, AgentState> = {
  drafter: { status: "idle" },
  reviewer: { status: "idle" },
  customizer: { status: "idle" },
  publisher: { status: "idle" },
  learner: { status: "idle" },
};

interface PipelineStore {
  agents: Record<string, AgentState>;
  platforms: PlatformContent[];
  isRunning: boolean;
  media: MediaItem[];
  previewContent: string | null;
  previewStatus: "empty" | "generating" | "review" | "approved";
  metrics: { tokenEfficiency: number; alignmentDrift: number; cycleReduction: number; processingTime: number | null };
  bufferChannels: BufferChannel[];
  selectedChannelIds: string[];
  bufferOrgId: string | null;

  setAgents: (agents: Record<string, AgentState>) => void;
  updateAgent: (name: string, update: Partial<AgentState>) => void;
  setPlatforms: (platforms: PlatformContent[]) => void;
  updatePlatform: (platform: string, update: Partial<PlatformContent>) => void;
  setIsRunning: (running: boolean) => void;
  setMedia: (media: MediaItem[]) => void;
  setPreviewContent: (content: string | null) => void;
  setPreviewStatus: (status: "empty" | "generating" | "review" | "approved") => void;
  setMetrics: (metrics: any) => void;
  setBufferChannels: (channels: BufferChannel[]) => void;
  setSelectedChannelIds: (ids: string[]) => void;
  setBufferOrgId: (id: string | null) => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  agents: initialAgents,
  platforms: defaultPlatforms,
  isRunning: false,
  media: [],
  previewContent: null,
  previewStatus: "empty",
  metrics: { tokenEfficiency: 0, alignmentDrift: 0, cycleReduction: 0, processingTime: null },
  bufferChannels: [],
  selectedChannelIds: [],
  bufferOrgId: null,

  setAgents: (agents) => set({ agents }),
  updateAgent: (name, update) => set((s) => ({ agents: { ...s.agents, [name]: { ...s.agents[name], ...update } } })),
  setPlatforms: (platforms) => set({ platforms }),
  updatePlatform: (platform, update) => set((s) => ({ platforms: s.platforms.map((p) => p.platform === platform ? { ...p, ...update } : p) })),
  setIsRunning: (isRunning) => set({ isRunning }),
  setMedia: (media) => set({ media }),
  setPreviewContent: (previewContent) => set({ previewContent }),
  setPreviewStatus: (previewStatus) => set({ previewStatus }),
  setMetrics: (metrics) => set({ metrics }),
  setBufferChannels: (bufferChannels) => set({ bufferChannels }),
  setSelectedChannelIds: (selectedChannelIds) => set({ selectedChannelIds }),
  setBufferOrgId: (bufferOrgId) => set({ bufferOrgId }),
  resetPipeline: () => set({ agents: initialAgents, platforms: defaultPlatforms, previewContent: null, previewStatus: "empty" }),
}));

export { defaultPlatforms, initialAgents };
