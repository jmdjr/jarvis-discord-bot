import fetch, { Response } from "node-fetch";
import { AI_MODEL, AI_URL, } from "../config";

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
  return typeof obj === "object" 
      && typeof obj.message?.content === "string";
}

export async function* sendChat(
  messages: AIMessage[],
  model: {url: string, model: string} = {url: AI_URL, model: AI_MODEL},
): AsyncGenerator<string, void, unknown> {
  let response: Response;
  try {
    response = await fetch(`${model.url}api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, stream: true, model: model.model }),
    });
  } catch (err) {
    yield `Error: Unable to reach AI backend (${err})`;
    return;
  }

  if (!response.ok) {
    yield `Error: AI backend returned ${response.status} ${response.statusText}`;
    return;
  }

  // Streaming: yield as text comes in (chunked response)
  if (!response.body) {
    yield "Error: No stream returned by AI backend.";
    return;
  }
  
  const decoder = new TextDecoder();
  for await (const chunk of response.body as AsyncIterable<Buffer>) {
    // log("Received chunk:", chunk);
    let chunkText = decoder.decode(chunk);
    // log("Decoded chunk text:", chunkText);
    // Check if chunkText contains a newline character, sign of a list of json objects
    if (chunkText.includes("\n")) {
      // Split by newlines and yield each JSON object
      const jsonObjects = chunkText.split("\n").filter(line => line.trim() !== "");
      const streamedMessages = [];
      // Parse each JSON object and concat to a string
      for (const jsonObject of jsonObjects) {
        try {
          const parsedObject = JSON.parse(jsonObject);
          if (isAIResponse(parsedObject)) {
            streamedMessages.push(parsedObject.message?.content ?? "");
          }
        } catch (err) {
          console.error("Error parsing JSON object:", err);
        }
      }
      yield streamedMessages.join("");
    }
    else {
      const json = JSON.parse(chunkText);
      if (isAIResponse(json)) {
        yield json.message?.content ?? "";
      }
    }
  }
}