import { useEffect } from "react";
import { useTheme } from "next-themes";
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

function parseLightness(hsl: string): number {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  return parts ? parseInt(parts[3]) : 50;
}

/**
 * Hook that applies brand colors to CSS custom properties when brand data or theme changes.
 * Adapts colors for both light and dark modes.
 */
export function useBrandTheme() {
  const { brandData } = useBrandStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    if (!brandData || brandData.colors.length === 0) {
      // Remove brand overrides — revert to defaults
      root.removeAttribute("data-brand-active");
      const props = [
        "--primary", "--primary-foreground", "--ring",
        "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
        "--accent", "--accent-foreground",
      ];
      props.forEach((p) => root.style.removeProperty(p));
      root.style.removeProperty("--font-brand-heading");
      root.style.removeProperty("--font-brand-body");

      // Remove dynamically loaded brand font links
      document.querySelectorAll("link[data-brand-font]").forEach((el) => el.remove());
      return;
    }

    // ── Fonts ──
    const fonts = brandData.fonts || [];
    document.querySelectorAll("link[data-brand-font]").forEach((el) => el.remove());

    if (fonts.length > 0) {
      const families = fonts.map((f) => f.replace(/ /g, "+")).join("&family=");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      link.setAttribute("data-brand-font", "true");
      document.head.appendChild(link);

      root.style.setProperty("--font-brand-heading", `"${fonts[0]}", sans-serif`);
      root.style.setProperty("--font-brand-body", `"${fonts[fonts.length > 1 ? 1 : 0]}", sans-serif`);
    }

    // ── Colors ──
    const primaryColor = brandData.colors.find((c) =>
      /primary|main|brand/i.test(c.name)
    ) || brandData.colors[0];

    if (!primaryColor?.hex) return;

    const baseHSL = hexToHSL(primaryColor.hex);
    const baseLightness = parseLightness(baseHSL);

    // Adapt primary for the current mode:
    // In light mode, ensure primary is dark enough for good contrast on white
    // In dark mode, ensure primary is bright enough for good contrast on dark bg
    let primaryHSL: string;
    if (isDark) {
      primaryHSL = baseLightness < 40 ? adjustLightness(baseHSL, 15) : baseHSL;
    } else {
      primaryHSL = baseLightness > 60 ? adjustLightness(baseHSL, -15) : baseHSL;
    }

    // Foreground: white text on dark primary, dark text on light primary
    const adjustedLightness = parseLightness(primaryHSL);
    const foregroundHSL = adjustedLightness > 55 ? "225 20% 5%" : "0 0% 100%";

    // Apply primary
    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--primary-foreground", foregroundHSL);
    root.style.setProperty("--ring", primaryHSL);

    // Sidebar
    root.style.setProperty("--sidebar-primary", primaryHSL);
    root.style.setProperty("--sidebar-primary-foreground", foregroundHSL);
    root.style.setProperty("--sidebar-ring", primaryHSL);

    // Accent color
    const accentColor = brandData.colors.find((c) =>
      /accent|secondary|highlight/i.test(c.name)
    ) || brandData.colors[1];

    if (accentColor?.hex && accentColor.hex !== primaryColor.hex) {
      const accentBaseHSL = hexToHSL(accentColor.hex);
      const accentLightness = parseLightness(accentBaseHSL);
      let accentHSL: string;
      if (isDark) {
        accentHSL = accentLightness < 30 ? adjustLightness(accentBaseHSL, 10) : accentBaseHSL;
      } else {
        accentHSL = accentLightness > 70 ? adjustLightness(accentBaseHSL, -10) : accentBaseHSL;
      }
      root.style.setProperty("--accent", accentHSL);
      // Accent foreground: ensure readability
      const accentFgLightness = parseLightness(accentHSL);
      root.style.setProperty("--accent-foreground", accentFgLightness > 55 ? "225 20% 5%" : "0 0% 100%");
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
  }, [brandData, resolvedTheme]);
}
