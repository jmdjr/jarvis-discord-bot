import { ChatInputCommandInteraction } from "discord.js";
import { MANAGERS } from "../config";

export function isManager(interaction: ChatInputCommandInteraction): boolean {
  // Only allow users with Manage Channels or Administrator
  const userId = interaction.user.id;
  if (MANAGERS.includes(userId)) return true;

  return false;
}