import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plug, Plus, Eye, EyeOff, Trash2, Check, AlertCircle, ExternalLink, Settings2, LogOut } from "lucide-react";
import { PlatformIcon } from "@/lib/platformIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveIntegrationKey, disconnectIntegration, listIntegrations } from "@/lib/api/ecos";

interface PlatformTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  apiKeyHint: string;
  supportedServices: string[];
}

const allPlatforms: PlatformTemplate[] = [
  {
    id: "buffer",
    name: "Buffer",
    icon: "buffer",
    description: "Publish to Facebook, Instagram, LinkedIn, X, YouTube, Pinterest, TikTok, and more via Buffer.",
    apiKeyLabel: "Buffer Access Token",
    apiKeyHint: "Generate at publish.buffer.com > Settings > API",
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "hootsuite",
    name: "Hootsuite",
    icon: "hootsuite",
    description: "Schedule and publish content across social networks via Hootsuite.",
    apiKeyLabel: "Hootsuite API Token",
    apiKeyHint: "Find in Hootsuite Developer > My Apps > API Key",
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "sprout-social",
    name: "Sprout Social",
    icon: "sprout social",
    description: "Enterprise social media management and publishing.",
    apiKeyLabel: "Sprout Social API Key",
    apiKeyHint: "Settings > API & Integrations",
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "later",
    name: "Later",
    icon: "later",
    description: "Visual social media planner and scheduler.",
    apiKeyLabel: "Later API Key",
    apiKeyHint: "Account Settings > Integrations > API",
    supportedServices: ["instagram", "facebook", "twitter", "pinterest", "tiktok", "linkedin"],
  },
];

interface ConnectedPlatform extends PlatformTemplate {
  isConnected: boolean;
  connectedAt?: string;
  hasKey: boolean;
}

const IntegrationsPage = () => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [editingKey, setEditingKey] = useState<{ id: string; value: string } | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const result = await listIntegrations();
    const serverIntegrations = result.integrations || [];

    // Always show buffer; merge with server data
    const merged: ConnectedPlatform[] = [];
    const bufferTemplate = allPlatforms.find((p) => p.id === "buffer")!;
    const bufferServer = serverIntegrations.find((i: any) => i.platform_id === "buffer");
    merged.push({
      ...bufferTemplate,
      isConnected: bufferServer?.is_connected || false,
      connectedAt: bufferServer?.connected_at,
      hasKey: bufferServer?.is_connected || false,
    });

    // Add other connected platforms
    for (const si of serverIntegrations) {
      if (si.platform_id === "buffer") continue;
      const template = allPlatforms.find((p) => p.id === si.platform_id);
      if (template) {
        merged.push({
          ...template,
          isConnected: si.is_connected,
          connectedAt: si.connected_at,
          hasKey: si.is_connected,
        });
      }
    }

    setPlatforms(merged);
  };

  const handleSaveKey = async (id: string) => {
    if (!editingKey || editingKey.id !== id || !editingKey.value.trim()) return;
    setSaving(id);
    const result = await saveIntegrationKey(id, editingKey.value.trim());
    setSaving(null);
    if (result.success) {
      toast({ title: "Connected", description: "API key saved securely on server." });
      setEditingKey(null);
      loadIntegrations();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDisconnect = async (id: string) => {
    const result = await disconnectIntegration(id);
    if (result.success) {
      toast({ title: "Disconnected", description: "Platform disconnected and key removed." });
      loadIntegrations();
    }
  };

  const handleAddPlatform = (tpl: PlatformTemplate) => {
    setPlatforms((prev) => {
      if (prev.some((p) => p.id === tpl.id)) return prev;
      return [...prev, { ...tpl, isConnected: false, hasKey: false }];
    });
    setShowAddPanel(false);
  };

  const availableTemplates = allPlatforms.filter(
    (t) => !platforms.some((p) => p.id === t.id)
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground mt-1">
          API keys are encrypted and stored server-side. They are never exposed to the browser.
        </p>
      </motion.div>

      <div className="space-y-4">
        {platforms.map((conn, i) => (
          <motion.div
            key={conn.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <PlatformIcon platform={conn.name} className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-semibold text-foreground">{conn.name}</h3>
                  {conn.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/50 rounded-full px-2.5 py-0.5">
                      <AlertCircle className="w-3 h-3" /> Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{conn.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{conn.apiKeyLabel}</span>
                <span className="text-xs font-mono text-primary/60 sm:ml-auto">{conn.apiKeyHint}</span>
              </div>

              {editingKey?.id === conn.id ? (
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={editingKey.value}
                    onChange={(e) => setEditingKey({ ...editingKey, value: e.target.value })}
                    placeholder="Paste your API key here"
                    className="flex-1 font-mono text-sm glass border-border"
                  />
                  <Button size="sm" onClick={() => handleSaveKey(conn.id)} disabled={saving === conn.id} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {saving === conn.id ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs font-mono glass rounded-lg px-3 py-2 text-muted-foreground">
                    {conn.hasKey ? "Key stored securely on server" : "No API key set"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingKey({ id: conn.id, value: "" })}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    {conn.hasKey ? "Replace Key" : "Add Key"}
                  </Button>
                  {conn.isConnected && (
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(conn.id)} className="text-destructive hover:text-destructive">
                      <LogOut className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-1">Supports:</span>
              {conn.supportedServices.map((s) => (
                <span key={s} className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">{s}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {!showAddPanel ? (
          <Button
            variant="outline"
            onClick={() => setShowAddPanel(true)}
            className="w-full border-dashed border-2 border-border hover:border-primary/40 py-6 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Publishing Platform
          </Button>
        ) : (
          <div className="glass rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-display font-semibold text-foreground">Add Platform</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddPanel(false)} className="text-muted-foreground">Cancel</Button>
            </div>
            {availableTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleAddPlatform(tpl)}
                    className="glass rounded-lg p-4 text-left hover:glow-primary transition-all space-y-2"
                  >
                    <PlatformIcon platform={tpl.name} className="w-5 h-5 text-muted-foreground" />
                    <h4 className="text-sm font-display font-semibold text-foreground">{tpl.name}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{tpl.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">All available platforms have been added.</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default IntegrationsPage;
