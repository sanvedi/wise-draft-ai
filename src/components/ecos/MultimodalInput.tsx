import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link2, Image, Video, FileText, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
  name: string;
  url: string;
  file?: File;
  thumbnail?: string;
  size?: number;
  dimensions?: { width: number; height: number };
  duration?: number;
}

interface MultimodalInputProps {
  onSubmit: (prompt: string, media: MediaItem[]) => void;
  isProcessing: boolean;
}

const MultimodalInput = ({ onSubmit, isProcessing }: MultimodalInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMediaType = (file: File): MediaItem["type"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "document";
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const item: MediaItem = {
        id: crypto.randomUUID(),
        type: getMediaType(file),
        name: file.name,
        url,
        file,
        size: file.size,
      };

      if (file.type.startsWith("image/")) {
        const img = new window.Image();
        img.onload = () => {
          setMedia((prev) =>
            prev.map((m) =>
              m.id === item.id ? { ...m, dimensions: { width: img.width, height: img.height }, thumbnail: url } : m
            )
          );
        };
        img.src = url;
        item.thumbnail = url;
      }

      if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          setMedia((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? { ...m, dimensions: { width: video.videoWidth, height: video.videoHeight }, duration: video.duration }
                : m
            )
          );
        };
        video.src = url;
      }

      setMedia((prev) => [...prev, item]);
    });
    if (e.target) e.target.value = "";
  }, []);

  const handleUrlAdd = useCallback(() => {
    if (!urlInput.trim()) return;
    const ext = urlInput.split(".").pop()?.toLowerCase() || "";
    const videoExts = ["mp4", "webm", "mov", "avi"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const type: MediaItem["type"] = videoExts.includes(ext) ? "video" : imageExts.includes(ext) ? "image" : "document";

    setMedia((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, name: urlInput.split("/").pop() || "media", url: urlInput, thumbnail: type === "image" ? urlInput : undefined },
    ]);
    setUrlInput("");
    setShowUrlInput(false);
  }, [urlInput]);

  const removeMedia = (id: string) => setMedia((prev) => prev.filter((m) => m.id !== id));

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  const iconMap = { image: Image, video: Video, document: FileText };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Upload className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Multimodal Input</h2>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{media.length} asset{media.length !== 1 ? "s" : ""}</span>
      </div>

      <Textarea
        placeholder="Describe what content you want to create. Be specific about tone, audience, and key messages..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px] bg-muted/30 border-border text-sm placeholder:text-muted-foreground resize-none"
      />

      {/* Media thumbnails */}
      <AnimatePresence>
        {media.length > 0 && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="flex flex-wrap gap-2 overflow-hidden">
            {media.map((item) => {
              const Icon = iconMap[item.type];
              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative group rounded-md border border-border bg-muted/50 overflow-hidden"
                  style={{ width: 80, height: 80 }}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[8px] font-mono text-muted-foreground truncate max-w-[70px] px-1">{item.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5">
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {item.type.toUpperCase()} {formatSize(item.size)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL input */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 overflow-hidden">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
              className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground font-mono"
            />
            <Button size="sm" onClick={handleUrlAdd} className="text-[10px] font-mono bg-primary text-primary-foreground">Add</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-2">
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.md,.txt" onChange={handleFileSelect} className="hidden" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-mono uppercase tracking-wider border-border text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3 mr-1" /> Upload
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] font-mono uppercase tracking-wider border-border text-muted-foreground hover:text-foreground"
        >
          <Link2 className="w-3 h-3 mr-1" /> URL
        </Button>
        <Button
          onClick={() => onSubmit(prompt, media)}
          disabled={!prompt.trim() || isProcessing}
          className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-[10px] uppercase tracking-wider"
        >
          {isProcessing ? "Processing..." : "Generate Content"}
        </Button>
      </div>
    </motion.div>
  );
};

export default MultimodalInput;
