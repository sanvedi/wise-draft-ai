import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AYRSHARE_BASE = "https://api.ayrshare.com/api";

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

    const { postId, platforms } = await req.json();

    if (!postId) {
      return new Response(JSON.stringify({ error: "postId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AYRSHARE_API_KEY = Deno.env.get("AYRSHARE_API_KEY");
    if (!AYRSHARE_API_KEY) throw new Error("AYRSHARE_API_KEY is not configured");

    console.log("Fetching analytics for post:", postId);

    const response = await fetch(`${AYRSHARE_BASE}/analytics/post`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AYRSHARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: postId,
        platforms: platforms || ["facebook", "instagram", "linkedin", "twitter", "youtube"],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Ayrshare analytics error:", data);
      return new Response(JSON.stringify({
        error: data.message || `Analytics error [${response.status}]`,
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize analytics into a consistent format
    const analytics: Record<string, any> = {};
    
    if (data.analytics) {
      for (const [platform, stats] of Object.entries(data.analytics as Record<string, any>)) {
        analytics[platform] = {
          likes: stats.likeCount || stats.likes || 0,
          comments: stats.commentCount || stats.comments || 0,
          shares: stats.shareCount || stats.shares || stats.repostCount || 0,
          impressions: stats.impressionCount || stats.impressions || stats.viewCount || 0,
          engagement: stats.engagementCount || stats.engagement || 0,
          clicks: stats.clickCount || stats.clicks || 0,
          reach: stats.reach || 0,
        };
      }
    }

    // Generate AI-powered insights from the analytics
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let insights = null;

    if (LOVABLE_API_KEY && Object.keys(analytics).length > 0) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are a social media analytics expert. Analyze post performance data and provide actionable insights for improving future content. Be concise and specific.",
              },
              {
                role: "user",
                content: `Analyze this post's performance across platforms and provide insights:\n\n${JSON.stringify(analytics, null, 2)}\n\nProvide: 1) Top performing platform and why, 2) Content improvement suggestions, 3) Best posting time recommendations, 4) Engagement patterns to replicate.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "create_insights",
                description: "Create structured analytics insights",
                parameters: {
                  type: "object",
                  properties: {
                    topPlatform: { type: "string", description: "Best performing platform" },
                    topPlatformReason: { type: "string", description: "Why it performed best" },
                    contentSuggestions: { type: "array", items: { type: "string" }, description: "3-5 content improvement suggestions" },
                    engagementPatterns: { type: "array", items: { type: "string" }, description: "Key engagement patterns observed" },
                    overallScore: { type: "number", description: "Overall performance score 1-10" },
                    nextContentRecommendation: { type: "string", description: "What type of content to create next based on these results" },
                  },
                  required: ["topPlatform", "contentSuggestions", "engagementPatterns", "overallScore", "nextContentRecommendation"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "create_insights" } },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            insights = JSON.parse(toolCall.function.arguments);
          }
        }
      } catch (aiErr) {
        console.error("AI insights error (non-fatal):", aiErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analytics,
      insights,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
