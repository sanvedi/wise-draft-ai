import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_ENGINE = "google/gemini-3.1-flash-image-preview";
const VIDEO_SCRIPT_ENGINE = "google/gemini-3-flash-preview";

function extractImageUrl(aiData: any): string | null {
  const message = aiData?.choices?.[0]?.message;
  if (!message) return null;

  // Try images array with image_url.url
  const images = message.images;
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0];
    if (typeof img === "string") return img;
    if (img?.image_url?.url) return img.image_url.url;
    if (img?.url) return img.url;
    if (img?.b64_json) return `data:image/png;base64,${img.b64_json}`;
  }

  // Try content array for multimodal responses
  const content = message.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image" && part.url) return part.url;
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, platform, contentText, brandDNA } = await req.json();

    if (!type || !platform || !contentText) {
      return new Response(JSON.stringify({ error: "type, platform, and contentText are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const brandContext = brandDNA
      ? `Brand: ${brandDNA.organizationName || ""}. Colors: ${brandDNA.colors?.map((c: any) => c.hex).join(", ") || "modern"}. Tone: ${brandDNA.tone || "professional"}.`
      : "";

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    async function callImageModel(prompt: string): Promise<Response> {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: IMAGE_ENGINE,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      return res;
    }

    if (type === "image") {
      const imagePrompt = `Create a stunning, professional social media ${platform} image for this content: "${contentText.slice(0, 300)}". ${brandContext} Style: modern, high-quality, scroll-stopping visual. No text overlays unless essential. Aspect ratio suitable for ${platform}.`;

      const aiRes = await callImageModel(imagePrompt);

      if (!aiRes.ok) {
        if (aiRes.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiRes.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiRes.text();
        console.error("Image generation AI error:", errText);
        throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
      }

      const aiData = await aiRes.json();
      console.log("Image AI response keys:", JSON.stringify(Object.keys(aiData.choices?.[0]?.message || {})));
      const imageUrl = extractImageUrl(aiData);

      if (!imageUrl) {
        console.error("No image in response. Full message:", JSON.stringify(aiData.choices?.[0]?.message).slice(0, 500));
        // Fall back to text description if no image was generated
        const textContent = aiData.choices?.[0]?.message?.content;
        return new Response(JSON.stringify({
          success: true,
          type: "image",
          url: null,
          description: typeof textContent === "string" ? textContent : "Image generation completed but no image URL was returned.",
          engine: IMAGE_ENGINE,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        type: "image",
        url: imageUrl,
        engine: IMAGE_ENGINE,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "video") {
      const videoPrompt = `Create a visually compelling thumbnail or cover image for a ${platform} video about: "${contentText.slice(0, 300)}". ${brandContext} Make it eye-catching with bold visual composition suitable for a video thumbnail on ${platform}.`;

      const [thumbnailRes, scriptRes] = await Promise.all([
        callImageModel(videoPrompt),
        fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            model: VIDEO_SCRIPT_ENGINE,
            messages: [
              { role: "system", content: "You are a video content strategist. Create concise, engaging video scripts." },
              { role: "user", content: `Create a short video script (30-60 seconds) for ${platform} based on this content:\n\n"${contentText.slice(0, 500)}"\n\n${brandContext}\n\nInclude: Hook (first 3 seconds), main points, and CTA. Format with timestamps.` },
            ],
          }),
        }),
      ]);

      let thumbnailUrl: string | null = null;
      if (thumbnailRes.ok) {
        const thumbData = await thumbnailRes.json();
        thumbnailUrl = extractImageUrl(thumbData);
      } else {
        const errText = await thumbnailRes.text();
        console.warn("Thumbnail generation failed:", errText);
      }

      let videoScript = "";
      if (scriptRes.ok) {
        const scriptData = await scriptRes.json();
        videoScript = scriptData.choices?.[0]?.message?.content || "";
      } else {
        const errText = await scriptRes.text();
        console.warn("Script generation failed:", errText);
      }

      return new Response(JSON.stringify({
        success: true,
        type: "video",
        thumbnailUrl,
        videoScript,
        engine: { thumbnail: IMAGE_ENGINE, script: VIDEO_SCRIPT_ENGINE },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'image' or 'video'." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Media generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});