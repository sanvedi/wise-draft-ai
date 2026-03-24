import { motion } from "framer-motion";
import { ScanSearch, Image, Video, FileText, Monitor, CheckCircle2, AlertTriangle } from "lucide-react";
import { PlatformIcon } from "@/lib/platformIcons";
import type { MediaItem } from "./MultimodalInput";

interface InputAnalyzerProps {
  media: MediaItem[];
}

interface PlatformFit {
  platform: string;
  fit: "optimal" | "compatible" | "incompatible";
  reason: string;
}

const analyzePlatformFit = (item: MediaItem): PlatformFit[] => {
  const w = item.dimensions?.width || 0;
  const h = item.dimensions?.height || 0;
  const ratio = w && h ? w / h : 0;
  const dur = item.duration || 0;

  if (item.type === "image") {
    return [
      { platform: "Instagram", fit: ratio > 0.7 && ratio < 1.1 ? "optimal" : ratio > 0.5 && ratio < 2 ? "compatible" : "incompatible", reason: ratio > 0.7 && ratio < 1.1 ? "Square/portrait ideal" : "May need cropping" },
      { platform: "YouTube", fit: "incompatible", reason: "Video only" },
      { platform: "X", fit: w >= 600 ? "optimal" : "compatible", reason: w >= 600 ? "Good resolution" : "Low resolution" },
      { platform: "LinkedIn", fit: ratio > 1.5 ? "optimal" : "compatible", reason: ratio > 1.5 ? "Landscape ideal" : "Acceptable" },
      { platform: "Facebook", fit: "optimal", reason: "All formats accepted" },
      { platform: "Google Biz", fit: "optimal", reason: "Featured image ready" },
    ];
  }

  if (item.type === "video") {
    return [
      { platform: "Instagram", fit: dur <= 60 ? "optimal" : dur <= 90 ? "compatible" : "incompatible", reason: dur <= 60 ? "Reels ready" : dur > 90 ? "Too long for Reels" : "Trim recommended" },
      { platform: "YouTube", fit: "optimal", reason: dur <= 60 ? "Shorts ready" : "Long-form ready" },
      { platform: "X", fit: dur <= 140 ? "optimal" : "incompatible", reason: dur <= 140 ? "Within limit" : "Exceeds 2:20 limit" },
      { platform: "LinkedIn", fit: dur <= 600 ? "optimal" : "compatible", reason: dur <= 600 ? "Within limit" : "May need trimming" },
      { platform: "Facebook", fit: "optimal", reason: "All durations accepted" },
      { platform: "Google Biz", fit: "compatible", reason: "Update supported" },
    ];
  }

  return [
    { platform: "Instagram", fit: "incompatible", reason: "Media required" },
    { platform: "YouTube", fit: "incompatible", reason: "Video required" },
    { platform: "X", fit: "compatible", reason: "Link sharing" },
    { platform: "LinkedIn", fit: "optimal", reason: "Document sharing" },
    { platform: "Facebook", fit: "compatible", reason: "Link sharing" },
    { platform: "Google Biz", fit: "compatible", reason: "Link sharing" },
  ];
};

const fitColors = {
  optimal: "text-primary",
  compatible: "text-agent-reviewer",
  incompatible: "text-destructive",
};

const fitIcons = {
  optimal: CheckCircle2,
  compatible: AlertTriangle,
  incompatible: AlertTriangle,
};

const InputAnalyzer = ({ media }: InputAnalyzerProps) => {
  if (media.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ScanSearch className="w-4 h-4 text-agent-customizer" />
          <h3 className="text-sm font-semibold text-foreground">Input Analyzer</h3>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Upload media to analyze platform compatibility...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScanSearch className="w-4 h-4 text-agent-customizer" />
        <h3 className="text-sm font-semibold text-foreground">Input Analyzer</h3>
      </div>

      {media.map((item) => {
        const IconMap = { image: Image, video: Video, document: FileText };
        const Icon = IconMap[item.type];
        const fits = analyzePlatformFit(item);

        return (
          <motion.div
            key={item.id}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-md bg-muted/30 border border-border p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground truncate">{item.name}</span>
              <div className="ml-auto flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                {item.dimensions && (
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {item.dimensions.width}x{item.dimensions.height}
                  </span>
                )}
                {item.type === "video" && item.duration && <span>{Math.round(item.duration)}s</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {fits.map((fit) => {
                const FitIcon = fitIcons[fit.fit];
                return (
                  <div key={fit.platform} className="flex items-center gap-1.5 rounded px-1.5 py-1 bg-muted/50">
                    <PlatformIcon platform={fit.platform} className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[9px] font-mono text-muted-foreground">{fit.platform}</span>
                    <FitIcon className={`w-2.5 h-2.5 ml-auto ${fitColors[fit.fit]}`} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default InputAnalyzer;
