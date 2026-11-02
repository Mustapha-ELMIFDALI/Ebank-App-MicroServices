# Connect Telegram and Discord

Both connectors are already coded in `ebank-bot`. Each one stays off while its token is empty in `.env`.
They are closed by default: only the user ids you list can talk to them, otherwise a bot would be a way
around the login of the web application.

| Variable in `.env` | Where it comes from |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_ALLOWED_USERS` | your numeric Telegram id (the bot tells you) |
| `DISCORD_BOT_TOKEN` | Discord Developer Portal |
| `DISCORD_ALLOWED_USERS` | your numeric Discord id (the bot tells you) |

## Telegram

1. In Telegram, open **@BotFather** and send `/newbot`.
2. Choose a name, then a unique username that ends with `bot`.
3. Copy the token into `.env`, after `TELEGRAM_BOT_TOKEN=`.
4. Restart (see below), open your bot and send `/start`. It answers with your id.
5. Put the id after `TELEGRAM_ALLOWED_USERS=` (separate several ids with commas) and restart.
6. Ask: `Liste des clients`.

## Discord

1. Open <https://discord.com/developers/applications> and create an application.
2. **Bot** > **Reset Token**. Copy it into `.env`, after `DISCORD_BOT_TOKEN=`.
3. Still in **Bot**, turn on **Message Content Intent** and save. The bot cannot connect without it.
4. **OAuth2** > **URL Generator**: select the scope `bot`, then the permissions *View Channels*,
   *Send Messages* and *Read Message History*. Open the generated link and add the bot to your server.
5. Restart, then send the bot a direct message, or mention it on the server. It answers with your id.
6. Put the id after `DISCORD_ALLOWED_USERS=` and restart.
7. Ask, in a direct message or with a mention: `@your-bot liste des comptes bancaires`.

## Restart

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
```

`.run/ebank-bot.log` shows `Telegram bot is listening` and `Discord bot is connecting`.
With a wrong token it shows which connector is disabled, and the web chatbot keeps working.

Never put a token in `application.properties` and never commit `.env`.
