import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Upload, FileText, Check, Loader2, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ecosApi } from "@/lib/api/ecos";
import { useBrandStore } from "@/lib/store/brandStore";
import { BrandDNAEditor } from "@/components/brand/BrandDNAEditor";

interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  size: number;
}

const BrandPage = () => {
  const { toast } = useToast();
  const { brandData, fullBrandDNA, isLoading, setBrandData, setFullBrandDNA, saveBrandDNA, loadBrandDNA } = useBrandStore();
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved brand DNA on mount
  useEffect(() => {
    if (!brandData) loadBrandDNA();
  }, []);

  const handleExtract = useCallback(async () => {
    if (!url.trim()) return;
    setIsExtracting(true);
    try {
      const result = await ecosApi.extractBrandDNA(url);
      if (result.success && result.brandDNA) {
        setBrandData(result.brandDNA);
        setFullBrandDNA(result.brandDNA);
        // Save to database
        await saveBrandDNA(result.brandDNA, url);
        toast({ title: "Brand DNA Extracted & Saved", description: `Successfully analyzed ${url}` });
      } else {
        toast({ title: "Extraction Failed", description: result.error || "Could not extract brand DNA", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to extract brand DNA", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, [url, toast, setBrandData, setFullBrandDNA, saveBrandDNA]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    setDocs((prev) => [...prev, ...newDocs]);
    if (e.target) e.target.value = "";
  }, []);

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));
  const formatSize = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your brand DNA. This becomes the foundation the Reviewer agent uses for compliance checks.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* URL Extraction */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Website Crawl</h2>
            <span className="text-xs font-mono text-primary/60 bg-primary/5 rounded-full px-2.5 py-0.5 ml-auto">Firecrawl</span>
          </div>
          <p className="text-xs text-muted-foreground">Enter your website URL. We'll deep-crawl it to extract brand colors, tone, typography, and guidelines.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://your-brand.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                className="w-full pl-9 pr-3 py-2.5 glass rounded-lg text-sm text-foreground placeholder:text-muted-foreground font-mono"
              />
            </div>
            <Button
              onClick={handleExtract}
              disabled={!url.trim() || isExtracting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-lg px-5"
            >
              {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract"}
            </Button>
          </div>
        </motion.div>

        {/* File Upload */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-display font-semibold text-foreground">Upload Documents</h2>
          </div>
          <p className="text-xs text-muted-foreground">Upload brand guidelines, policy documents, brand voice docs, or style guides.</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.pptx" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2"
          >
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Drop files here or click to browse</span>
            <span className="text-[9px] font-mono text-muted-foreground">PDF, DOCX, TXT, MD, PPTX</span>
          </button>
          {docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 glass rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{doc.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{formatSize(doc.size)}</p>
                  </div>
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <button onClick={() => removeDoc(doc.id)} className="p-1 hover:bg-muted rounded"><X className="w-3 h-3 text-muted-foreground" /></button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Brand DNA Display & Editor */}
      {brandData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Brand DNA</h2>
            <span className="text-xs font-mono text-primary bg-primary/10 rounded-full px-2.5 py-0.5 ml-auto">Active</span>
          </div>
          <p className="text-xs text-muted-foreground">Click the pencil icon on any section to edit inline.</p>
          <BrandDNAEditor />
        </motion.div>
      )}
    </div>
  );
};

export default BrandPage;
