import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action, platformId, apiKey } = await req.json();

    // Get API key for a platform (used by other edge functions)
    if (action === "get-key") {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("encrypted_api_key")
        .eq("user_id", userId)
        .eq("platform_id", platformId)
        .eq("is_connected", true)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Integration not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, apiKey: data.encrypted_api_key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save/update API key
    if (action === "save-key") {
      if (!platformId || !apiKey) {
        return new Response(JSON.stringify({ error: "platformId and apiKey required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("user_integrations").upsert({
        user_id: userId,
        platform_id: platformId,
        platform_name: platformId,
        encrypted_api_key: apiKey,
        is_connected: true,
        connected_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform_id" });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Disconnect
    if (action === "disconnect") {
      const { error } = await supabase.from("user_integrations")
        .update({ is_connected: false, encrypted_api_key: "" })
        .eq("user_id", userId)
        .eq("platform_id", platformId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List user integrations
    if (action === "list") {
      const { data, error } = await supabase.from("user_integrations")
        .select("platform_id, platform_name, is_connected, connected_at, supported_services")
        .eq("user_id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, integrations: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manage-integrations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
