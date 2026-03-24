import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plug, Plus, Eye, EyeOff, Trash2, Check, AlertCircle, ExternalLink, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsStore, type PlatformConnection } from "@/lib/store/integrationsStore";

const templateConnections: Omit<PlatformConnection, "apiKey" | "isConnected">[] = [
  {
    id: "hootsuite",
    name: "Hootsuite",
    type: "custom",
    icon: "🦉",
    description: "Schedule and publish content across social networks via Hootsuite.",
    apiKeyLabel: "Hootsuite API Token",
    apiKeyHint: "Find in Hootsuite Developer → My Apps → API Key",
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "sprout-social",
    name: "Sprout Social",
    type: "custom",
    icon: "🌱",
    description: "Enterprise social media management and publishing.",
    apiKeyLabel: "Sprout Social API Key",
    apiKeyHint: "Settings → API & Integrations",
    supportedServices: ["facebook", "instagram", "linkedin", "twitter", "youtube", "pinterest", "tiktok"],
  },
  {
    id: "later",
    name: "Later",
    type: "custom",
    icon: "📅",
    description: "Visual social media planner and scheduler.",
    apiKeyLabel: "Later API Key",
    apiKeyHint: "Account Settings → Integrations → API",
    supportedServices: ["instagram", "facebook", "twitter", "pinterest", "tiktok", "linkedin"],
  },
];

const IntegrationsPage = () => {
  const { toast } = useToast();
  const store = useIntegrationsStore();
  const [showKeyFor, setShowKeyFor] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<{ id: string; value: string } | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const handleSaveKey = (id: string) => {
    if (!editingKey || editingKey.id !== id) return;
    store.setApiKey(id, editingKey.value);
    if (editingKey.value.trim()) {
      store.connectPlatform(id);
      toast({ title: "Connected", description: "API key saved and platform connected." });
    }
    setEditingKey(null);
  };

  const handleDisconnect = (id: string) => {
    store.disconnectPlatform(id);
    toast({ title: "Disconnected", description: "Platform disconnected and API key cleared." });
  };

  const handleAddTemplate = (tpl: typeof templateConnections[0]) => {
    store.addConnection({ ...tpl, apiKey: "", isConnected: false });
    setShowAddPanel(false);
    toast({ title: "Platform Added", description: `${tpl.name} added. Enter your API key to connect.` });
  };

  const handleRemove = (id: string) => {
    store.removeConnection(id);
    toast({ title: "Removed", description: "Platform removed from integrations." });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const availableTemplates = templateConnections.filter(
    (t) => !store.connections.some((c) => c.id === t.id)
  );

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your publishing platform connections. API keys are stored locally and passed securely to backend functions.
        </p>
      </motion.div>

      {/* Connected Platforms */}
      <div className="space-y-4">
        {store.connections.map((conn, i) => (
          <motion.div
            key={conn.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{conn.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-semibold text-foreground">{conn.name}</h3>
                  {conn.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      <Check className="w-2.5 h-2.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                      <AlertCircle className="w-2.5 h-2.5" /> Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{conn.description}</p>
              </div>
              {conn.id !== "buffer" && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(conn.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* API Key Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{conn.apiKeyLabel}</span>
                <a
                  href="#"
                  className="text-[9px] font-mono text-primary/60 hover:text-primary flex items-center gap-1 ml-auto"
                  title={conn.apiKeyHint}
                >
                  <ExternalLink className="w-3 h-3" /> Where to find this?
                </a>
              </div>

              {editingKey?.id === conn.id ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={editingKey.value}
                    onChange={(e) => setEditingKey({ ...editingKey, value: e.target.value })}
                    placeholder="Paste your API key here"
                    className="flex-1 font-mono text-sm glass border-border"
                  />
                  <Button size="sm" onClick={() => handleSaveKey(conn.id)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {conn.apiKey ? (
                    <>
                      <code className="flex-1 text-xs font-mono text-foreground/70 glass rounded-lg px-3 py-2">
                        {showKeyFor === conn.id ? conn.apiKey : maskKey(conn.apiKey)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeyFor(showKeyFor === conn.id ? null : conn.id)}
                        className="text-muted-foreground"
                      >
                        {showKeyFor === conn.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono glass rounded-lg px-3 py-2 flex-1">No API key set</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingKey({ id: conn.id, value: conn.apiKey })}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    {conn.apiKey ? "Change Key" : "Add Key"}
                  </Button>
                  {conn.isConnected && (
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(conn.id)} className="text-destructive hover:text-destructive">
                      Disconnect
                    </Button>
                  )}
                </div>
              )}

              <p className="text-[9px] font-mono text-muted-foreground">{conn.apiKeyHint}</p>
            </div>

            {/* Supported Services */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mr-1">Supports:</span>
              {conn.supportedServices.map((s) => (
                <span key={s} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">{s}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Platform */}
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
                    onClick={() => handleAddTemplate(tpl)}
                    className="glass rounded-lg p-4 text-left hover:glow-primary transition-all space-y-2"
                  >
                    <span className="text-2xl">{tpl.icon}</span>
                    <h4 className="text-sm font-display font-semibold text-foreground">{tpl.name}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{tpl.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">All available platforms have been added.</p>
            )}

            <p className="text-[9px] font-mono text-muted-foreground text-center">
              More platforms coming soon. Contact us to request a specific integration.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default IntegrationsPage;
