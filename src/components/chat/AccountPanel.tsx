import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X, Globe, Palette, Type, Building2, Loader2, Link2, Unlink,
  Eye, EyeOff, LogOut, User as UserIcon, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandStore } from "@/lib/store/brandStore";
import { useIntegrationsStore } from "@/lib/store/integrationsStore";
import { ecosApi, saveIntegrationKey, disconnectIntegration } from "@/lib/api/ecos";
import { useToast } from "@/hooks/use-toast";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";

interface AccountPanelProps {
  onClose: () => void;
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  const { user, signOut } = useAuth();
  const { brandData, setBrandData, setFullBrandDNA } = useBrandStore();
  const integrations = useIntegrationsStore();
  const { toast } = useToast();

  const [brandUrl, setBrandUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeSection, setActiveSection] = useState<"brand" | "integrations" | null>(null);

  // Buffer integration state
  const bufferConn = integrations.connections.find((c) => c.id === "buffer");
  const [bufferKey, setBufferKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const handleExtractBrand = useCallback(async () => {
    if (!brandUrl.trim()) return;
    setIsExtracting(true);
    try {
      const result = await ecosApi.extractBrandDNA(brandUrl.trim());
      if (result.success && result.brandDNA) {
        setBrandData(result.brandDNA);
        setFullBrandDNA(result.brandDNA);
        toast({ title: "Brand kit applied", description: `${result.brandDNA.organizationName || "Brand"} identity loaded.` });
      } else {
        toast({ title: "Extraction failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not extract brand data.", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, [brandUrl, setBrandData, setFullBrandDNA, toast]);

  const handleSaveBufferKey = useCallback(async () => {
    if (!bufferKey.trim()) return;
    setSavingKey(true);
    try {
      const result = await saveIntegrationKey("buffer", bufferKey.trim());
      if (result.success) {
        integrations.setApiKey("buffer", bufferKey.trim());
        integrations.connectPlatform("buffer");
        toast({ title: "Buffer connected", description: "Your Buffer integration is now active." });
        setBufferKey("");
        setShowKey(false);
      } else {
        toast({ title: "Connection failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not save integration.", variant: "destructive" });
    } finally {
      setSavingKey(false);
    }
  }, [bufferKey, integrations, toast]);

  const handleDisconnectBuffer = useCallback(async () => {
    try {
      await disconnectIntegration("buffer");
      integrations.disconnectPlatform("buffer");
      toast({ title: "Buffer disconnected" });
    } catch {
      toast({ title: "Error", description: "Could not disconnect.", variant: "destructive" });
    }
  }, [integrations, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
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
          <div className="p-4 border-b border-border space-y-3">
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

          {/* Brand DNA Section */}
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
                    {brandData?.organizationName || "Extract from your website"}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "brand" ? "rotate-90" : ""}`} />
            </button>

            {activeSection === "brand" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3"
              >
                {/* URL input */}
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

                {/* Brand preview */}
                {brandData && (
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    {brandData.organizationName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{brandData.organizationName}</span>
                      </div>
                    )}
                    {brandData.tagline && (
                      <p className="text-xs italic text-muted-foreground">"{brandData.tagline}"</p>
                    )}
                    {brandData.colors.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Colors</span>
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
                    {brandData.guidelines.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Guidelines</span>
                        <ul className="mt-1 space-y-0.5">
                          {brandData.guidelines.slice(0, 4).map((g, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-primary mt-0.5">•</span> {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Integrations Section */}
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
                    {bufferConn?.isConnected ? "Buffer connected" : "Connect publishing tools"}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === "integrations" ? "rotate-90" : ""}`} />
            </button>

            {activeSection === "integrations" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3"
              >
                {/* Buffer */}
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-foreground">B</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Buffer</p>
                        <p className="text-xs text-muted-foreground">Multi-platform publishing</p>
                      </div>
                    </div>
                    {bufferConn?.isConnected && (
                      <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5">
                        Connected
                      </span>
                    )}
                  </div>

                  {bufferConn?.isConnected ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground flex-1">
                        Connected {bufferConn.connectedAt ? new Date(bufferConn.connectedAt).toLocaleDateString() : ""}
                      </p>
                      <Button size="sm" variant="ghost" onClick={handleDisconnectBuffer} className="text-xs h-7 text-destructive hover:text-destructive">
                        <Unlink className="w-3 h-3 mr-1" /> Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Generate your token at publish.buffer.com → Settings → API
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKey ? "text" : "password"}
                            placeholder="Buffer access token"
                            value={bufferKey}
                            onChange={(e) => setBufferKey(e.target.value)}
                            className="text-sm h-9 pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveBufferKey}
                          disabled={!bufferKey.trim() || savingKey}
                          className="h-9 text-xs"
                        >
                          {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
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
