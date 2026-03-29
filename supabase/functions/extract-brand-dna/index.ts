import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Validate URL before proceeding
    try {
      new URL(formattedUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL. Please provide a valid website address (e.g. https://example.com)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting branding from:", formattedUrl);

    // Step 1: Scrape homepage for branding data (with timeout + retry)
    let scrapeData: any = null;
    let scrapeOk = false;

    for (const attempt of [1, 2]) {
      console.log(`Scrape attempt ${attempt} for:`, formattedUrl);
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["branding", "markdown"],
            onlyMainContent: false,
            timeout: 60000,
            waitFor: attempt === 1 ? 3000 : 5000,
          }),
        });

        // Safely parse response — Firecrawl can return non-JSON (e.g. "Bad Gateway")
        const scrapeText = await scrapeRes.text();
        try {
          scrapeData = JSON.parse(scrapeText);
        } catch {
          console.warn(`Scrape attempt ${attempt}: non-JSON response [${scrapeRes.status}]: ${scrapeText.slice(0, 200)}`);
          if (attempt === 2) break;
          continue;
        }

        if (scrapeRes.ok) {
          scrapeOk = true;
          break;
        }

        if (scrapeRes.status === 402) {
          return new Response(JSON.stringify({ error: "Firecrawl credits exhausted. Please top up your Firecrawl account." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (scrapeRes.status !== 408 || attempt === 2) {
          console.warn(`Scrape failed [${scrapeRes.status}] on attempt ${attempt}, continuing with partial data`);
          break;
        }
        console.warn("Scrape timed out, retrying with longer wait...");
      } catch (fetchErr) {
        console.warn(`Scrape attempt ${attempt} network error:`, fetchErr);
        if (attempt === 2) break;
      }
    }

    const branding = scrapeOk ? (scrapeData?.data?.branding || scrapeData?.branding || {}) : {};
    const homepageMarkdown = scrapeOk ? (scrapeData?.data?.markdown || scrapeData?.markdown || "") : "";
    const metadata = scrapeOk ? (scrapeData?.data?.metadata || scrapeData?.metadata || {}) : { title: new URL(formattedUrl).hostname };

    // Step 2: Map the site to discover key pages + social profiles
    console.log("Mapping site structure...");
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: formattedUrl,
        search: "about us mission vision",
        limit: 20,
        includeSubdomains: false,
      }),
    });

    let additionalContent = "";
    let socialMediaContent = "";
    const socialProfiles: Record<string, string> = {};

    let mapOk = false;
    let siteLinks: string[] = [];
    try {
      if (mapRes.ok) {
        const mapText = await mapRes.text();
        try {
          const mapData = JSON.parse(mapText);
          siteLinks = mapData.links || mapData.data?.links || [];
          mapOk = true;
        } catch {
          console.warn("Map response not valid JSON:", mapText.slice(0, 200));
        }
      } else {
        const errText = await mapRes.text();
        console.warn(`Map failed [${mapRes.status}]:`, errText.slice(0, 200));
      }
    } catch (mapErr) {
      console.warn("Map network error:", mapErr);
    }

    if (mapOk) {
      console.log(`Found ${siteLinks.length} relevant pages`);

      // Detect social media profile links from the site
      for (const link of siteLinks) {
        const l = (link as string).toLowerCase();
        if (l.includes("instagram.com/") && !socialProfiles.instagram) socialProfiles.instagram = link;
        if ((l.includes("twitter.com/") || l.includes("x.com/")) && !socialProfiles.x) socialProfiles.x = link;
        if (l.includes("linkedin.com/") && !socialProfiles.linkedin) socialProfiles.linkedin = link;
        if (l.includes("facebook.com/") && !socialProfiles.facebook) socialProfiles.facebook = link;
        if (l.includes("youtube.com/") && !socialProfiles.youtube) socialProfiles.youtube = link;
      }

      // Scrape up to 3 key pages (about, mission, etc.)
      const keyPages = siteLinks
        .filter((link: string) => {
          const l = link.toLowerCase();
          return link !== formattedUrl && link !== formattedUrl + "/" &&
            !l.includes("instagram.com") && !l.includes("twitter.com") && !l.includes("x.com") &&
            !l.includes("linkedin.com") && !l.includes("facebook.com") && !l.includes("youtube.com");
        })
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
            const pageText = await pageRes.text();
            try {
              const pageData = JSON.parse(pageText);
              const pageMarkdown = pageData.data?.markdown || pageData.markdown || "";
              additionalContent += `\n\n--- PAGE: ${pageUrl} ---\n${pageMarkdown.slice(0, 2000)}`;
            } catch {
              console.warn("Page response not valid JSON for:", pageUrl);
            }
          }
        } catch (e) {
          console.warn("Failed to scrape page:", pageUrl, e);
        }
      }
    }

    // Also extract social profile links from the homepage markdown
    const socialPatterns = [
      { key: "instagram", pattern: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/gi },
      { key: "x", pattern: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/gi },
      { key: "linkedin", pattern: /https?:\/\/(www\.)?linkedin\.com\/[^\s"'<>)]+/gi },
      { key: "facebook", pattern: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/gi },
      { key: "youtube", pattern: /https?:\/\/(www\.)?youtube\.com\/[^\s"'<>)]+/gi },
    ];
    for (const { key, pattern } of socialPatterns) {
      if (!socialProfiles[key]) {
        const match = homepageMarkdown.match(pattern);
        if (match) socialProfiles[key] = match[0];
      }
    }

    // Step 3: Scrape social media profiles for content analysis
    console.log("Discovered social profiles:", Object.keys(socialProfiles));
    for (const [platform, profileUrl] of Object.entries(socialProfiles)) {
      try {
        console.log(`Scraping ${platform} profile:`, profileUrl);
        const socialRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: profileUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 2000 }),
        });
        if (socialRes.ok) {
          const socialText = await socialRes.text();
          try {
            const socialData = JSON.parse(socialText);
            const socialMarkdown = socialData.data?.markdown || socialData.markdown || "";
            socialMediaContent += `\n\n--- SOCIAL: ${platform.toUpperCase()} (${profileUrl}) ---\n${socialMarkdown.slice(0, 3000)}`;
          } catch {
            console.warn(`Social scrape for ${platform} returned non-JSON`);
          }
        } else {
          // Consume body to prevent resource leak
          await socialRes.text();
        }
      } catch (e) {
        console.warn(`Failed to scrape ${platform}:`, e);
      }
    }

    // Step 4: Use AI to build comprehensive Brand DNA with social analysis
    const fullContent = homepageMarkdown.slice(0, 5000) + additionalContent.slice(0, 5000);

    const socialContext = socialMediaContent ? `\n\nSOCIAL MEDIA PROFILES CONTENT:\n${socialMediaContent.slice(0, 6000)}` : "";
    const socialProfilesList = Object.keys(socialProfiles).length > 0
      ? `\nDiscovered social profiles: ${Object.entries(socialProfiles).map(([k, v]) => `${k}: ${v}`).join(", ")}`
      : "";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a brand strategist and social media analyst. Analyze the website content, extracted branding data, AND existing social media posts to create a comprehensive Brand DNA profile. 

