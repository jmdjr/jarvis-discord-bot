import fetch, { Response } from "node-fetch";
import { AI_URL } from "../config";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  message?: {
    content: string;
  };
  // Add other fields as needed if your backend returns more
}

// Type guard for AIResponse
function isAIResponse(obj: any): obj is AIResponse {
  return typeof obj === "object" && obj !== null && typeof obj.message?.content === "string";
}

export async function* sendChat(
  messages: AIMessage[],
  stream = false
): AsyncGenerator<string, void, unknown> {
  let response: Response;
  try {
    response = await fetch(`${AI_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, stream }),
    });
  } catch (err) {
    yield `Error: Unable to reach AI backend (${err})`;
    return;
  }

  if (!response.ok) {
    yield `Error: AI backend returned ${response.status} ${response.statusText}`;
    return;
  }

  if (!stream) {
    let json: unknown;
    try {
      json = await response.json();
    } catch (err) {
      yield `Error: Failed to parse AI response as JSON (${err})`;
      return;
    }
    if (isAIResponse(json)) {
      yield json.message?.content ?? "";
    } else {
      yield "Error: AI response in unexpected format.";
    }
    return;
  }

  // Streaming: yield as text comes in (chunked response)
  if (!response.body) {
    yield "Error: No stream returned by AI backend.";
    return;
  }
  const decoder = new TextDecoder();
  for await (const chunk of response.body as AsyncIterable<Buffer>) {
    yield decoder.decode(chunk);
  }
}