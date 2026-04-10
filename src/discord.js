import { PipelineStepError } from "./errors.js";

const DISCORD_TIMEOUT_MS = 10000;
const DISCORD_CONTENT_LIMIT = 2000;

async function postDiscordChunk(webhookUrl, content) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DISCORD_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new PipelineStepError(
        "DISCORD_NOTIFY",
        `Discord webhook send failed: HTTP ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new PipelineStepError(
        "DISCORD_NOTIFY",
        `Discord webhook send failed: timeout ${DISCORD_TIMEOUT_MS}ms`
      );
    }

    if (error instanceof PipelineStepError) {
      throw error;
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new PipelineStepError("DISCORD_NOTIFY", `Discord webhook send failed: ${detail}`, error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendDiscordMessage(webhookUrl, content) {
  const text = content ?? "";
  const chunks = [];

  if (text.length === 0) {
    chunks.push("");
  } else {
    for (let start = 0; start < text.length; start += DISCORD_CONTENT_LIMIT) {
      chunks.push(text.slice(start, start + DISCORD_CONTENT_LIMIT));
    }
  }

  for (const chunk of chunks) {
    await postDiscordChunk(webhookUrl, chunk);
  }
}
