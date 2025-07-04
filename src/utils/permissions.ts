import { ChatInputCommandInteraction } from "discord.js";

export function isManager(interaction: ChatInputCommandInteraction): boolean {
  // Only allow users with Manage Channels or Administrator
  return (
    interaction.memberPermissions?.has("ManageChannels") ||
    interaction.memberPermissions?.has("Administrator")
  );
}