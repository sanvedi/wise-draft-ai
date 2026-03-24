import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUFFER_GRAPHQL_URL = "https://api.buffer.com";

async function bufferGraphQL(query: string, variables: Record<string, unknown>, apiKey: string) {
  const res = await fetch(BUFFER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Buffer returned non-JSON [${res.status}]: ${text.substring(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`Buffer API error [${res.status}]: ${JSON.stringify(data)}`);
  }

  if (data.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${data.errors.map((e: any) => e.message).join(", ")}`);
  }

  return data.data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN");
    if (!BUFFER_ACCESS_TOKEN) {
      throw new Error("BUFFER_ACCESS_TOKEN is not configured. Generate one at publish.buffer.com/settings/api");
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = body;

    // Action: get-organizations
    if (action === "get-organizations") {
      const data = await bufferGraphQL(`
        query GetOrganizations {
          account {
            organizations {
              id
            }
          }
        }
      `, {}, BUFFER_ACCESS_TOKEN);

      return new Response(JSON.stringify({
        success: true,
        organizations: data.account.organizations,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list-channels
    if (action === "list-channels") {
      const { organizationId } = body;
      if (!organizationId) {
        return new Response(JSON.stringify({ error: "organizationId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await bufferGraphQL(`
        query GetChannels($input: ChannelsInput!) {
          channels(input: $input) {
            id
            name
            service
            avatar
            isLocked
          }
        }
      `, { input: { organizationId } }, BUFFER_ACCESS_TOKEN);

      return new Response(JSON.stringify({
        success: true,
        channels: data.channels,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: get-posts — retrieve recent sent posts for analytics
    if (action === "get-posts") {
      const { organizationId, channelIds } = body;
      if (!organizationId) {
        return new Response(JSON.stringify({ error: "organizationId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const filter: any = { status: "sent" };
      if (channelIds?.length) {
        filter.channelIds = channelIds;
      }

      const data = await bufferGraphQL(`
        query GetPosts($input: PostsInput!) {
          posts(input: $input) {
            edges {
              node {
                id
                text
                status
                createdAt
                dueAt
                channelId
                channelService
                via
              }
            }
          }
        }
      `, {
        input: {
          organizationId,
          sort: [{ field: "dueAt", direction: "desc" }, { field: "createdAt", direction: "desc" }],
          filter,
        },
      }, BUFFER_ACCESS_TOKEN);

      const posts = data.posts.edges.map((e: any) => e.node);

      return new Response(JSON.stringify({
        success: true,
        posts,
        totalCount: posts.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: publish
    if (action === "publish") {
      const { contents, channelIds } = body;
      if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return new Response(JSON.stringify({ error: "contents array is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
        return new Response(JSON.stringify({ error: "channelIds array is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: any[] = [];

      for (const item of contents) {
        for (const channelId of channelIds) {
          try {
            const data = await bufferGraphQL(`
              mutation CreatePost($input: CreatePostInput!) {
                createPost(input: $input) {
                  post {
                    id
                    text
                  }
                }
              }
            `, {
              input: {
                text: item.content,
                channelId,
                schedulingType: "automatic",
                mode: "shareNow",
              },
            }, BUFFER_ACCESS_TOKEN);

            const result = data.createPost;
            if (result?.post) {
              console.log(`Buffer post success: ${item.platform} → ${channelId}`);
              results.push({ platform: item.platform, channelId, success: true, postId: result.post.id });
            } else {
              console.error(`Buffer post error: unexpected response`, JSON.stringify(result));
              results.push({ platform: item.platform, channelId, success: false, error: "Unexpected response from Buffer" });
            }
          } catch (e) {
            console.error(`Buffer post exception for ${item.platform}:`, e);
            results.push({ platform: item.platform, channelId, success: false, error: e instanceof Error ? e.message : "Unknown error" });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'get-organizations', 'list-channels', 'get-posts', or 'publish'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Buffer edge function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
