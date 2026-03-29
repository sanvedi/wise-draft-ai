import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Platform specs ──────────────────────────────────────────────────────
const platformSpecs: Record<string, { charLimit: number; instruction: string }> = {
  Instagram: { charLimit: 2200, instruction: "Write a VIRAL Instagram caption. Use pattern interrupts, emojis, line breaks for readability, a powerful hook in the first line, and 5-10 trending hashtags." },
  YouTube: { charLimit: 5000, instruction: "Create a VIRAL YouTube video title (max 100 chars) that drives curiosity. Write a description with timestamps and SEO keywords." },
  X: { charLimit: 280, instruction: "Write a VIRAL tweet under 280 characters. Use a hot take, controversial angle, or surprising stat. If rich, create a thread (1/N)." },
  LinkedIn: { charLimit: 3000, instruction: "Write a VIRAL LinkedIn post. Start with a bold hook. Use short paragraphs. End with a polarizing question." },
  Facebook: { charLimit: 63206, instruction: "Write a VIRAL Facebook post that triggers sharing. Use storytelling, emotional hooks, and a clear CTA." },
  "Google Business": { charLimit: 1500, instruction: "Write a compelling Google Business Profile update. Local, action-oriented, with clear CTA." },
};

// ── Types ───────────────────────────────────────────────────────────────
type StepName = "drafter" | "reviewer" | "customizer" | "publisher" | "learner";

interface PipelineContext {
  runId: string;
  userId: string;
  prompt: string;
  platforms: string[];
  brandDNA: any;
  mediaDescriptions: string[];
  checkpoints: Record<string, any>;
  retryCount: number;
  maxRetries: number;
}

