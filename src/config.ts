import dotenv from "dotenv";
dotenv.config();

export let AI_URL = process.env.AI_URL || "https://jmdjr.duckdns.org/";
export let AI_NAME = process.env.AI_NAME || "Jarvis";
export const MANAGERS: string[] = ['nearengineer'];
export let AI_MODEL = process.env.AI_MODEL || "llama3.2";

export function updateSetting(key: string, value: string) {
  if (key === "AI_URL") AI_URL = value;
  if (key === "AI_NAME") AI_NAME = value;
  if (key === "AI_MODEL") AI_MODEL = value;
  if (key === "MANAGERS") {
    const managers = value.split(",").map(id => id.trim());
    process.env.MANAGERS = managers.join(",");
    console.log(process.permission.has("fs"));
  }
}