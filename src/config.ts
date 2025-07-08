import dotenv from "dotenv";
import { log } from "./utils/log";
dotenv.config();

export let AI_URL = process.env.AI_URL || "https://jmdjr.duckdns.org/";
export let AI_NAME = process.env.AI_NAME || "Jarvis";
export let AI_MODEL = process.env.AI_MODEL || "llama3.2";

export function updateSetting(key: string, value: string) {
  if (key === "AI_URL") AI_URL = value;
  if (key === "AI_MODEL") AI_MODEL = value;
}