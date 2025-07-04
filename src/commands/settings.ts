import { ChatInputCommandInteraction } from "discord.js";
import { updateSetting } from "../config";
import { isManager } from "../utils/permissions";

export async function handleSettings(interaction: ChatInputCommandInteraction) {
  if (!isManager(interaction)) {
    await interaction.reply({ content: "You don't have permission to change settings.", ephemeral: true });
    return;
  }

  const property = interaction.options.getString("property", true);
  const value = interaction.options.getString("value", true);

  updateSetting(property, value);
  await interaction.reply({ content: `Setting ${property} updated to ${value}.`, ephemeral: true });
}