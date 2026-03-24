import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUFFER_API = "https://api.bufferapp.com/1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN");
    if (!BUFFER_ACCESS_TOKEN) {
      throw new Error("BUFFER_ACCESS_TOKEN is not configured. Add it in project secrets.");
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
    const { action, contents, profileIds } = body;

    // Action: list-profiles — returns connected Buffer profiles
    if (action === "list-profiles") {
      const res = await fetch(`${BUFFER_API}/profiles.json?access_token=${BUFFER_ACCESS_TOKEN}`);
      const profiles = await res.json();

      if (!res.ok) {
        throw new Error(`Buffer API error [${res.status}]: ${JSON.stringify(profiles)}`);
      }

      return new Response(JSON.stringify({
        success: true,
        profiles: profiles.map((p: any) => ({
          id: p.id,
          service: p.service,
          serviceUsername: p.service_username,
          avatar: p.avatar_https,
          formatted: p.formatted_service,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: publish — post content to selected profiles
    if (action === "publish") {
      if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return new Response(JSON.stringify({ error: "Contents array is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: any[] = [];

      for (const item of contents) {
        // Find matching profile IDs for this platform, or use provided profileIds
        const targetProfiles = profileIds || [];

        const formData = new URLSearchParams();
        formData.append("text", item.content);
        formData.append("access_token", BUFFER_ACCESS_TOKEN);
        formData.append("now", "true"); // Post immediately

        for (const pid of targetProfiles) {
          formData.append("profile_ids[]", pid);
        }

        const res = await fetch(`${BUFFER_API}/updates/create.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(`Buffer post error for ${item.platform}:`, data);
          results.push({ platform: item.platform, success: false, error: data.message || "Failed" });
        } else {
          console.log(`Buffer post success for ${item.platform}`);
          results.push({ platform: item.platform, success: true, updateId: data.updates?.[0]?.id });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'list-profiles' or 'publish'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Buffer publish error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
