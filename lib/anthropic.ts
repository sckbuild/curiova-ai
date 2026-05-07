// SERVER ONLY — never import this in client components
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function callClaude(
  userPrompt: string,
  systemPrompt: string,
  maxTokens = 1024,
  timeoutMs = 15_000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );
    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type from Claude");
    return content.text;
  } finally {
    clearTimeout(timer);
  }
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function safeParseJSON<T>(text: string): T {
  return JSON.parse(stripMarkdown(text)) as T;
}
