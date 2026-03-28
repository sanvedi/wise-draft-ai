import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BrandColor {
  name: string;
  hex: string;
}

interface BrandColorPickerProps {
  colors: BrandColor[];
  onChange: (colors: BrandColor[]) => void;
}

// ── Preset palettes ──
const PRESET_PALETTES: { name: string; colors: BrandColor[] }[] = [
  {
    name: "Ocean",
    colors: [
      { name: "Deep Sea", hex: "#0D47A1" },
      { name: "Azure", hex: "#1976D2" },
      { name: "Sky", hex: "#42A5F5" },
      { name: "Foam", hex: "#BBDEFB" },
      { name: "Sand", hex: "#FFF8E1" },
    ],
  },
  {
    name: "Sunset",
    colors: [
      { name: "Ember", hex: "#BF360C" },
      { name: "Coral", hex: "#FF5722" },
      { name: "Amber", hex: "#FF9800" },
      { name: "Gold", hex: "#FFC107" },
      { name: "Cream", hex: "#FFF3E0" },
    ],
  },
  {
    name: "Forest",
    colors: [
      { name: "Pine", hex: "#1B5E20" },
      { name: "Moss", hex: "#388E3C" },
      { name: "Sage", hex: "#81C784" },
      { name: "Mint", hex: "#C8E6C9" },
      { name: "Earth", hex: "#4E342E" },
    ],
  },
  {
    name: "Royal",
    colors: [
      { name: "Indigo", hex: "#283593" },
      { name: "Violet", hex: "#7C4DFF" },
      { name: "Mauve", hex: "#CE93D8" },
      { name: "Blush", hex: "#F3E5F5" },
      { name: "Charcoal", hex: "#212121" },
    ],
  },
  {
    name: "Monochrome",
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Graphite", hex: "#424242" },
      { name: "Slate", hex: "#757575" },
      { name: "Silver", hex: "#BDBDBD" },
      { name: "White", hex: "#FAFAFA" },
    ],
  },
  {
    name: "Warm Minimal",
    colors: [
      { name: "Espresso", hex: "#3E2723" },
      { name: "Terracotta", hex: "#D84315" },
      { name: "Peach", hex: "#FFAB91" },
      { name: "Linen", hex: "#FBE9E7" },
      { name: "Ivory", hex: "#FFFDE7" },
    ],
  },
];

// ── Contrast helpers (WCAG 2.1) ──
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

type WCAGLevel = "AAA" | "AA" | "Fail";

