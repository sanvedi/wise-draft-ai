import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AYRSHARE_BASE = "https://api.ayrshare.com/api";

// Map our platform names to Ayrshare platform identifiers
const platformMap: Record<string, string> = {
  Instagram: "instagram",
  YouTube: "youtube",
  X: "twitter",
  LinkedIn: "linkedin",
  Facebook: "facebook",
  WordPress: "wordpress",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contents, mediaUrls } = await req.json();

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return new Response(JSON.stringify({ error: "Contents array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AYRSHARE_API_KEY = Deno.env.get("AYRSHARE_API_KEY");
    if (!AYRSHARE_API_KEY) throw new Error("AYRSHARE_API_KEY is not configured. Add it in project secrets.");

    // Build per-platform post content using Ayrshare's multi-platform post feature
    const postBody: Record<string, string> = {};
    const platforms: string[] = [];

    for (const item of contents) {
      const ayrPlatform = platformMap[item.platform];
      if (ayrPlatform) {
        postBody[ayrPlatform] = item.content;
        platforms.push(ayrPlatform);
      }
    }

    // Use default for any unmapped
    if (!postBody.default) {
      postBody.default = contents[0]?.content || "";
    }

    const requestBody: any = {
      post: postBody,
      platforms,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      requestBody.mediaUrls = mediaUrls;
    }

    console.log(`Publishing to ${platforms.length} platforms via Ayrshare`);

    const response = await fetch(`${AYRSHARE_BASE}/post`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AYRSHARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Ayrshare post error:", data);
      return new Response(JSON.stringify({
        error: data.message || `Ayrshare API error [${response.status}]`,
        details: data,
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Ayrshare post successful, id:", data.id);

    return new Response(JSON.stringify({
      success: true,
      postId: data.id,
      postIds: data.postIds,
      platforms: platforms,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Publish error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
