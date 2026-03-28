import { useState } from "react";
import {
  Pencil, Plus, X, Trash2, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/lib/store/brandStore";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";
import { useToast } from "@/hooks/use-toast";
import { BrandColorPicker } from "./BrandColorPicker";

export function BrandDNAEditor() {
  const { brandData, setBrandData, setFullBrandDNA } = useBrandStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);

  // Temp state for each editable section
  const [editOrgName, setEditOrgName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editTone, setEditTone] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editGuidelines, setEditGuidelines] = useState<string[]>([]);
  const [editFonts, setEditFonts] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<{ name: string; hex: string }[]>([]);
  const [editOfferings, setEditOfferings] = useState<string[]>([]);

  // New item inputs
  const [newGuideline, setNewGuideline] = useState("");
  const [newFont, setNewFont] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newOffering, setNewOffering] = useState("");

  if (!brandData) return null;

  const startEdit = (section: string) => {
    setEditOrgName(brandData.organizationName || "");
    setEditTagline(brandData.tagline || "");
    setEditTone(brandData.tone || "");
    setEditSummary(brandData.websiteSummary || "");
    setEditGuidelines([...brandData.guidelines]);
    setEditFonts([...brandData.fonts]);
    setEditColors(brandData.colors.map(c => ({ ...c })));
    setEditOfferings([...(brandData.keyOfferings || [])]);
    setEditing(section);
  };

  const saveEdit = (section: string) => {
    const updated: BrandDNA = { ...brandData };
    switch (section) {
      case "identity":
        updated.organizationName = editOrgName;
        updated.tagline = editTagline;
        updated.websiteSummary = editSummary;
        break;
      case "colors":
        updated.colors = editColors;
        break;
      case "fonts":
        updated.fonts = editFonts;
        break;
      case "tone":
        updated.tone = editTone;
        break;
      case "offerings":
        updated.keyOfferings = editOfferings;
        break;
      case "guidelines":
        updated.guidelines = editGuidelines;
        break;
    }
    setBrandData(updated);
    setFullBrandDNA(updated);
    setEditing(null);
    toast({ title: "Brand DNA updated", description: `${section.charAt(0).toUpperCase() + section.slice(1)} saved.` });
  };

  const cancelEdit = () => setEditing(null);

  const SectionHeader = ({ label, section }: { label: string; section: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      {editing !== section ? (
        <button onClick={() => startEdit(section)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5">
          <Pencil className="w-3 h-3" />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button onClick={() => saveEdit(section)} className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/5">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={cancelEdit} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Identity: Org Name, Tagline, Summary */}
      <div className="space-y-2">
        <SectionHeader label="Identity" section="identity" />
        {editing === "identity" ? (
          <div className="space-y-2">
            <Input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} placeholder="Organization Name" className="text-sm h-9" />
            <Input value={editTagline} onChange={e => setEditTagline(e.target.value)} placeholder="Tagline" className="text-sm h-9" />
            <Textarea value={editSummary} onChange={e => setEditSummary(e.target.value)} placeholder="Website summary..." className="text-sm min-h-[60px]" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {brandData.organizationName && (
              <p className="text-lg font-display font-bold text-foreground">{brandData.organizationName}</p>
            )}
            {brandData.tagline && (
              <p className="text-sm italic text-foreground/80">"{brandData.tagline}"</p>
            )}
            {brandData.websiteSummary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{brandData.websiteSummary}</p>
            )}
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <SectionHeader label="Colors" section="colors" />
        {editing === "colors" ? (
          <BrandColorPicker colors={editColors} onChange={setEditColors} />
        ) : (
          <div className="flex gap-2 flex-wrap">
            {brandData.colors.map(c => (
              <div key={c.hex} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-mono text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Typography */}
      <div className="space-y-2">
        <SectionHeader label="Typography" section="fonts" />
        {editing === "fonts" ? (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {editFonts.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 glass rounded-lg px-2 py-1">
                  <Input value={f} onChange={e => {
                    const updated = [...editFonts];
                    updated[i] = e.target.value;
                    setEditFonts(updated);
                  }} className="w-28 text-xs h-6 px-1.5" />
                  <button onClick={() => setEditFonts(editFonts.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input value={newFont} onChange={e => setNewFont(e.target.value)} placeholder="Font name" className="text-xs h-7 w-36" />
              <Button size="sm" variant="ghost" onClick={() => {
                if (newFont.trim()) { setEditFonts([...editFonts, newFont.trim()]); setNewFont(""); }
              }} className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {brandData.fonts.map(f => (
              <span key={f} className="text-xs font-mono px-3 py-1 glass rounded-lg text-foreground">{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <SectionHeader label="Brand Tone" section="tone" />
        {editing === "tone" ? (
          <Textarea value={editTone} onChange={e => setEditTone(e.target.value)} placeholder="Describe the brand tone..." className="text-sm min-h-[60px]" />
        ) : (
          <p className="text-sm text-foreground">{brandData.tone}</p>
        )}
      </div>

      {/* Key Offerings */}
      <div className="space-y-2">
        <SectionHeader label="Key Offerings" section="offerings" />
        {editing === "offerings" ? (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {editOfferings.map((o, i) => (
                <div key={i} className="flex items-center gap-1.5 glass rounded-lg px-2 py-1">
                  <Input value={o} onChange={e => {
                    const updated = [...editOfferings];
                    updated[i] = e.target.value;
                    setEditOfferings(updated);
                  }} className="w-32 text-xs h-6 px-1.5" />
                  <button onClick={() => setEditOfferings(editOfferings.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input value={newOffering} onChange={e => setNewOffering(e.target.value)} placeholder="New offering" className="text-xs h-7 w-36" />
              <Button size="sm" variant="ghost" onClick={() => {
                if (newOffering.trim()) { setEditOfferings([...editOfferings, newOffering.trim()]); setNewOffering(""); }
              }} className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        ) : (
          (brandData.keyOfferings && brandData.keyOfferings.length > 0) ? (
            <div className="flex gap-2 flex-wrap">
              {brandData.keyOfferings.map((o, i) => (
                <span key={i} className="text-xs font-mono px-3 py-1 rounded-lg bg-primary/10 text-primary">{o}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None set — click edit to add</p>
          )
        )}
      </div>

      {/* Guidelines */}
      <div className="space-y-2">
        <SectionHeader label="Content Guidelines" section="guidelines" />
        {editing === "guidelines" ? (
          <div className="space-y-2">
            {editGuidelines.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={g} onChange={e => {
                  const updated = [...editGuidelines];
                  updated[i] = e.target.value;
                  setEditGuidelines(updated);
                }} className="flex-1 text-xs h-8" />
                <button onClick={() => setEditGuidelines(editGuidelines.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input value={newGuideline} onChange={e => setNewGuideline(e.target.value)} placeholder="Add a guideline..." className="flex-1 text-xs h-7"
                onKeyDown={e => { if (e.key === "Enter" && newGuideline.trim()) { setEditGuidelines([...editGuidelines, newGuideline.trim()]); setNewGuideline(""); } }}
              />
              <Button size="sm" variant="ghost" onClick={() => {
                if (newGuideline.trim()) { setEditGuidelines([...editGuidelines, newGuideline.trim()]); setNewGuideline(""); }
              }} className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {brandData.guidelines.map((g, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {g}
              </li>
            ))}
            {brandData.guidelines.length === 0 && (
              <p className="text-xs text-muted-foreground italic">None set — click edit to add</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