CRITICAL: Extract the EXACT official organization/company name as it appears on the website. Do not guess or infer — use the name from the page title, header, logo text, or about section.

If social media content is provided, analyze their posting patterns, content themes, engagement style, hashtag strategy, and tone to inform your brand DNA extraction. The content guidelines should reflect what works on their social channels.`,
          },
          {
            role: "user",
            content: `Analyze this brand thoroughly.\n\nWebsite URL: ${formattedUrl}\nPage Title: ${metadata.title || "Unknown"}\nMeta Description: ${metadata.description || "None"}${socialProfilesList}\n\nExtracted Branding:\n${JSON.stringify(branding, null, 2)}\n\nWebsite Content:\n${fullContent}${socialContext}`,
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
                socialMediaAnalysis: { type: "string", description: "Analysis of existing social media posting patterns, content themes, engagement style, and what works well for this brand on social platforms. Only include if social media content was provided." },
                contentThemes: { type: "array", items: { type: "string" }, description: "3-6 recurring content themes/topics the brand posts about on social media" },
                hashtagStrategy: { type: "array", items: { type: "string" }, description: "5-10 hashtags the brand commonly uses or should use based on their niche" },
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

    // Add discovered social profiles
    if (Object.keys(socialProfiles).length > 0) {
      brandDNA.socialProfiles = socialProfiles;
    }

    console.log(`Brand DNA extracted for: ${brandDNA.organizationName} (${Object.keys(socialProfiles).length} social profiles found)`);

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
