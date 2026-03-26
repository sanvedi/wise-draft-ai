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
  socialMediaAnalysis?: string;
  contentThemes?: string[];
  hashtagStrategy?: string[];
  socialProfiles?: Record<string, string>;
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
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-agent-customizer" />
        <h3 className="text-sm font-semibold text-foreground">Brand DNA</h3>
        <span className="text-xs font-mono text-muted-foreground ml-auto px-2 py-0.5 rounded bg-muted">Deep Crawl</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="url"
            placeholder="https://brand-website.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground font-mono"
          />
        </div>
        <Button
          size="sm"
          onClick={() => onExtract(url)}
          disabled={!url.trim() || isExtracting}
          className="text-xs bg-primary text-primary-foreground"
        >
          {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Extract"}
        </Button>
      </div>

      {brandData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-border">
          {brandData.organizationName && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{brandData.organizationName}</span>
            </div>
          )}

          {brandData.websiteSummary && (
            <p className="text-xs text-muted-foreground leading-relaxed">{brandData.websiteSummary}</p>
          )}

          {brandData.tagline && (
            <p className="text-xs italic text-foreground/80">"{brandData.tagline}"</p>
          )}

          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Colors</span>
            <div className="flex gap-2 mt-1.5">
              {brandData.colors.map((c) => (
                <div key={c.hex} className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] font-mono text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Typography</span>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {brandData.fonts.map((f) => (
                <span key={f} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-foreground flex items-center gap-1">
                  <Type className="w-3 h-3" /> {f}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Brand Tone</span>
            <p className="text-xs text-foreground mt-0.5">{brandData.tone}</p>
          </div>

          {brandData.keyOfferings && brandData.keyOfferings.length > 0 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Key Offerings</span>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {brandData.keyOfferings.map((o, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-primary/10 text-primary">{o}</span>
                ))}
              </div>
            </div>
          )}

          {brandData.contentThemes && brandData.contentThemes.length > 0 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Content Themes</span>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {brandData.contentThemes.map((t, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-agent-customizer/10 text-agent-customizer">{t}</span>
                ))}
              </div>
            </div>
          )}

          {brandData.hashtagStrategy && brandData.hashtagStrategy.length > 0 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Hashtag Strategy</span>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {brandData.hashtagStrategy.map((h, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-primary/10 text-primary">{h}</span>
                ))}
              </div>
            </div>
          )}

          {brandData.socialMediaAnalysis && (
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Social Media Analysis</span>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{brandData.socialMediaAnalysis}</p>
            </div>
          )}

          {brandData.socialProfiles && Object.keys(brandData.socialProfiles).length > 0 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Social Profiles</span>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {Object.entries(brandData.socialProfiles).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono px-2 py-0.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 capitalize">
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Content Guidelines</span>
            <ul className="mt-1.5 space-y-1">
              {brandData.guidelines.map((g, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
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
