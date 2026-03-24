import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlatformConnection {
  id: string;
  name: string;
  type: "buffer" | "custom";
  icon: string;
  description: string;
  apiKeyLabel: string;
  apiKeyHint: string;
  /** Stored only in localStorage — never sent to frontend logs */
  apiKey: string;
  isConnected: boolean;
  connectedAt?: string;
  supportedServices: string[];
}

const defaultConnections: PlatformConnection[] = [
  {
    id: "buffer",
    name: "Buffer",
    type: "buffer",
    icon: "📡",
    description: "Publish to Facebook, Instagram, LinkedIn, X, YouTube, Pinterest, TikTok, and more via Buffer.",
    apiKeyLabel: "Buffer Access Token",
    apiKeyHint: "Generate at publish.buffer.com → Settings → API",
    apiKey: "",
    isConnected: false,
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok", "mastodon", "bluesky", "threads", "googlebusiness"],
  },
];

interface IntegrationsStore {
  connections: PlatformConnection[];
  addConnection: (conn: PlatformConnection) => void;
  updateConnection: (id: string, update: Partial<PlatformConnection>) => void;
  removeConnection: (id: string) => void;
  setApiKey: (id: string, key: string) => void;
  connectPlatform: (id: string) => void;
  disconnectPlatform: (id: string) => void;
  getConnected: () => PlatformConnection[];
}

export const useIntegrationsStore = create<IntegrationsStore>()(
  persist(
    (set, get) => ({
      connections: defaultConnections,

      addConnection: (conn) =>
        set((s) => ({
          connections: s.connections.some((c) => c.id === conn.id)
            ? s.connections
            : [...s.connections, conn],
        })),

      updateConnection: (id, update) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, ...update } : c
          ),
        })),

      removeConnection: (id) =>
        set((s) => ({
          connections: s.connections.filter((c) => c.id !== id),
        })),

      setApiKey: (id, key) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, apiKey: key } : c
          ),
        })),

      connectPlatform: (id) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, isConnected: true, connectedAt: new Date().toISOString() } : c
          ),
        })),

      disconnectPlatform: (id) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, isConnected: false, apiKey: "", connectedAt: undefined } : c
          ),
        })),

      getConnected: () => get().connections.filter((c) => c.isConnected),
    }),
    {
      name: "sutra-integrations",
    }
  )
);
