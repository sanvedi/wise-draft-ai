import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Palette, Type, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BrandDNA {
  organizationName?: string;
  tagline?: string;
  colors: { name: string; hex: string }[];
  fonts: string[];
  tone: string;
  logo?: string;
  guidelines: string[];
  keyOfferings?: string[];
  websiteSummary?: string;
}

interface BrandDNAPanelProps {
  brandData: BrandDNA | null;
  onExtract: (url: string) => void;
  isExtracting: boolean;
}

const BrandDNAPanel = ({ brandData, onExtract, isExtracting }: BrandDNAPanelProps) => {
  const [url, setUrl] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-agent-customizer" />
        <h3 className="text-sm font-semibold text-foreground">Brand DNA</h3>
        <span className="text-[9px] font-mono text-muted-foreground ml-auto px-1.5 py-0.5 rounded bg-muted">Deep Crawl</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="url"
            placeholder="https://brand-website.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-muted/30 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground font-mono"
          />
        </div>
        <Button
          size="sm"
          onClick={() => onExtract(url)}
          disabled={!url.trim() || isExtracting}
          className="text-[10px] font-mono uppercase bg-primary text-primary-foreground"
        >
          {isExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Extract"}
        </Button>
      </div>

      {brandData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-border">
          {/* Organization Name */}
          {brandData.organizationName && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{brandData.organizationName}</span>
            </div>
          )}

          {/* Summary */}
          {brandData.websiteSummary && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">{brandData.websiteSummary}</p>
          )}

          {/* Tagline */}
          {brandData.tagline && (
            <p className="text-[10px] italic text-foreground/80">"{brandData.tagline}"</p>
          )}

          {/* Colors */}
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Colors</span>
            <div className="flex gap-1.5 mt-1">
              {brandData.colors.map((c) => (
                <div key={c.hex} className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-md border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-[8px] font-mono text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Typography</span>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {brandData.fonts.map((f) => (
                <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground flex items-center gap-1">
                  <Type className="w-2.5 h-2.5" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Brand Tone</span>
            <p className="text-xs text-foreground mt-0.5">{brandData.tone}</p>
          </div>

          {/* Key Offerings */}
          {brandData.keyOfferings && brandData.keyOfferings.length > 0 && (
            <div>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Key Offerings</span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {brandData.keyOfferings.map((o, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">{o}</span>
                ))}
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Content Guidelines</span>
            <ul className="mt-1 space-y-0.5">
              {brandData.guidelines.map((g, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span> {g}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BrandDNAPanel;
