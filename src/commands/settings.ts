import { ChatInputCommandInteraction } from "discord.js";
import { AI_MODEL, AI_URL, updateSetting } from "../config";
import { isManager } from "../utils/permissions";

export async function handleSettings(interaction: ChatInputCommandInteraction) {
  if (!isManager(interaction)) {
    await interaction.reply({ content: `You don't have permission to change settings.` });
    return;
  }

  const property = interaction.options.getString("property", true);
  const value = interaction.options.getString("value", true);

  updateSetting(property, value);
  await interaction.reply({ content: `Setting ${property} updated to ${value}.` });
}

export async function handleGetSettings(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("ManageChannels") && !interaction.memberPermissions?.has("Administrator")) {
    await interaction.reply({ content: "You don't have permission to view settings." });
    return;
  }

  const settings = [
    `AI_URL: ${AI_URL}`,
    `AI_MODEL: ${AI_MODEL}`
  ].join("\n");

  await interaction.reply({ content: `Current Bot Settings:\n${settings}` });
}
