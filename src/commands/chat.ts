import { Channel, ChatInputCommandInteraction, Client, Message, PublicThreadChannel } from "discord.js";
import { sendChat } from "../ai/client";
import { AI_MODEL, AI_NAME } from "../config";
import { log } from "../utils/log";

type AIMessage = { role: "user" | "assistant"; content: string };

export async function handleChat(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);
  const convo: AIMessage[] = [];
  convo.push({ role: "user", content: message });

  await interaction.reply(`${AI_NAME} is thinking...`);
  let fullResponse = "";
  for await (const chunk of sendChat(convo, { url: AI_MODEL, model: AI_NAME })) {
    fullResponse += chunk;
    await interaction.editReply(fullResponse);
  }
}

function dropAIName(message: string, client: Client): string {
  return message.replace(`<@${client.user!.id}>`, "").trim();
}

async function collectThreadMessages(msg: {channel: Channel, content: string}, client: Client): Promise<AIMessage[]> {
  const channel = msg.channel;
  const message = dropAIName(msg.content, client);

  if (!channel.isThread()) {
    return [{ role: "user", content: message }];
  }

  const convo: AIMessage[] = [];
  await channel.messages.fetch({ limit: 100 })
  .then(messages => {
    messages.forEach(msg => {
      if (!msg.author.bot) {
        convo.push({ role: "user", content: message });
      } 
      else if (msg.author.id === client.user!.id) {
        convo.push({ role: "assistant", content: message });
      }
    });
  });

  return convo.reverse();
}

export async function handleClientMessage(msg: Message, client: Client) {
  const isThread = msg.channel.isThread();
  const convo = await collectThreadMessages(msg, client);
  const replyMsg = await threadReply(isThread, msg);
  if(!replyMsg) {
    return;
  }
  
  log(`Reply message created in thread: ${replyMsg.id}`);
  await sendChatReply(convo, replyMsg);
}

async function sendChatReply(convo: AIMessage[], replyMsg: Message<true>) {
  let fullResponse = "";
  for await (const chunk of sendChat(convo, { url: AI_MODEL, model: AI_NAME })) {
    fullResponse += chunk;
    await replyMsg.edit(fullResponse);
  }
}

async function threadReply(isThread: boolean, msg: Message<boolean>) {
  if (isThread) {
    const thread = msg.channel as PublicThreadChannel<boolean>;
    if(thread.ownerId !== msg.client.user!.id) {
      return;
    }
    return await (msg.channel as PublicThreadChannel<boolean>).send(`${AI_NAME} is thinking...`);
  }

  const thread = await msg.startThread({
    name: `${msg.content.slice(0, 10)}...`,
    autoArchiveDuration: 60 * 5, // 5 hour
    reason: "Started conversation thread"
  });

  await thread.setAppliedTags([AI_NAME, AI_MODEL]);

  log(`Started thread ${thread.id} for conversation in channel ${msg.channelId}`);
  return await thread.send(`${AI_NAME} is thinking...`);
}
