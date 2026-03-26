import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
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

    if (type === "image") {
      const imagePrompt = `Create a stunning, professional social media ${platform} image for this content: "${contentText.slice(0, 300)}". ${brandContext} Style: modern, high-quality, scroll-stopping visual. No text overlays unless essential. Aspect ratio suitable for ${platform}.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

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
        throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
      }

      const aiData = await aiRes.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error("No image was generated");
      }

      return new Response(JSON.stringify({ success: true, type: "image", url: imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "video") {
      // For video, generate a storyboard description since direct video gen isn't available via AI gateway
      // We generate a compelling thumbnail/cover image + video script
      const videoPrompt = `Create a visually compelling thumbnail or cover image for a ${platform} video about: "${contentText.slice(0, 300)}". ${brandContext} Make it eye-catching with bold visual composition suitable for a video thumbnail on ${platform}.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: videoPrompt }],
          modalities: ["image", "text"],
        }),
      });

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
        throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
      }

      const aiData = await aiRes.json();
      const thumbnailUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      // Also generate a video script
      const scriptRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a video content strategist. Create concise, engaging video scripts." },
            { role: "user", content: `Create a short video script (30-60 seconds) for ${platform} based on this content:\n\n"${contentText.slice(0, 500)}"\n\n${brandContext}\n\nInclude: Hook (first 3 seconds), main points, and CTA. Format with timestamps.` },
          ],
        }),
      });

      const scriptData = await scriptRes.json();
      const videoScript = scriptData.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({
        success: true,
        type: "video",
        thumbnailUrl: thumbnailUrl || null,
        videoScript,
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
