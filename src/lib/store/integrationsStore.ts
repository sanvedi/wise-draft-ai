import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlatformConnection {
  id: string;
  name: string;
  type: "buffer" | "direct";
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
    icon: "buffer",
    description: "Multi-platform publishing via Buffer",
    apiKeyLabel: "Buffer Access Token",
    apiKeyHint: "publish.buffer.com → Settings → API",
    apiKey: "",
    isConnected: false,
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "instagram",
    name: "Instagram",
    type: "direct",
    icon: "instagram",
    description: "Direct posting to Instagram Business",
    apiKeyLabel: "Instagram Access Token",
    apiKeyHint: "Meta Business Suite → Settings → Access Tokens",
    apiKey: "",
    isConnected: false,
    supportedServices: ["instagram"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    type: "direct",
    icon: "linkedin",
    description: "Direct posting to LinkedIn profiles & pages",
    apiKeyLabel: "LinkedIn Access Token",
    apiKeyHint: "linkedin.com/developers → My Apps → Auth",
    apiKey: "",
    isConnected: false,
    supportedServices: ["linkedin"],
  },
  {
    id: "x-twitter",
    name: "X (Twitter)",
    type: "direct",
    icon: "twitter",
    description: "Direct posting to X / Twitter",
    apiKeyLabel: "X API Bearer Token",
    apiKeyHint: "developer.x.com → Projects → Keys & Tokens",
    apiKey: "",
    isConnected: false,
    supportedServices: ["twitter"],
  },
  {
    id: "youtube",
    name: "YouTube",
    type: "direct",
    icon: "youtube",
    description: "Upload & manage YouTube content",
    apiKeyLabel: "YouTube API Key",
    apiKeyHint: "console.cloud.google.com → APIs → YouTube Data API",
    apiKey: "",
    isConnected: false,
    supportedServices: ["youtube"],
  },
  {
    id: "facebook",
    name: "Facebook",
    type: "direct",
    icon: "facebook",
    description: "Direct posting to Facebook Pages",
    apiKeyLabel: "Facebook Page Access Token",
    apiKeyHint: "Meta Business Suite → Settings → Access Tokens",
    apiKey: "",
    isConnected: false,
    supportedServices: ["facebook"],
  },
  {
    id: "google-business",
    name: "Google Business",
    type: "direct",
    icon: "googlebusiness",
    description: "Post updates to Google Business Profile",
    apiKeyLabel: "Google API Key",
    apiKeyHint: "console.cloud.google.com → APIs → Business Profile",
    apiKey: "",
    isConnected: false,
    supportedServices: ["googlebusiness"],
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
      name: "content-flow-integrations",
      version: 3,
    }
  )
);
