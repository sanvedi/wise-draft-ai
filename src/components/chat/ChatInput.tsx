import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";

const PLATFORMS = [
  { id: "Instagram", label: "Instagram" },
  { id: "LinkedIn", label: "LinkedIn" },
  { id: "X", label: "X (Twitter)" },
  { id: "Facebook", label: "Facebook" },
  { id: "YouTube", label: "YouTube" },
  { id: "Google Business", label: "Google Business" },
];

interface ChatInputProps {
  onSend: (prompt: string, platforms: string[], files: File[]) => void;
  disabled: boolean;
  brandWebsite?: string | null;
  onBrandLoad?: (url: string) => void;
}

export function ChatInput({ onSend, disabled, brandWebsite, onBrandLoad }: ChatInputProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LinkedIn", "X"]);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [brandUrl, setBrandUrl] = useState(brandWebsite || "");
  const [showBrand, setShowBrand] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSend = useCallback(() => {
    if (!prompt.trim() || disabled) return;
    onSend(prompt.trim(), selectedPlatforms, files);
    setPrompt("");
    setFiles([]);
  }, [prompt, selectedPlatforms, files, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Platform selector */}
        <AnimatePresence>
          {showPlatforms && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pb-2">
                {PLATFORMS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPlatforms.includes(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    <span className="text-sm text-foreground">{p.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand URL */}
        <AnimatePresence>
          {showBrand && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2">
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => { if (brandUrl.trim() && onBrandLoad) onBrandLoad(brandUrl.trim()); setShowBrand(false); }}
                  disabled={!brandUrl.trim()}
                >
                  Apply Brand
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground">
                {f.name}
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-1.5">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showPlatforms ? "text-primary" : "text-muted-foreground"} hover:text-foreground`}
              onClick={() => setShowPlatforms(!showPlatforms)}
              title="Select platforms"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showBrand ? "text-primary" : "text-muted-foreground"} hover:text-foreground`}
              onClick={() => setShowBrand(!showBrand)}
              title="Brand kit"
            >
              <Globe className="w-4 h-4" />
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What content would you like to create?"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-1.5 max-h-32"
            style={{ minHeight: "36px" }}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!prompt.trim() || disabled}
            className="h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {selectedPlatforms.length > 0 && `Generating for: ${selectedPlatforms.join(", ")}`}
        </p>
      </div>
    </div>
  );
}
