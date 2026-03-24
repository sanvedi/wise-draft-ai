import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("Extracting branding from:", formattedUrl);

    // Step 1: Scrape homepage for branding data
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["branding", "markdown"],
        onlyMainContent: false, // Get full page including headers/footers for org name
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error("Firecrawl scrape error:", scrapeData);
      if (scrapeRes.status === 402) {
        return new Response(JSON.stringify({ error: "Firecrawl credits exhausted. Please top up your Firecrawl account." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Firecrawl scrape failed [${scrapeRes.status}]: ${JSON.stringify(scrapeData)}`);
    }

    const branding = scrapeData.data?.branding || scrapeData.branding || {};
    const homepageMarkdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Step 2: Map the site to discover key pages
    console.log("Mapping site structure...");
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: formattedUrl,
        search: "about us mission vision",
        limit: 10,
        includeSubdomains: false,
      }),
    });

    let additionalContent = "";
    if (mapRes.ok) {
      const mapData = await mapRes.json();
      const siteLinks = mapData.links || mapData.data?.links || [];
      console.log(`Found ${siteLinks.length} relevant pages`);

      // Scrape up to 3 key pages (about, mission, etc.)
      const keyPages = siteLinks
        .filter((link: string) => link !== formattedUrl && link !== formattedUrl + "/")
        .slice(0, 3);

      for (const pageUrl of keyPages) {
        try {
          console.log("Scraping additional page:", pageUrl);
          const pageRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url: pageUrl, formats: ["markdown"], onlyMainContent: true }),
          });
          if (pageRes.ok) {
            const pageData = await pageRes.json();
            const pageMarkdown = pageData.data?.markdown || pageData.markdown || "";
            additionalContent += `\n\n--- PAGE: ${pageUrl} ---\n${pageMarkdown.slice(0, 2000)}`;
          }
        } catch (e) {
          console.warn("Failed to scrape page:", pageUrl, e);
        }
      }
    }

    // Step 3: Use AI to build comprehensive Brand DNA with org name
    const fullContent = homepageMarkdown.slice(0, 5000) + additionalContent.slice(0, 5000);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a brand strategist. Analyze the website content and extracted branding data to create a comprehensive Brand DNA profile. CRITICAL: Extract the EXACT official organization/company name as it appears on the website. Do not guess or infer — use the name from the page title, header, logo text, or about section.`,
          },
          {
            role: "user",
            content: `Analyze this brand thoroughly.\n\nWebsite URL: ${formattedUrl}\nPage Title: ${metadata.title || "Unknown"}\nMeta Description: ${metadata.description || "None"}\n\nExtracted Branding:\n${JSON.stringify(branding, null, 2)}\n\nWebsite Content:\n${fullContent}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_brand_dna",
            description: "Create a structured Brand DNA profile from website analysis",
            parameters: {
              type: "object",
              properties: {
                organizationName: { type: "string", description: "The EXACT official name of the organization/company/brand as it appears on the website" },
                tagline: { type: "string", description: "The brand's tagline or slogan if found on the website" },
                colors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Color role (Primary, Secondary, Accent, Background, Text)" },
                      hex: { type: "string", description: "Hex color value" },
                    },
                    required: ["name", "hex"],
                  },
                },
                fonts: { type: "array", items: { type: "string" }, description: "Font families used" },
                tone: { type: "string", description: "2-3 sentence description of the brand's tone of voice" },
                values: { type: "array", items: { type: "string" }, description: "3-5 core brand values" },
                targetAudience: { type: "string", description: "Brief target audience description" },
                guidelines: {
                  type: "array",
                  items: { type: "string" },
                  description: "5-8 content writing guidelines that match this brand. MUST reference the exact organization name.",
                },
                personality: { type: "string", description: "Brand personality in 3-5 adjectives" },
                keyOfferings: { type: "array", items: { type: "string" }, description: "Key products, services, or programs offered" },
                websiteSummary: { type: "string", description: "2-3 sentence summary of what the organization does" },
              },
              required: ["organizationName", "colors", "fonts", "tone", "values", "targetAudience", "guidelines", "personality", "keyOfferings", "websiteSummary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_brand_dna" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let brandDNA;

    if (toolCall?.function?.arguments) {
      brandDNA = JSON.parse(toolCall.function.arguments);
    } else {
      brandDNA = {
        organizationName: metadata.title || "Unknown Organization",
        colors: branding.colors
          ? Object.entries(branding.colors).map(([name, hex]) => ({ name, hex }))
          : [{ name: "Primary", hex: "#2563EB" }],
        fonts: branding.fonts?.map((f: any) => f.family || f) || ["Sans-serif"],
        tone: "Professional and clear",
        values: ["Quality", "Innovation"],
        targetAudience: "General audience",
        guidelines: ["Maintain consistent tone", "Use active voice"],
        personality: "Professional, modern",
        keyOfferings: [],
        websiteSummary: "",
      };
    }

    // Merge Firecrawl branding images
    if (branding.images?.logo) {
      brandDNA.logo = branding.images.logo;
    }

    console.log(`Brand DNA extracted for: ${brandDNA.organizationName}`);

    return new Response(JSON.stringify({ success: true, brandDNA }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Brand DNA extraction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
