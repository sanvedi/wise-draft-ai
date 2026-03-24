import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const platformSpecs: Record<string, { charLimit: number; format: string; instruction: string }> = {
  Instagram: { charLimit: 2200, format: "Post caption with hashtags", instruction: "Write a VIRAL Instagram caption. Use pattern interrupts, emojis, line breaks for readability, a powerful hook in the first line, and 5-10 trending hashtags. Make it scroll-stopping and shareable." },
  YouTube: { charLimit: 5000, format: "Title + Description + Tags", instruction: "Create a VIRAL YouTube video title (max 100 chars) that drives curiosity and clicks. Write a description with timestamps and SEO keywords. Make the title irresistible but authentic — use power words, numbers, and emotional triggers." },
  X: { charLimit: 280, format: "Tweet or Thread", instruction: "Write a VIRAL tweet under 280 characters. Use a hot take, controversial angle, or surprising stat. If the content is rich, create a thread (1/N) with a cliffhanger opener. Maximize retweets and quote tweets." },
  LinkedIn: { charLimit: 3000, format: "Professional post", instruction: "Write a VIRAL LinkedIn post. Start with a bold, pattern-breaking hook (1 short sentence). Use short 1-2 line paragraphs. Include a personal angle or surprising data point. End with a polarizing question that drives comments. Make it feel authentic, not corporate." },
  Facebook: { charLimit: 63206, format: "Post with CTA", instruction: "Write a VIRAL Facebook post that triggers sharing. Use storytelling, emotional hooks, and a clear call-to-action. Optimize for comments and shares — ask questions, use 'tag someone who...' patterns." },
  "Google Business": { charLimit: 1500, format: "Business Update", instruction: "Write a compelling Google Business Profile update. Keep it local, action-oriented, and include a clear CTA (visit, call, book). Use keywords relevant to local search. Keep it concise and professional but engaging." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, platforms, brandDNA, mediaDescriptions } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const targetPlatforms = platforms || Object.keys(platformSpecs);

    const brandContext = brandDNA
      ? `\n\nBRAND DNA CONTEXT — STRICTLY follow this for ALL content:\n- ORGANIZATION NAME: ${brandDNA.organizationName || "Unknown"} (ALWAYS use this exact name — never guess or use alternate names)\n- Tagline: ${brandDNA.tagline || "N/A"}\n- About: ${brandDNA.websiteSummary || "N/A"}\n- Key Offerings: ${brandDNA.keyOfferings?.join(", ") || "N/A"}\n- Tone: ${brandDNA.tone}\n- Values: ${brandDNA.values?.join(", ")}\n- Personality: ${brandDNA.personality}\n- Target Audience: ${brandDNA.targetAudience}\n- Guidelines:\n${brandDNA.guidelines?.map((g: string) => `  • ${g}`).join("\n")}\n- Brand Colors: ${brandDNA.colors?.map((c: any) => `${c.name}: ${c.hex}`).join(", ")}`
      : "";

    const mediaContext = mediaDescriptions?.length
      ? `\n\nMEDIA ASSETS PROVIDED:\n${mediaDescriptions.map((m: string) => `- ${m}`).join("\n")}\nReference these assets in the content where appropriate.`
      : "";

    // Generate content for all platforms in a single AI call using tool calling
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an elite viral content strategist and copywriter. Your job is to create VIRAL-WORTHY content that maximizes engagement, shares, and reach on each platform. You understand platform algorithms, trending formats, psychological triggers (curiosity gaps, pattern interrupts, emotional hooks), and what makes content go viral. Every piece must be scroll-stopping, shareable, and on-brand.${brandContext}`,
          },
          {
            role: "user",
            content: `Create content for the following platforms based on this brief:\n\n"${prompt}"${mediaContext}\n\nGenerate content for: ${targetPlatforms.join(", ")}\n\nFor each platform, follow these format requirements:\n${targetPlatforms.map((p: string) => `- ${p}: ${platformSpecs[p]?.instruction || "Create appropriate content"} (max ${platformSpecs[p]?.charLimit || 5000} chars)`).join("\n")}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_platform_content",
            description: "Generate platform-specific content for multiple social media and publishing platforms",
            parameters: {
              type: "object",
              properties: {
                contents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string", enum: ["Instagram", "YouTube", "X", "LinkedIn", "Facebook", "Google Business"] },
                      content: { type: "string", description: "The generated content for this platform" },
                      hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags if applicable" },
                      suggestedMediaPlacement: { type: "string", description: "How to use the provided media assets" },
                    },
                    required: ["platform", "content"],
                  },
                },
                reviewNotes: { type: "string", description: "Brief notes on brand alignment and content strategy" },
                complianceScore: { type: "number", description: "1-5 score on brand compliance" },
              },
              required: ["contents", "reviewNotes", "complianceScore"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_platform_content" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds at Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured content");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`Generated content for ${result.contents?.length || 0} platforms, compliance: ${result.complianceScore}/5`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Content generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
