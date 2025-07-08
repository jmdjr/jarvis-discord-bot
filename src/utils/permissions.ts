import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { log } from "./log";

export function isManager(interaction: ChatInputCommandInteraction): boolean {
  // Only allow users with Manage Channels or Administrator
  const userId = interaction.user.id;

  log(`Checking if user ${userId} is a manager...`);
  
  if (interaction.guild?.ownerId === userId) return true;
  if (interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands, true)) return true;
  log(`User ${userId} is not a manager.`);
  return false;
}