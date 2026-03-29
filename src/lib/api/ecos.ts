import { supabase } from "@/integrations/supabase/client";
import type { BrandDNA } from "@/components/ecos/BrandDNAPanel";

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags?: string[];
  suggestedMediaPlacement?: string;
  viralScore?: number;
  optimizations?: string;
}

interface ContentGenerationResult {
  success: boolean;
  contents: GeneratedContent[];
  reviewNotes: string;
  complianceScore: number;
  error?: string;
  runId?: string;
  platformFeedback?: any[];
  viralScores?: { platform: string; score: number }[];
  retries?: number;
  stepsCompleted?: string[];
}

interface OrchestrationResult extends ContentGenerationResult {
  runId: string;
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

export async function analyzePostPerformance(
  organizationId: string
): Promise<{ success: boolean; analytics?: any; insights?: any; error?: string }> {
  const { data, error } = await supabase.functions.invoke("get-analytics", {
    body: { action: "analyze", organizationId },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, analytics: data.analytics, insights: data.insights };
}

export async function getContentLearnings(): Promise<{ success: boolean; learnings?: any[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("get-analytics", {
    body: { action: "get-learnings" },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, learnings: data.learnings };
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

// Manage integrations server-side
export async function saveIntegrationKey(platformId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("manage-integrations", {
    body: { action: "save-key", platformId, apiKey },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}

export async function disconnectIntegration(platformId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("manage-integrations", {
    body: { action: "disconnect", platformId },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}

export async function listIntegrations(): Promise<{ success: boolean; integrations?: any[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke("manage-integrations", {
    body: { action: "list" },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, integrations: data.integrations };
}

export const ecosApi = {
  async extractBrandDNA(url: string, additionalUrls?: string[]): Promise<BrandDNAResult> {
    const { data, error } = await supabase.functions.invoke("extract-brand-dna", {
      body: { url, additionalUrls },
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
      socialMediaAnalysis: raw.socialMediaAnalysis,
      contentThemes: raw.contentThemes,
      hashtagStrategy: raw.hashtagStrategy,
      socialProfiles: raw.socialProfiles,
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
  ): Promise<OrchestrationResult> {
    const { data, error } = await supabase.functions.invoke("orchestrate-pipeline", {
      body: { prompt, platforms, brandDNA, mediaDescriptions },
    });

    if (error) {
      console.error("Orchestration error:", error);
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: error.message, runId: "" };
    }

    if (data?.error) {
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: data.error, runId: data.runId || "" };
    }

    return {
      success: true,
      runId: data.runId || "",
      contents: data.contents || [],
      reviewNotes: data.reviewNotes || "",
      complianceScore: data.complianceScore || 0,
      platformFeedback: data.platformFeedback,
      viralScores: data.viralScores,
      retries: data.retries,
      stepsCompleted: data.stepsCompleted,
    };
  },

  async resumePipeline(runId: string): Promise<OrchestrationResult> {
    const { data, error } = await supabase.functions.invoke("orchestrate-pipeline", {
      body: { action: "resume", runId },
    });

    if (error) {
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: error.message, runId };
    }
    if (data?.error) {
      return { success: false, contents: [], reviewNotes: "", complianceScore: 0, error: data.error, runId };
    }

    return {
      success: true,
      runId,
      contents: data.contents || [],
      reviewNotes: data.reviewNotes || "",
      complianceScore: data.complianceScore || 0,
      platformFeedback: data.platformFeedback,
      viralScores: data.viralScores,
      retries: data.retries,
      stepsCompleted: data.stepsCompleted,
    };
  },

  async generateMedia(
    type: "image" | "video",
    platform: string,
    contentText: string,
    brandDNA?: any
  ): Promise<{ success: boolean; url?: string; thumbnailUrl?: string; videoScript?: string; error?: string }> {
    const { data, error } = await supabase.functions.invoke("generate-media", {
      body: { type, platform, contentText, brandDNA },
    });

    if (error) {
      console.error("Media generation error:", error);
      return { success: false, error: error.message };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      videoScript: data.videoScript,
    };
  },
};
