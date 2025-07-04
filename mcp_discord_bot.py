import discord
import requests
import os

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
AI_API_URL = "http://localhost:5000/ask"

class MCPBot(discord.Client):
    async def on_ready(self):
        print(f'Logged in as {self.user}')

    async def on_message(self, message):
        if message.author == self.user:
            return

        if message.content.startswith('!ask '):
            user_query = message.content[len('!ask '):]
            try:
                response = requests.post(AI_API_URL, json={"query": user_query})
                reply = response.json().get("answer", "No response from AI.")
            except Exception as e:
                reply = f"Error: {e}"

            await message.channel.send(reply)

intents = discord.Intents.default()
intents.messages = True

client = MCPBot(intents=intents)
client.run(TOKEN)