interface StepResult {
  success: boolean;
  output: any;
  nextStep?: StepName | StepName[] | null;
  score?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function updateRun(runId: string, updates: Record<string, any>) {
  const admin = getSupabaseAdmin();
  await admin.from("pipeline_runs").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", runId);
}

// ── Per-agent model assignments (upgraded to latest same-cost-tier models) ──
const AGENT_MODELS: Record<StepName, string> = {
  drafter: "google/gemini-3-flash-preview",       // Fast creative generation
  reviewer: "google/gemini-2.5-flash",             // Fast brand compliance check
  customizer: "google/gemini-3.1-pro-preview",      // Deep viral optimization
  publisher: "google/gemini-3-flash-preview",      // Lightweight step
  learner: "google/gemini-3-flash-preview",        // Analytics summarization
};

const STEP_TIMEOUT_MS: Record<StepName, number> = {
  drafter: 45000,
  reviewer: 35000,
  customizer: 90000,
  publisher: 15000,
  learner: 15000,
};

const STEP_MAX_ATTEMPTS: Record<StepName, number> = {
  drafter: 3,
  reviewer: 3,
  customizer: 2,
  publisher: 1,
  learner: 1,
};

function isAbortError(error: unknown) {
  return error instanceof Error && (
    error.name === "AbortError" ||
    error.message.includes("signal has been aborted")
  );
}

async function callAI(messages: any[], tools?: any[], toolChoice?: any, step?: StepName) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const model = step ? AGENT_MODELS[step] : "google/gemini-3-flash-preview";
  const timeoutMs = step ? STEP_TIMEOUT_MS[step] : 45000;
  const body: any = { model, messages, stream: false };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("RATE_LIMITED");
      if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
      throw new Error(`AI error [${res.status}]: ${errText}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`AI_TIMEOUT:${step ?? "unknown"}:${timeoutMs}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildBrandContext(brandDNA: any): string {
  if (!brandDNA) return "";
  let ctx = `\n\nBRAND DNA CONTEXT — STRICTLY follow this for ALL content:\n- ORGANIZATION: ${brandDNA.organizationName || "Unknown"}\n- Tagline: ${brandDNA.tagline || "N/A"}\n- About: ${brandDNA.websiteSummary || "N/A"}\n- Key Offerings: ${brandDNA.keyOfferings?.join(", ") || "N/A"}\n- Tone: ${brandDNA.tone}\n- Values: ${brandDNA.values?.join(", ")}\n- Personality: ${brandDNA.personality}\n- Target Audience: ${brandDNA.targetAudience}\n- Guidelines:\n${brandDNA.guidelines?.map((g: string) => `  • ${g}`).join("\n")}\n- Brand Colors: ${brandDNA.colors?.map((c: any) => `${c.name}: ${c.hex}`).join(", ")}`;
  
  if (brandDNA.socialMediaAnalysis) {
    ctx += `\n\nSOCIAL MEDIA ANALYSIS — Use this to inform content style:\n${brandDNA.socialMediaAnalysis}`;
  }
  if (brandDNA.contentThemes?.length) {
    ctx += `\n- Content Themes: ${brandDNA.contentThemes.join(", ")}`;
  }
  if (brandDNA.hashtagStrategy?.length) {
    ctx += `\n- Recommended Hashtags: ${brandDNA.hashtagStrategy.join(", ")}`;
  }
  return ctx;
}

function getCustomizerDraftSummary(draftContents: any[] = []) {
  return draftContents.map((item) => ({
    platform: item.platform,
    content: typeof item.content === "string" ? item.content.slice(0, 1200) : "",
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.slice(0, 8) : [],
    suggestedMediaPlacement: item.suggestedMediaPlacement || "",
  }));
}

function getCustomizerReviewSummary(reviewOutput: any) {
  return {
    complianceScore: reviewOutput?.complianceScore ?? null,
    reviewNotes: typeof reviewOutput?.reviewNotes === "string"
      ? reviewOutput.reviewNotes.slice(0, 1200)
      : "",
    platformFeedback: Array.isArray(reviewOutput?.platformFeedback)
      ? reviewOutput.platformFeedback.map((item: any) => ({
          platform: item.platform,
          score: item.score,
          needsRevision: item.needsRevision,
          feedback: typeof item.feedback === "string" ? item.feedback.slice(0, 400) : "",
        }))
      : [],
  };
}

// ── Agent Steps ─────────────────────────────────────────────────────────

async function runDrafter(ctx: PipelineContext): Promise<StepResult> {
  const brandContext = buildBrandContext(ctx.brandDNA);
  const mediaContext = ctx.mediaDescriptions.length
    ? `\n\nMEDIA ASSETS:\n${ctx.mediaDescriptions.map((m) => `- ${m}`).join("\n")}`
    : "";

  const contentTool = {
    type: "function",
    function: {
      name: "generate_platform_content",
      description: "Generate platform-specific content",
      parameters: {
        type: "object",
        properties: {
          contents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                content: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                suggestedMediaPlacement: { type: "string" },
              },
              required: ["platform", "content"],
            },
          },
        },
        required: ["contents"],
      },
    },
  };

  const aiData = await callAI(
    [
      {
        role: "system",
        content: `You are an elite viral content strategist. Create VIRAL-WORTHY content that maximizes engagement.${brandContext}`,
      },
      {
        role: "user",
        content: `Create content for these platforms based on this brief:\n\n"${ctx.prompt}"${mediaContext}\n\nPlatforms: ${ctx.platforms.join(", ")}\n\n${ctx.platforms.map((p) => `- ${p}: ${platformSpecs[p]?.instruction || "Create appropriate content"} (max ${platformSpecs[p]?.charLimit || 5000} chars)`).join("\n")}`,
      },
    ],
    [contentTool],
    { type: "function", function: { name: "generate_platform_content" } },
    "drafter",
  );

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("Drafter: no structured output");

  const result = JSON.parse(toolCall.function.arguments);
  return { success: true, output: result, nextStep: "reviewer" };
}

