import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, Partials } from "discord.js";
import { handleChat, handleGetSettings, handleMentionedChat, handleThreadMessage } from "./commands/chat";
import { handleSettings } from "./commands/settings";
import dotenv from "dotenv";
dotenv.config();

const Redact = "<redacted>";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Track which threads Jarvis is active in
let activeThreads = new Set<string>();

client.once("ready", () => {

  console.log("Jarvis is online!");
});

const commands = [
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with the AI.")
    .addStringOption((opt) =>
      opt.setName("message").setDescription("What to ask?").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Update bot settings")
    .addStringOption((opt) =>
      opt.setName("property").setDescription("Setting to update").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("value").setDescription("New value").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("getsettings")
    .setDescription("Get current bot settings")
];

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === "chat") return handleChat(interaction);
  if (interaction.commandName === "settings") return handleSettings(interaction);
  if (interaction.commandName === "getsettings") return handleGetSettings(interaction);
});

// Listen for follow-up messages in threads and treat as conversation continuation
client.on(Events.MessageCreate, async (msg) => {
  const isThread = msg.channel.isThread();
  console.log(`Received message in ${msg.channelId}: ${msg.content}`);
  if (msg.author.bot) return;

  if (msg.mentions.has(client.user!)) {
    const withoutMention = msg.content.replace(`<${client.user!.username}>`, "").trim();

    if (isThread && !activeThreads.has(msg.channelId)) {
      activeThreads = activeThreads.add(msg.channelId);
    }

    await handleMentionedChat(msg, withoutMention);
    console.log(`listing Active Threads: ${Array.from(activeThreads.values()).join(", ")}`);
    return;
  }
  const isInActiveThreads = activeThreads.has(msg.channelId);
  console.log(`Message in thread is ${isThread && isInActiveThreads ? "<active>" : Redact} - ${msg.channelId}: ${msg.content}`);
  console.log(`listing Active Threads: ${Array.from(activeThreads.values()).join(", ")}`);
  if (isThread && isInActiveThreads) {
    await handleThreadMessage(msg);
  }
});

async function registerCommands() {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    console.warn("Set DISCORD_BOT_TOKEN, CLIENT_ID, and GUILD_ID in .env to register commands.");
    return;
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands.map((c) => c.toJSON()) }
  );
  console.log("Slash commands registered.");
}

if (process.env.REGISTER_COMMANDS === "true") {
  registerCommands().catch(console.error);
}

client.login(process.env.DISCORD_BOT_TOKEN);