import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, Partials } from "discord.js";
import { handleChat, handleThreadMessage } from "./commands/chat";
import { handleSettings } from "./commands/settings";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

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
    )
];

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "chat") return handleChat(interaction);
  if (interaction.commandName === "settings") return handleSettings(interaction);
});

// Listen for follow-up messages in threads and treat as conversation continuation
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.isThread()) {
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