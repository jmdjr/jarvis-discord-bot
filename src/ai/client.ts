import fetch, { Response } from "node-fetch";
import { AI_URL } from "../config";

// Messages follow OpenAI-like format: [{role: 'user'|'assistant', content: string}]
export async function* sendChat(
  messages: { role: string; content: string }[],
  stream = false
): AsyncGenerator<string, void, unknown> {
  const res: Response = await fetch(`${AI_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, stream })
  });

  if (!stream) {
    const json = await res.json();
    yield json?.message?.content || "No response";
    return;
  }

  // Streaming: yield as text comes in (chunked response)
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) yield decoder.decode(value);
  }
}