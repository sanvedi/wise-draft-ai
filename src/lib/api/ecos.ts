import { supabase } from "@/integrations/supabase/client";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags?: string[];
  suggestedMediaPlacement?: string;
}

interface ContentGenerationResult {
  success: boolean;
  contents: GeneratedContent[];
  reviewNotes: string;
  complianceScore: number;
  error?: string;
}

interface BrandDNAResult {
  success: boolean;
  brandDNA?: BrandDNA & { values?: string[]; targetAudience?: string; personality?: string };
  error?: string;
}

export const ecosApi = {
  async extractBrandDNA(url: string): Promise<BrandDNAResult> {
    const { data, error } = await supabase.functions.invoke("extract-brand-dna", {
      body: { url },
    });

    if (error) {
      console.error("Brand DNA extraction error:", error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    // Map to BrandDNA interface
    const raw = data.brandDNA;
    const brandDNA: BrandDNA & { values?: string[]; targetAudience?: string; personality?: string } = {
      colors: raw.colors || [],
      fonts: raw.fonts || [],
      tone: raw.tone || "",
      logo: raw.logo,
      guidelines: raw.guidelines || [],
      values: raw.values,
      targetAudience: raw.targetAudience,
      personality: raw.personality,
    };

    return { success: true, brandDNA };
  },

  async generateContent(
    prompt: string,
    platforms: string[],
    brandDNA?: BrandDNA | null,
    mediaDescriptions?: string[]
  ): Promise<ContentGenerationResult> {
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: { prompt, platforms, brandDNA, mediaDescriptions },
    });

    if (error) {
      console.error("Content generation error:", error);
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: error.message };
    }

    if (data?.error) {
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: data.error };
    }

    return {
      success: true,
      contents: data.contents || [],
      reviewNotes: data.reviewNotes || "",
      complianceScore: data.complianceScore || 0,
    };
  },
};