async function runReviewer(ctx: PipelineContext): Promise<StepResult> {
  const draftOutput = ctx.checkpoints.drafter;
  if (!draftOutput?.contents) throw new Error("Reviewer: no draft to review");

  const reviewTool = {
    type: "function",
    function: {
      name: "review_content",
      description: "Review content for brand compliance and quality",
      parameters: {
        type: "object",
        properties: {
          complianceScore: { type: "number", description: "1-5 brand compliance score" },
          reviewNotes: { type: "string" },
          platformFeedback: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                score: { type: "number" },
                feedback: { type: "string" },
                needsRevision: { type: "boolean" },
              },
              required: ["platform", "score", "feedback", "needsRevision"],
            },
          },
        },
        required: ["complianceScore", "reviewNotes", "platformFeedback"],
      },
    },
  };

  const brandContext = buildBrandContext(ctx.brandDNA);
  const aiData = await callAI(
    [
      {
        role: "system",
        content: `You are a brand compliance reviewer using RLAIF methodology. Score content strictly against brand guidelines.${brandContext}`,
      },
      {
        role: "user",
        content: `Review the following content for brand alignment:\n\n${JSON.stringify(draftOutput.contents, null, 2)}`,
      },
    ],
    [reviewTool],
    { type: "function", function: { name: "review_content" } },
    "reviewer",
  );

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("Reviewer: no structured output");

  const review = JSON.parse(toolCall.function.arguments);

  // ── Conditional branching: if low score, loop back to drafter
  if (review.complianceScore < 3 && ctx.retryCount < ctx.maxRetries) {
    return {
      success: true,
      output: review,
      score: review.complianceScore,
      nextStep: "drafter", // branch back
    };
  }

  // Always run customizer for viral optimization on every platform
  return {
    success: true,
    output: review,
    score: review.complianceScore,
    nextStep: "customizer",
  };
}

async function runCustomizer(ctx: PipelineContext): Promise<StepResult> {
  const draftOutput = ctx.checkpoints.drafter;
  const reviewOutput = ctx.checkpoints.reviewer;

  const customizeTool = {
    type: "function",
    function: {
      name: "optimize_content",
      description: "Optimize content for viral reach on each platform",
      parameters: {
        type: "object",
        properties: {
          contents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                content: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                viralScore: { type: "number", description: "1-10 predicted virality" },
                optimizations: { type: "string", description: "What was changed and why" },
              },
              required: ["platform", "content", "viralScore"],
            },
          },
        },
        required: ["contents"],
      },
    },
  };

  const summarizedDraft = getCustomizerDraftSummary(draftOutput?.contents || []);
  const summarizedReview = getCustomizerReviewSummary(reviewOutput);
  const platformRules = ctx.platforms.map((platform) => {
    const spec = platformSpecs[platform];
    return `- ${platform}: ${spec?.instruction || "Rewrite it to feel native to the platform"} (max ${spec?.charLimit || 5000} chars)`;
  }).join("\n");

  const brandContext = buildBrandContext(ctx.brandDNA);
  const aiData = await callAI(
    [
      {
        role: "system",
        content: `You are an elite social content customizer. Rewrite every post so it feels native to its platform, highly engaging, and ready to publish.${brandContext}

PLATFORM RULES:
- Instagram: start with a stop-scroll hook, use short readable lines, strategic emojis, a clear save/share CTA, then hashtags at the end.
- X: be punchy and insight-led, use a thread only when the idea truly needs it, and avoid stuffing hashtags.
- LinkedIn: open with a strong professional hook, use one-sentence paragraphs, end with a conversation-starting question, and keep hashtags only at the end.
- YouTube: provide a curiosity-driven title plus a structured description with SEO-friendly context.
- Facebook: use emotional storytelling, pattern interrupts, and a share-worthy CTA.
- Google Business: keep it local, specific, action-oriented, and warm.

CRITICAL:
1. Keep each platform within its character limit.
2. Do not reuse the same phrasing across platforms.
3. Preserve the brand voice while improving hook strength, readability, shareability, and CTA clarity.
4. Return polished final copy, not notes.`,
      },
      {
        role: "user",
        content: `Rewrite these drafts using the review feedback below.

PLATFORM REQUIREMENTS:
${platformRules}

DRAFT CONTENT:
${JSON.stringify(summarizedDraft, null, 2)}

REVIEW FEEDBACK:
${JSON.stringify(summarizedReview, null, 2)}`,
      },
    ],
    [customizeTool],
    { type: "function", function: { name: "optimize_content" } },
    "customizer",
  );

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("Customizer: no structured output");

  const optimized = JSON.parse(toolCall.function.arguments);
  return { success: true, output: optimized, nextStep: "publisher" };
}

async function runPublisherStep(_ctx: PipelineContext): Promise<StepResult> {
  // Publisher is a human-in-the-loop step; we just mark it ready for approval
  return { success: true, output: { status: "awaiting_approval", message: "Content ready for human review and publishing" }, nextStep: "learner" };
}

async function runLearner(_ctx: PipelineContext): Promise<StepResult> {
  // Learner collects metrics; actual learning happens post-publish via analytics
  return { success: true, output: { status: "monitoring", message: "Learning agent monitoring for post-publish analytics" }, nextStep: null };
}