function getWCAGLevel(ratio: number, large = false): WCAGLevel {
  if (large) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

function levelColor(level: WCAGLevel): string {
  if (level === "AAA") return "text-emerald-600 dark:text-emerald-400";
  if (level === "AA") return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function levelBg(level: WCAGLevel): string {
  if (level === "AAA") return "bg-emerald-500/10";
  if (level === "AA") return "bg-amber-500/10";
  return "bg-destructive/10";
}

export function BrandColorPicker({ colors, onChange }: BrandColorPickerProps) {
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [showPalettes, setShowPalettes] = useState(false);
  const [showContrast, setShowContrast] = useState(false);
  const [contrastFg, setContrastFg] = useState(0);
  const [contrastBg, setContrastBg] = useState(colors.length > 1 ? 1 : 0);

  const updateColor = (i: number, update: Partial<BrandColor>) => {
    const updated = colors.map((c, j) => j === i ? { ...c, ...update } : c);
    onChange(updated);
  };

  const removeColor = (i: number) => {
    onChange(colors.filter((_, j) => j !== i));
    // Reset contrast indices if needed
    if (contrastFg >= colors.length - 1) setContrastFg(0);
    if (contrastBg >= colors.length - 1) setContrastBg(Math.min(1, colors.length - 2));
  };

  const addColor = () => {
    if (newName.trim()) {
      onChange([...colors, { name: newName.trim(), hex: newHex }]);
      setNewName("");
      setNewHex("#000000");
    }
  };

  const applyPalette = (palette: BrandColor[]) => {
    onChange(palette.map(c => ({ ...c })));
    setShowPalettes(false);
    setContrastFg(0);
    setContrastBg(Math.min(1, palette.length - 1));
  };

  const fgColor = colors[contrastFg];
  const bgColor = colors[contrastBg];
  const ratio = fgColor && bgColor ? contrastRatio(fgColor.hex, bgColor.hex) : 1;
  const normalLevel = getWCAGLevel(ratio);
  const largeLevel = getWCAGLevel(ratio, true);

  return (
    <div className="space-y-3">
      {/* Current colors */}
      <div className="flex gap-2 flex-wrap">
        {colors.map((c, i) => (
          <div key={i} className="group relative flex flex-col items-center gap-1">
            <div className="relative">
              <label className="block w-11 h-11 rounded-lg border-2 border-border cursor-pointer overflow-hidden hover:border-primary/50 transition-colors">
                <input
                  type="color"
                  value={c.hex}
                  onChange={e => updateColor(i, { hex: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: c.hex }} />
              </label>
              <button
                onClick={() => removeColor(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
            <input
              value={c.name}
              onChange={e => updateColor(i, { name: e.target.value })}
              className="w-16 text-center text-[10px] font-mono text-muted-foreground bg-transparent border-none outline-none focus:text-foreground"
            />
            <span className="text-[9px] font-mono text-muted-foreground/60">{c.hex.toUpperCase()}</span>
          </div>
        ))}

        {/* Add color button */}
        <div className="flex flex-col items-center gap-1">
          <label className="block w-11 h-11 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors overflow-hidden relative">
            <input
              type="color"
              value={newHex}
              onChange={e => setNewHex(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: newHex + "30" }}>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
          </label>
          <div className="flex items-center gap-1">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addColor()}
              placeholder="Name"
              className="w-16 text-[10px] h-5 px-1 text-center border-none bg-muted/30"
            />
          </div>
          {newName.trim() && (
            <button onClick={addColor} className="text-primary hover:text-primary/80">
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Palettes */}
      <div>
        <button
          onClick={() => setShowPalettes(!showPalettes)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showPalettes ? "rotate-180" : ""}`} />
          Preset Palettes
        </button>
        <AnimatePresence>
          {showPalettes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pt-2">
                {PRESET_PALETTES.map(palette => (
                  <button
                    key={palette.name}
                    onClick={() => applyPalette(palette.colors)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className="flex -space-x-1">
                      {palette.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border-2 border-card"
                          style={{ backgroundColor: c.hex, zIndex: palette.colors.length - i }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-foreground">{palette.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contrast Ratio Checker */}
      {colors.length >= 2 && (
        <div>
          <button
            onClick={() => setShowContrast(!showContrast)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showContrast ? "rotate-180" : ""}`} />
            Contrast Checker
          </button>
          <AnimatePresence>
            {showContrast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-3">
                  {/* Pair selector */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Text</span>
                      <div className="flex gap-1 flex-wrap">
                        {colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setContrastFg(i)}
                            className={`w-7 h-7 rounded-md border-2 transition-all ${contrastFg === i ? "border-primary scale-110" : "border-border hover:border-primary/30"}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs">on</div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Background</span>
                      <div className="flex gap-1 flex-wrap">
                        {colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setContrastBg(i)}
                            className={`w-7 h-7 rounded-md border-2 transition-all ${contrastBg === i ? "border-primary scale-110" : "border-border hover:border-primary/30"}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview + ratio */}
                  {fgColor && bgColor && (
                    <div className="space-y-2">
                      <div
                        className="rounded-lg p-4 border border-border"
                        style={{ backgroundColor: bgColor.hex }}
                      >
                        <p className="text-lg font-display font-bold" style={{ color: fgColor.hex }}>
                          Sample Heading
                        </p>
                        <p className="text-sm mt-1" style={{ color: fgColor.hex }}>
                          Body text preview for contrast check.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-center">
                          <p className="text-xl font-mono font-bold text-foreground">{ratio.toFixed(2)}:1</p>
                          <span className="text-[10px] text-muted-foreground">Contrast Ratio</span>
                        </div>
                        <div className="flex gap-2">
                          <div className={`rounded-md px-2.5 py-1.5 ${levelBg(normalLevel)}`}>
                            <p className={`text-xs font-bold ${levelColor(normalLevel)}`}>{normalLevel}</p>
                            <span className="text-[9px] text-muted-foreground">Normal text</span>
                          </div>
                          <div className={`rounded-md px-2.5 py-1.5 ${levelBg(largeLevel)}`}>
                            <p className={`text-xs font-bold ${levelColor(largeLevel)}`}>{largeLevel}</p>
                            <span className="text-[9px] text-muted-foreground">Large text</span>
                          </div>
                        </div>
                        {normalLevel === "Fail" && (
                          <div className="flex items-center gap-1 text-destructive text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Poor readability</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
