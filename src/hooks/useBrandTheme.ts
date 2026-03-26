import { useEffect } from "react";
import { useBrandStore } from "@/lib/store/brandStore";

/**
 * Converts a hex color to HSL values string (e.g. "165 60% 40%")
 */
function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adjustLightness(hsl: string, amount: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;
  const h = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  const l = Math.min(100, Math.max(0, parseInt(parts[3]) + amount));
  return `${h} ${s}% ${l}%`;
}

/**
 * Hook that applies brand colors to CSS custom properties when brand data changes.
 * Call this once at the app root level.
 */
export function useBrandTheme() {
  const { brandData } = useBrandStore();

  useEffect(() => {
    const root = document.documentElement;

    if (!brandData || brandData.colors.length === 0) {
      // Remove brand overrides — revert to defaults
      root.removeAttribute("data-brand-active");
      const props = [
        "--primary", "--primary-foreground", "--ring",
        "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
      ];
      props.forEach((p) => root.style.removeProperty(p));
      return;
    }

    // Find primary color (first color, or one named "primary"/"main"/"brand")
    const primaryColor = brandData.colors.find((c) =>
      /primary|main|brand/i.test(c.name)
    ) || brandData.colors[0];

    if (!primaryColor?.hex) return;

    const primaryHSL = hexToHSL(primaryColor.hex);

    // Determine if primary is light or dark to set foreground
    const parts = primaryHSL.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    const lightness = parts ? parseInt(parts[3]) : 50;
    const foregroundHSL = lightness > 55 ? "225 20% 5%" : "0 0% 100%";

    // Apply primary
    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--primary-foreground", foregroundHSL);
    root.style.setProperty("--ring", primaryHSL);

    // Sidebar
    root.style.setProperty("--sidebar-primary", primaryHSL);
    root.style.setProperty("--sidebar-primary-foreground", foregroundHSL);
    root.style.setProperty("--sidebar-ring", primaryHSL);

    // If there's a secondary/accent color, apply it
    const accentColor = brandData.colors.find((c) =>
      /accent|secondary|highlight/i.test(c.name)
    ) || brandData.colors[1];

    if (accentColor?.hex && accentColor.hex !== primaryColor.hex) {
      const accentHSL = hexToHSL(accentColor.hex);
      // Use accent color subtly in gradient
      root.style.setProperty("--brand-accent", accentHSL);
    }

    // Update gradient text class
    const gradientStyle = document.getElementById("brand-gradient-style");
    if (gradientStyle) gradientStyle.remove();

    const style = document.createElement("style");
    style.id = "brand-gradient-style";

    const accentHex = accentColor?.hex && accentColor.hex !== primaryColor.hex
      ? accentColor.hex
      : primaryColor.hex;

    style.textContent = `.text-gradient { background: linear-gradient(135deg, ${primaryColor.hex}, ${accentHex}) !important; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }`;
    document.head.appendChild(style);

    root.setAttribute("data-brand-active", "true");

    return () => {
      const s = document.getElementById("brand-gradient-style");
      if (s) s.remove();
    };
  }, [brandData]);
}
