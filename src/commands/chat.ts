import { ChatInputCommandInteraction, Collection, Message } from "discord.js";
import { sendChat } from "../ai/client";
import { AI_URL, AI_NAME, MANAGERS } from "../config";

type AIMessage = { role: "user" | "assistant"; content: string };
const conversationMap = new Collection<string, AIMessage[]>();

export async function handleChat(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);
  const threadId = interaction.channelId;
  const convo = conversationMap.get(threadId) || [];
  convo.push({ role: "user", content: message });

  await interaction.reply(`${AI_NAME} is thinking...`);
  await interaction.fetchReply(); // Ensure the reply is sent before streaming
  let fullResponse = "";
  for await (const chunk of sendChat(convo, true)) {
    fullResponse += chunk;
    await interaction.editReply(fullResponse);
  }

  convo.push({ role: "assistant", content: fullResponse });
  conversationMap.set(threadId, convo);
}

// Continuation for messages in thread (not just the command)
export async function handleThreadMessage(msg: Message) {
  const threadId = msg.channelId;
  const isBot = msg.author.bot;

  console.group(`Thread message in ${threadId}${isBot ? " (bot)" : ""}: ${msg.content}`);
  if (isBot) return; // Ignore bot messages

  const convo = conversationMap.get(threadId) || [];
  convo.push({ role: "user", content: msg.content });

  let fullResponse = "";
  console.log(`Starting chat in thread ${threadId}`);
  for await (const chunk of sendChat(convo, true)) {
    fullResponse += chunk;
    await msg.reply(fullResponse);
  }

  convo.push({ role: "assistant", content: fullResponse });
  conversationMap.set(threadId, convo);
}

export async function handleMentionedChat(msg: Message, withoutMention: string) {
  const convoKey = msg.channelId;
  const convo = conversationMap.get(convoKey) || [];
  convo.push({ role: "user", content: withoutMention });
  let replyMsg;
  console.group(`Bot Mentioned chat in ${msg.channelId}: ${conversationMap.size} conversations and ${convo.length} messages`);

  if(msg.channel.isThread()) {
    replyMsg = await msg.reply(`${AI_NAME} is thinking...`);
  }
  else {
    const thread = await msg.startThread({
      name: `${AI_NAME} Conversation`,
      autoArchiveDuration: 60, // 1 hour
      reason: "Started conversation thread",
    });

    console.log(`Started thread ${thread.id} for conversation in channel ${msg.channelId}`);
    replyMsg = await thread.send(`${AI_NAME} is thinking...`);
  }

  let fullResponse = "";
  for await (const chunk of sendChat(convo, true)) {
    fullResponse += chunk;
    await replyMsg.edit(fullResponse);
  }

  convo.push({ role: "assistant", content: fullResponse });
  conversationMap.set(convoKey, convo);
  console.groupEnd();
  console.log(`Conversation in ${msg.channelId} updated with ${convo.length} messages. Total Map: ${conversationMap.size} conversations.`);

  if (!msg.channel.isThread()) {
    await msg.react("🤖"); // React to indicate AI response
  }
}

export async function handleGetSettings(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("ManageChannels") && !interaction.memberPermissions?.has("Administrator")) {
    await interaction.reply({ content: "You don't have permission to view settings.", ephemeral: true });
    return;
  }
  
  const settings = [
    `AI_URL: ${AI_URL}`,
    `AI_NAME: ${AI_NAME}`,
    `MANAGERS: ${MANAGERS.length ? MANAGERS.join(", ") : "None"}`
  ].join("\n");

  await interaction.reply({ content: `Current Bot Settings:\n${settings}`, ephemeral: true });
}