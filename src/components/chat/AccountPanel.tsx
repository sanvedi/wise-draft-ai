import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Globe, Palette, Type, Building2, Loader2, Link2, Unlink,
  Eye, EyeOff, LogOut, ChevronRight, RotateCcw, Settings2,
  Plus, Upload, FileText, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandStore } from "@/lib/store/brandStore";
import { useIntegrationsStore, type PlatformConnection } from "@/lib/store/integrationsStore";
import { ecosApi, saveIntegrationKey, disconnectIntegration, listIntegrations } from "@/lib/api/ecos";
import { useToast } from "@/hooks/use-toast";

interface AccountPanelProps {
  onClose: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  buffer: "hsl(var(--primary))",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  "x-twitter": "#000000",
  youtube: "#FF0000",
  facebook: "#1877F2",
  "google-business": "#4285F4",
};

const PLATFORM_INITIALS: Record<string, string> = {
  buffer: "B",
  instagram: "IG",
  linkedin: "in",
  "x-twitter": "X",
  youtube: "YT",
  facebook: "f",
  "google-business": "G",
};

function IntegrationCard({ conn, onConnect, onDisconnect }: {
  conn: PlatformConnection;
  onConnect: (id: string, key: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(false);

  const handleConnect = async () => {
    if (!key.trim()) return;
    setSaving(true);
    await onConnect(conn.id, key.trim());
    setSaving(false);
    setKey("");
    setShowKey(false);
    setEditingKey(false);
    setExpanded(false);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-2.5 hover:bg-accent/30 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: PLATFORM_COLORS[conn.id] || "hsl(var(--primary))" }}
        >
          {PLATFORM_INITIALS[conn.id] || conn.name.charAt(0)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-foreground">{conn.name}</p>
          <p className="text-xs text-muted-foreground truncate">{conn.description}</p>
        </div>
        {conn.isConnected ? (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 flex-shrink-0">
            Active
          </span>
        ) : (
          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              {conn.isConnected && !editingKey ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Connected {conn.connectedAt ? new Date(conn.connectedAt).toLocaleDateString() : ""}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    Key stored securely on server
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="outline"
                      onClick={() => setEditingKey(true)}
                      className="text-xs h-7 gap-1"
                    >
                      <Settings2 className="w-3 h-3" /> Replace Key
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => onDisconnect(conn.id)}
                      className="text-xs h-7 text-destructive hover:text-destructive"
                    >
                      <Unlink className="w-3 h-3 mr-1" /> Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{conn.apiKeyHint}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder={conn.apiKeyLabel}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="text-sm h-8 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={handleConnect} disabled={!key.trim() || saving} className="h-8 text-xs">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : conn.isConnected ? "Update" : "Connect"}
                    </Button>
                  </div>
                  {editingKey && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingKey(false)} className="text-xs h-7 text-muted-foreground">
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  const { user, signOut } = useAuth();
  const { brandData, setBrandData, setFullBrandDNA } = useBrandStore();
  const integrations = useIntegrationsStore();
  const { toast } = useToast();

  const [brandUrl, setBrandUrl] = useState("");
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [newAdditionalUrl, setNewAdditionalUrl] = useState("");
  const [brandFiles, setBrandFiles] = useState<{ id: string; name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeSection, setActiveSection] = useState<"brand" | "integrations" | null>(null);
  const [serverLoaded, setServerLoaded] = useState(false);

  // Load integration state from server on mount
  useEffect(() => {
    const loadServerState = async () => {
      try {
        const result = await listIntegrations();
        if (result.success && result.integrations) {
          for (const si of result.integrations) {
            if (si.is_connected) {
              integrations.connectPlatform(si.platform_id);
            } else {
              integrations.disconnectPlatform(si.platform_id);
            }
          }
        }
      } catch {
        // Silent fail — local state still works
      } finally {
        setServerLoaded(true);
      }
    };
    loadServerState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connectedCount = integrations.connections.filter((c) => c.isConnected).length;

  const handleExtractBrand = useCallback(async () => {
    if (!brandUrl.trim()) return;
    setIsExtracting(true);
    try {
      // Pass additional URLs and note about files
      const allUrls = [brandUrl.trim(), ...additionalUrls.filter(u => u.trim())];
      const result = await ecosApi.extractBrandDNA(allUrls[0], allUrls.slice(1));
      if (result.success && result.brandDNA) {
        setBrandData(result.brandDNA);
        setFullBrandDNA(result.brandDNA);
        toast({ title: "Brand kit applied", description: `${result.brandDNA.organizationName || "Brand"} identity loaded and applied to the UI.` });
      } else {
        toast({ title: "Extraction failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not extract brand data.", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, [brandUrl, additionalUrls, setBrandData, setFullBrandDNA, toast]);

  const handleResetBrand = useCallback(() => {
    setBrandData(null);
    setFullBrandDNA(null);
    toast({ title: "Brand reset", description: "Reverted to default theme." });
  }, [setBrandData, setFullBrandDNA, toast]);

  const handleAddUrl = () => {
    if (newAdditionalUrl.trim()) {
      setAdditionalUrls(prev => [...prev, newAdditionalUrl.trim()]);
      setNewAdditionalUrl("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setAdditionalUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
    }));
    setBrandFiles(prev => [...prev, ...newFiles]);
    if (e.target) e.target.value = "";
  };

  const removeFile = (id: string) => setBrandFiles(prev => prev.filter(f => f.id !== id));

  const formatSize = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`;

  const handleConnect = useCallback(async (id: string, key: string) => {
    try {
      const result = await saveIntegrationKey(id, key);
      if (result.success) {
        integrations.setApiKey(id, "••••••••");
        integrations.connectPlatform(id);
        const conn = integrations.connections.find((c) => c.id === id);
        toast({ title: `${conn?.name || "Platform"} connected`, description: "Key encrypted and stored securely." });
      } else {
        toast({ title: "Connection failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not save integration.", variant: "destructive" });
    }
  }, [integrations, toast]);

  const handleDisconnect = useCallback(async (id: string) => {
    try {
      await disconnectIntegration(id);
      integrations.disconnectPlatform(id);
      const conn = integrations.connections.find((c) => c.id === id);
      toast({ title: `${conn?.name || "Platform"} disconnected` });
    } catch {
      toast({ title: "Error", description: "Could not disconnect.", variant: "destructive" });
    }
  }, [integrations, toast]);

  const publishingTools = integrations.connections.filter((c) => c.type === "buffer");
  const directPlatforms = integrations.connections.filter((c) => c.type === "direct");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-80 max-w-[90vw] h-full bg-card border-r border-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-display font-semibold text-foreground">Account</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "recently"}
                </p>
              </div>
            </div>
          </div>

          {/* Brand DNA */}
          <div className="border-b border-border">
            <button
              onClick={() => setActiveSection(activeSection === "brand" ? null : "brand")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Brand DNA</p>
                  <p className="text-xs text-muted-foreground">
                    {brandData?.organizationName || "Extract & apply to UI"}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "brand" ? "rotate-90" : ""}`} />
            </button>

            {activeSection === "brand" && (
              <div className="px-4 pb-4 space-y-3">
                {/* Primary URL */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                      className="pl-8 text-sm h-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleExtractBrand}
                    disabled={!brandUrl.trim() || isExtracting}
                    className="h-9 text-xs"
                  >
                    {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Extract"}
                  </Button>
                </div>

                {/* Additional URLs */}
                {additionalUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{url}</span>
                    <button onClick={() => handleRemoveUrl(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Add another URL..."
                    value={newAdditionalUrl}
                    onChange={(e) => setNewAdditionalUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                    className="text-xs h-7 flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleAddUrl} disabled={!newAdditionalUrl.trim()} className="h-7 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* File Upload */}
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.pptx" onChange={handleFileUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-lg border border-dashed border-border hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload brand docs</span>
                </button>

                {brandFiles.length > 0 && (
                  <div className="space-y-1">
                    {brandFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 rounded px-2 py-1 bg-muted/30">
                        <FileText className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                        <span className="text-[9px] text-muted-foreground">{formatSize(f.size)}</span>
                        <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {brandData && (
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      {brandData.organizationName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{brandData.organizationName}</span>
                        </div>
                      )}
                      <Button size="sm" variant="ghost" onClick={handleResetBrand} className="h-7 text-xs text-muted-foreground gap-1">
                        <RotateCcw className="w-3 h-3" /> Reset
                      </Button>
                    </div>
                    {brandData.tagline && (
                      <p className="text-xs italic text-muted-foreground">"{brandData.tagline}"</p>
                    )}
                    {brandData.colors.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Colors (applied to UI)</span>
                        <div className="flex gap-1.5 mt-1">
                          {brandData.colors.map((c) => (
                            <div key={c.hex} className="flex flex-col items-center gap-0.5">
                              <div className="w-7 h-7 rounded-md border border-border" style={{ backgroundColor: c.hex }} />
                              <span className="text-[9px] text-muted-foreground">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {brandData.fonts.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Typography</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {brandData.fonts.map((f) => (
                            <span key={f} className="text-xs px-2 py-0.5 rounded bg-muted text-foreground flex items-center gap-1">
                              <Type className="w-3 h-3" /> {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Tone</span>
                      <p className="text-xs text-foreground mt-0.5">{brandData.tone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Integrations */}
          <div className="border-b border-border">
            <button
              onClick={() => setActiveSection(activeSection === "integrations" ? null : "integrations")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Integrations</p>
                  <p className="text-xs text-muted-foreground">
                    {connectedCount > 0 ? `${connectedCount} connected` : "Connect publishing tools"}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "integrations" ? "rotate-90" : ""}`} />
            </button>

            {activeSection === "integrations" && (
              <div className="px-4 pb-4 space-y-4">
                {!serverLoaded && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {/* Publishing Tools */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Publishing Tools</p>
                  {publishingTools.map((conn) => (
                    <IntegrationCard
                      key={conn.id}
                      conn={conn}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  ))}
                </div>

                {/* Direct Platform Connections */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct Platforms</p>
                  {directPlatforms.map((conn) => (
                    <IntegrationCard
                      key={conn.id}
                      conn={conn}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
