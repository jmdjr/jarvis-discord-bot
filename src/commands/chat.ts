import { ChatInputCommandInteraction, Message } from "discord.js";
import { sendChat } from "../ai/client";
import { AI_NAME } from "../config";

const conversationMap = new Map<string, { role: string; content: string }[]>();

export async function handleChat(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);
  const threadId = interaction.channelId;
  const convo = conversationMap.get(threadId) || [];
  convo.push({ role: "user", content: message });

  await interaction.reply(`${AI_NAME} is thinking...`);

  let fullResponse = "";
  for await (const chunk of sendChat(convo, true)) {
    fullResponse += chunk;
    await interaction.editReply(fullResponse);
  }

  convo.push({ role: "assistant", content: fullResponse);
  conversationMap.set(threadId, convo);
}

// Continuation for messages in thread (not just the command)
export async function handleThreadMessage(msg: Message) {
  if (!msg.thread) return;
  const threadId = msg.channelId;
  const convo = conversationMap.get(threadId) || [];
  convo.push({ role: "user", content: msg.content });

  let fullResponse = "";
  for await (const chunk of sendChat(convo, true)) {
    fullResponse += chunk;
    await msg.reply(fullResponse);
  }

  convo.push({ role: "assistant", content: fullResponse });
  conversationMap.set(threadId, convo);
}