import { PipelineStepError } from "./errors.js";

export async function sendDiscordMessage(webhookUrl, content) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new PipelineStepError(
      "DISCORD_NOTIFY",
      `Discord 웹훅 전송 실패: HTTP ${response.status} ${errorText}`
    );
  }
}
