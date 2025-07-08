# Jarvis Discord Bot

A Discord bot for chatting with your personal AI (Ollama/HuggingFace) via `/chat` and managing settings with `/settings`.

## Features

- `/chat <message>`: Converses with your AI, retains context per-thread.
- `/settings <property> <value>`: Update AI_URL, AI_NAME (managers/admins only).
- Continues conversations in Discord threads.

## Setup

1. Clone this repo and install dependencies:

   ```bash
   git clone https://github.com/jmdjr/jarvis-discord-bot.git
   cd jarvis-discord-bot
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your credentials:

   ```
   cp .env.example .env
   # Edit .env to set your tokens and config
   ```

3. Build and start the bot:

   ```bash
   npm run build
   npm start
   ```

4. To register slash commands for your guild (server):

   ```bash
   npm run build && REGISTER_COMMANDS=true npm start
   ```

## Extending

- Add new AI backends (HuggingFace, etc.) in `src/ai/client.ts`.
- Add more commands in `src/commands/`.

## License

MIT