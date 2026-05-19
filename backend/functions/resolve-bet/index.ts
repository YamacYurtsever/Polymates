import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.0";
import { z } from "npm:zod@3.23.8";

const VerdictSchema = z.object({
  verdict: z.enum(["YES", "NO"]),
  reasoning: z.string().min(1).max(1200),
});

const SYSTEM_PROMPT = `You are The Honourable Judge in a friend-group betting court.
Rule on the binary question using the evidence provided. You MUST return YES or NO —
never abstain. If evidence is missing or ambiguous, rule on the most probable outcome
from the description and say so. Tone: sarcastic, witty, ≤120 words.`;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

const ANTHROPIC_MAX_FILE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageMediaType = (typeof IMAGE_TYPES)[number];

function isImageType(mime: string): mime is ImageMediaType {
  return IMAGE_TYPES.includes(mime as ImageMediaType);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { bet_id } = await req.json();
    if (!bet_id) return json({ error: "bet_id required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bet, error: betErr } = await supabase
      .from("bets")
      .select("id, title, description, status, closes_at")
      .eq("id", bet_id)
      .single();
    if (betErr || !bet) return json({ error: "bet not found" }, 404);

    const { data: existing } = await supabase
      .from("verdicts")
      .select("id")
      .eq("bet_id", bet_id)
      .maybeSingle();
    if (existing) return json({ ok: true, verdict: "already resolved" });
    if (bet.status === "closed") {
      // already closed, proceed to verdict
    } else if (bet.status === "open" && new Date(bet.closes_at) < new Date()) {
      const { error: closeErr } = await supabase
        .from("bets")
        .update({ status: "closed" })
        .eq("id", bet_id);
      if (closeErr) throw closeErr;
    } else {
      return json({ error: `bet status is ${bet.status}` }, 409);
    }

    const { data: evidence } = await supabase
      .from("evidence")
      .select("storage_path, caption, user_id")
      .eq("bet_id", bet_id);

    const content: Anthropic.ContentBlockParam[] = [
      {
        type: "text",
        text: `Question: ${bet.title}\n\nContext:\n${bet.description}\n\nEvidence follows.`,
      },
    ];

    for (const e of evidence ?? []) {
      const { data: file } = await supabase.storage.from("evidence").download(e.storage_path);
      if (!file) continue;

      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = file.type || "";

      if (bytes.length > ANTHROPIC_MAX_FILE_BYTES) {
        content.push({ type: "text", text: `[Evidence skipped: file too large (${Math.round(bytes.length / 1024 / 1024)}MB > 5MB limit)]` });
      } else {
        const b64 = toBase64(bytes);
        if (isImageType(mime)) {
          content.push({
            type: "image",
            source: { type: "base64", media_type: mime, data: b64 },
          });
        } else if (mime === "application/pdf") {
          content.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: b64 },
          });
        }
      }

      if (e.caption) content.push({ type: "text", text: `Caption: ${e.caption}` });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      tools: [
        {
          name: "deliver_verdict",
          description: "Deliver the final binary verdict.",
          input_schema: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["YES", "NO"] },
              reasoning: { type: "string", description: "≤120 words, sarcastic judge tone" },
            },
            required: ["verdict", "reasoning"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "deliver_verdict" },
    });

    const toolUse = msg.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return json({ error: "no tool_use in response" }, 502);
    }
    const parsed = VerdictSchema.parse(toolUse.input);

    const { error: vErr } = await supabase.from("verdicts").insert({
      bet_id,
      outcome: parsed.verdict.toLowerCase(),
      reasoning: parsed.reasoning,
    });
    if (vErr) throw vErr;

    const { error: rErr } = await supabase.rpc("resolve_bet", {
      p_bet_id: bet_id,
      p_outcome: parsed.verdict.toLowerCase(),
    });
    if (rErr) throw rErr;

    return json({ ok: true, verdict: parsed.verdict });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