const STEP_HANDLERS: Record<StepName, (ctx: PipelineContext) => Promise<StepResult>> = {
  drafter: runDrafter,
  reviewer: runReviewer,
  customizer: runCustomizer,
  publisher: runPublisherStep,
  learner: runLearner,
};

// ── Retry wrapper ───────────────────────────────────────────────────────
async function executeWithRetry(stepName: StepName, ctx: PipelineContext, maxAttempts = STEP_MAX_ATTEMPTS[stepName]): Promise<StepResult> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await STEP_HANDLERS[stepName](ctx);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Step ${stepName} attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

      if (lastError.message === "RATE_LIMITED") {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      } else if (lastError.message === "CREDITS_EXHAUSTED") {
        throw lastError;
      } else if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError!;
}

// ── Main orchestrator ───────────────────────────────────────────────────
async function orchestrate(ctx: PipelineContext): Promise<any> {
  let currentStep: StepName | null = ctx.checkpoints._resumeFrom || "drafter";
  const errorLog: any[] = [];

  await updateRun(ctx.runId, { status: "running", current_step: currentStep });

  while (currentStep) {
    console.log(`▶ Running step: ${currentStep}`);
    await updateRun(ctx.runId, { current_step: currentStep, checkpoints: ctx.checkpoints });

    try {
      const result = await executeWithRetry(currentStep, ctx);

      // Save checkpoint
      ctx.checkpoints[currentStep] = result.output;
      if (result.score !== undefined) {
        ctx.checkpoints[`${currentStep}_score`] = result.score;
      }

      await updateRun(ctx.runId, { checkpoints: ctx.checkpoints });

      // ── Handle branching back to drafter (low compliance)
      if (currentStep === "reviewer" && result.nextStep === "drafter") {
        ctx.retryCount++;
        // Augment prompt with feedback
        ctx.prompt = `${ctx.prompt}\n\nIMPORTANT: Previous review scored ${result.score}/5. Feedback: ${result.output.reviewNotes}. Strictly follow brand guidelines.`;
        await updateRun(ctx.runId, { retry_count: ctx.retryCount, prompt: ctx.prompt });
        currentStep = "drafter";
        continue;
      }

      // ── Determine next step(s)
      if (Array.isArray(result.nextStep)) {
        // Parallel execution
        const parallelResults = await Promise.allSettled(
          result.nextStep.map((step) => executeWithRetry(step, ctx)),
        );

        for (let i = 0; i < result.nextStep.length; i++) {
          const r = parallelResults[i];
          const stepName = result.nextStep[i];
          if (r.status === "fulfilled") {
            ctx.checkpoints[stepName] = r.value.output;
          } else {
            errorLog.push({ step: stepName, error: r.reason?.message, timestamp: new Date().toISOString() });
          }
        }

        await updateRun(ctx.runId, { checkpoints: ctx.checkpoints, error_log: errorLog });
        currentStep = null; // parallel branch ends the linear chain
      } else {
        currentStep = result.nextStep as StepName | null;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errorLog.push({ step: currentStep, error: errMsg, timestamp: new Date().toISOString() });
      console.error(`Step ${currentStep} failed fatally:`, errMsg);

      // For non-critical steps, continue gracefully with what we have
      if (currentStep === "customizer" || currentStep === "publisher" || currentStep === "learner") {
        console.log(`Skipping failed step ${currentStep}, continuing with available data`);
        ctx.checkpoints[currentStep] = { skipped: true, error: errMsg };
        await updateRun(ctx.runId, { checkpoints: ctx.checkpoints, error_log: errorLog });
        // Move to next logical step or end
        if (currentStep === "customizer") { currentStep = "publisher"; continue; }
        if (currentStep === "publisher") { currentStep = "learner"; continue; }
        currentStep = null;
        continue;
      }

      // Critical steps (drafter, reviewer) cause full failure
      if (errMsg === "CREDITS_EXHAUSTED") {
        await updateRun(ctx.runId, { status: "failed", error_log: errorLog, checkpoints: { ...ctx.checkpoints, _resumeFrom: currentStep } });
        throw err;
      }

      await updateRun(ctx.runId, {
        status: "paused",
        error_log: errorLog,
        checkpoints: { ...ctx.checkpoints, _resumeFrom: currentStep },
      });

      throw err;
    }
  }

  // ── Assemble final result
  const finalContents = ctx.checkpoints.customizer?.contents || ctx.checkpoints.drafter?.contents || [];
  const finalResult = {
    contents: finalContents,
    reviewNotes: ctx.checkpoints.reviewer?.reviewNotes || "",
    complianceScore: ctx.checkpoints.reviewer?.complianceScore || ctx.checkpoints.reviewer_score || 0,
    platformFeedback: ctx.checkpoints.reviewer?.platformFeedback,
    viralScores: ctx.checkpoints.customizer?.contents?.map((c: any) => ({ platform: c.platform, score: c.viralScore })),
    retries: ctx.retryCount,
    stepsCompleted: Object.keys(ctx.checkpoints).filter((k) => !k.startsWith("_") && !k.endsWith("_score")),
  };

  await updateRun(ctx.runId, { status: "completed", result: finalResult });
  return finalResult;
}

// ── HTTP handler ────────────────────────────────────────────────────────
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
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { action, prompt, platforms, brandDNA, mediaDescriptions, runId } = await req.json();

    // ── Resume a paused run
    if (action === "resume" && runId) {
      const admin = getSupabaseAdmin();
      const { data: run } = await admin.from("pipeline_runs").select("*").eq("id", runId).eq("user_id", userId).single();
      if (!run) {
        return new Response(JSON.stringify({ error: "Run not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ctx: PipelineContext = {
        runId: run.id,
        userId,
        prompt: run.prompt,
        platforms: run.platforms,
        brandDNA: run.brand_dna,
        mediaDescriptions: run.media_descriptions || [],
        checkpoints: run.checkpoints || {},
        retryCount: run.retry_count,
        maxRetries: run.max_retries,
      };

      const result = await orchestrate(ctx);
      return new Response(JSON.stringify({ success: true, runId: run.id, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Start a new run
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();
    const targetPlatforms = platforms || Object.keys(platformSpecs);

    // Fetch latest learnings to feed into the pipeline
    let learningsContext = "";
    try {
      const { data: latestLearnings } = await supabaseAuth.from("content_learnings").select("insights").eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
      if (latestLearnings?.[0]?.insights) {
        const ins = latestLearnings[0].insights;
        const parts: string[] = [];
        if (ins.contentPatterns?.length) parts.push(`Content patterns that work: ${ins.contentPatterns.join("; ")}`);
        if (ins.optimalSchedule?.length) parts.push(`Best posting times: ${ins.optimalSchedule.join(", ")}`);
        if (ins.improvements?.length) parts.push(`Areas to improve: ${ins.improvements.join("; ")}`);
        if (ins.keyTakeaway) parts.push(`Key insight: ${ins.keyTakeaway}`);
        if (parts.length) learningsContext = `\n\nPAST PERFORMANCE LEARNINGS (use these to optimize content):\n${parts.join("\n")}`;
      }
    } catch { /* non-fatal */ }

    const { data: run, error: insertError } = await admin.from("pipeline_runs").insert({
      user_id: userId,
      prompt: prompt + learningsContext,
      platforms: targetPlatforms,
      brand_dna: brandDNA || null,
      media_descriptions: mediaDescriptions || [],
      status: "pending",
    }).select().single();

    if (insertError || !run) throw new Error(`Failed to create run: ${insertError?.message}`);

    const ctx: PipelineContext = {
      runId: run.id,
      userId,
      prompt: prompt + learningsContext,
      platforms: targetPlatforms,
      brandDNA: brandDNA || null,
      mediaDescriptions: mediaDescriptions || [],
      checkpoints: {},
      retryCount: 0,
      maxRetries: 3,
    };

    const result = await orchestrate(ctx);
    return new Response(JSON.stringify({ success: true, runId: run.id, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Orchestration error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "RATE_LIMITED" ? 429 : msg === "CREDITS_EXHAUSTED" ? 402 : 500;
    const userMsg = status === 429 ? "Rate limited. Please try again shortly."
      : status === 402 ? "Credits exhausted. Add funds at Settings > Workspace > Usage."
      : msg;
    return new Response(JSON.stringify({ error: userMsg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
