import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, Partials } from "discord.js";
import { handleChat, handleClientMessage } from "./commands/chat";
import { handleGetSettings, handleSettings } from "./commands/settings";
import dotenv from "dotenv";
import { log, logContext } from "./utils/log";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
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

client.once(Events.ClientReady, () => {
  logContext("jarvis");
  log("Jarvis is online!");
});

client.on(Events.InteractionCreate, async (interaction) => {
  logContext("InteractionCreate");
  log(`${interaction.user.tag} in ${interaction.guildId}`);
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === "chat") return handleChat(interaction);
  if (interaction.commandName === "settings") return handleSettings(interaction);
  if (interaction.commandName === "getsettings") return handleGetSettings(interaction);
});

// Listen for follow-up messages in threads and treat as conversation continuation
client.on(Events.MessageCreate, async (msg) => {
  const isThread = msg.channel.isThread();
  const botMentioned = msg.mentions.has(client.user!);

  logContext("MessageCreate");
  log(`[${msg.author.bot ? "bot" : "user"}:<${msg.author.username}>|[${isThread ? "thread" : ""}${botMentioned? "" : ""}]sent in ${msg.channelId}:\n${msg.content}\n`);
  if (msg.author.bot) {
    // lets not reply to bot messages, as they aren't to talk to themselves... yet.
    return;
  }

  if (msg.mentions.has(client.user!) || isThread) {
    log(`mention found of client.user: ${client.user!.id} - ${client.user!.username}`);
    await handleClientMessage(msg, client);
    return;
  }
});

async function registerCommands() {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    console.warn("Set DISCORD_BOT_TOKEN, CLIENT_ID, and GUILD_ID in .env to register commands.");
    return;
  }

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands.map((c) => c.toJSON()) }
  );

  log("Slash commands registered.");
}

if (process.env.REGISTER_COMMANDS === "true") {
  registerCommands().catch(console.error);
}

client.login(process.env.DISCORD_BOT_TOKEN);