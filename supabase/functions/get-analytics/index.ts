import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUFFER_GRAPHQL_URL = "https://api.buffer.com";

async function bufferGraphQL(query: string, variables: Record<string, unknown>, apiKey: string) {
  const res = await fetch(BUFFER_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Buffer non-JSON [${res.status}]: ${text.substring(0, 300)}`); }
  if (!res.ok) throw new Error(`Buffer API error [${res.status}]: ${JSON.stringify(data)}`);
  if (data.errors?.length) throw new Error(`Buffer GraphQL: ${data.errors.map((e: any) => e.message).join(", ")}`);
  return data.data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action } = body;

    // Resolve Buffer access token
    let accessToken: string | undefined;
    try {
      const { data: integration } = await supabaseAuth.from("user_integrations").select("encrypted_api_key").eq("user_id", user.id).eq("platform_id", "buffer").eq("is_connected", true).single();
      if (integration?.encrypted_api_key) accessToken = integration.encrypted_api_key;
    } catch {}
    if (!accessToken && (user.email || "").toLowerCase() === "sanvedi@gmail.com") {
      accessToken = Deno.env.get("BUFFER_ACCESS_TOKEN");
    }
    if (!accessToken) throw new Error("No Buffer access token. Connect Buffer in Integrations.");

    // ACTION: analyze — fetch Buffer posts, analyze with AI, store learnings
    if (action === "analyze") {
      const { organizationId } = body;
      if (!organizationId) return new Response(JSON.stringify({ error: "organizationId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Fetch sent posts
      const postsData = await bufferGraphQL(`
        query GetPosts($input: PostsInput!) {
          posts(input: $input) {
            edges { node { id text status createdAt dueAt channelId channelService via } }
          }
        }
      `, {
        input: {
          organizationId,
          sort: [{ field: "dueAt", direction: "desc" }, { field: "createdAt", direction: "desc" }],
          filter: { status: "sent" },
        },
      }, accessToken);

      const posts = postsData.posts.edges.map((e: any) => e.node);
      if (posts.length === 0) {
        return new Response(JSON.stringify({ success: true, insights: null, message: "No sent posts to analyze" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Build analytics summary
      const platformCounts: Record<string, number> = {};
      const apiPostCount = posts.filter((p: any) => p.via === "api").length;
      const postTexts: string[] = [];
      const postingTimes: string[] = [];

      for (const post of posts) {
        const svc = post.channelService || "unknown";
        platformCounts[svc] = (platformCounts[svc] || 0) + 1;
        if (post.text) postTexts.push(post.text.substring(0, 200));
        if (post.dueAt || post.createdAt) {
          const d = new Date(post.dueAt || post.createdAt);
          postingTimes.push(`${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
      }

      const analysisSummary = {
        totalPosts: posts.length,
        apiPosts: apiPostCount,
        platformBreakdown: platformCounts,
        sampleContent: postTexts.slice(0, 10),
        postingTimes: postingTimes.slice(0, 20),
        dateRange: {
          oldest: posts[posts.length - 1]?.createdAt,
          newest: posts[0]?.createdAt,
        },
      };

      // AI analysis
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let insights = null;

      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: "You are a social media strategist analyzing post history. Provide actionable, data-driven insights to improve future content. Be specific and concise.",
                },
                {
                  role: "user",
                  content: `Analyze this social media post history and generate strategic insights:\n\n${JSON.stringify(analysisSummary, null, 2)}\n\nProvide:\n1) Content patterns that seem effective\n2) Platform-specific recommendations\n3) Optimal posting schedule based on the data\n4) Content themes to double down on\n5) Areas for improvement\n6) Specific recommendations for the next 5 posts`,
                },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "create_learnings",
                  description: "Create structured learnings from analytics",
                  parameters: {
                    type: "object",
                    properties: {
                      contentPatterns: { type: "array", items: { type: "string" }, description: "Effective content patterns observed" },
                      platformRecommendations: { type: "object", description: "Platform-specific recommendations keyed by platform name" },
                      optimalSchedule: { type: "array", items: { type: "string" }, description: "Best days/times to post" },
                      contentThemes: { type: "array", items: { type: "string" }, description: "Top content themes to continue" },
                      improvements: { type: "array", items: { type: "string" }, description: "Areas needing improvement" },
                      nextPostIdeas: { type: "array", items: { type: "string" }, description: "5 specific post ideas based on analysis" },
                      overallScore: { type: "number", description: "Content strategy score 1-10" },
                      keyTakeaway: { type: "string", description: "Single most important insight" },
                    },
                    required: ["contentPatterns", "platformRecommendations", "optimalSchedule", "contentThemes", "improvements", "nextPostIdeas", "overallScore", "keyTakeaway"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "create_learnings" } },
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

      // Store learnings in database
      if (insights) {
        const platforms = Object.keys(platformCounts);
        await supabaseAuth.from("content_learnings").insert({
          user_id: user.id,
          analysis_data: analysisSummary,
          insights,
          post_count: posts.length,
          platforms_analyzed: platforms,
        });
      }

      return new Response(JSON.stringify({ success: true, analytics: analysisSummary, insights }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ACTION: get-learnings — retrieve stored learnings
    if (action === "get-learnings") {
      const { data: learnings } = await supabaseAuth.from("content_learnings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      return new Response(JSON.stringify({ success: true, learnings: learnings || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'analyze' or 'get-learnings'" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
