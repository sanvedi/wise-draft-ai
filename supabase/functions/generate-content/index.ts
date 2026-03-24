import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const platformSpecs: Record<string, { charLimit: number; format: string; instruction: string }> = {
  Instagram: { charLimit: 2200, format: "Post caption with hashtags", instruction: "Write an engaging Instagram caption. Use emojis, line breaks for readability, and 5-10 relevant hashtags at the end. Keep it visual and engaging." },
  YouTube: { charLimit: 5000, format: "Title + Description + Tags", instruction: "Create a YouTube video title (max 100 chars), a detailed description with timestamps, and comma-separated tags. Make the title clickable but not clickbait." },
  X: { charLimit: 280, format: "Tweet or Thread", instruction: "Write a concise tweet under 280 characters. If the content is rich, create a thread (label as 1/N). Use 1-2 hashtags max." },
  LinkedIn: { charLimit: 3000, format: "Professional post", instruction: "Write a professional LinkedIn post. Start with a hook, use short paragraphs, include data/insights, end with a question or CTA. Keep it authentic and thought-leadership oriented." },
  Facebook: { charLimit: 63206, format: "Post with CTA", instruction: "Write a Facebook post that's conversational and shareable. Include a clear call-to-action. Optimize for engagement (comments, shares)." },
  WordPress: { charLimit: 50000, format: "Blog post in Markdown", instruction: "Write a full blog post in Markdown with H1 title, H2 sections, introduction, body with key takeaways, and conclusion. Include meta description suggestion." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      ? `\n\nBRAND DNA CONTEXT (use this to ensure brand consistency):\n- Tone: ${brandDNA.tone}\n- Values: ${brandDNA.values?.join(", ")}\n- Personality: ${brandDNA.personality}\n- Target Audience: ${brandDNA.targetAudience}\n- Guidelines:\n${brandDNA.guidelines?.map((g: string) => `  • ${g}`).join("\n")}\n- Brand Colors: ${brandDNA.colors?.map((c: any) => `${c.name}: ${c.hex}`).join(", ")}`
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
            content: `You are an expert content marketing strategist and copywriter. You create platform-optimized content that is on-brand, engaging, and tailored for each platform's unique audience and format requirements.${brandContext}`,
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
                      platform: { type: "string", enum: ["Instagram", "YouTube", "X", "LinkedIn", "Facebook", "WordPress"] },
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
