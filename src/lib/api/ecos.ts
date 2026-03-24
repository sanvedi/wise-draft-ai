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

export async function getBufferOrganizations(): Promise<{ success: boolean; organizations?: { id: string }[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("publish-buffer", {
    body: { action: "get-organizations" },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, organizations: data.organizations };
}

export async function getBufferChannels(organizationId: string): Promise<{ success: boolean; channels?: any[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("publish-buffer", {
    body: { action: "list-channels", organizationId },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, channels: data.channels };
}

export async function getBufferPosts(
  organizationId: string,
  channelIds?: string[]
): Promise<{ success: boolean; posts?: any[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("publish-buffer", {
    body: { action: "get-posts", organizationId, channelIds },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, posts: data.posts };
}

export async function publishViaBuffer(
  contents: { platform: string; content: string }[],
  channelIds: string[]
): Promise<{ success: boolean; results?: any[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("publish-buffer", {
    body: { action: "publish", contents, channelIds },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, results: data.results };
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

    const raw = data.brandDNA;
    const brandDNA: BrandDNA & { values?: string[]; targetAudience?: string; personality?: string } = {
      organizationName: raw.organizationName,
      tagline: raw.tagline,
      colors: raw.colors || [],
      fonts: raw.fonts || [],
      tone: raw.tone || "",
      logo: raw.logo,
      guidelines: raw.guidelines || [],
      keyOfferings: raw.keyOfferings,
      websiteSummary: raw.websiteSummary,
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
