# Fork Info

Based on the work of `Siddhartt`. Refactored the codebase for a slighlty more OOP structure as well as usage of TypeScript as the main language for the bot.

# To-Do

- [ ] Replace `config.json` with Environment Variables (dotenv) ?

# Twitch Discord Bot

This Discord bot will automatically send a message and tag the assigned role whenever a streamer went live.

The notifications will update every `x` minutes (default is every minute) while the streamer is live.

# How does it work?

This Discord bot uses [The Official Twitch Api](https://dev.twitch.tv/docs/api/). You will be able to assign unlimited streamers to the bot. The bot uses the api to fetch the channel data to see if the streamer is live. If the streamer is live it will send a message in the assigned channel and it will also tag the assigned role. You will be able to choose the update time. If the streamer is still live the bot will update the message after X amount of time (default 10 minutes).

<img src="https://cdn.discordapp.com/attachments/738800765023551660/821513567265226803/unknown.png" />

Check out [stoiss2's channel on Twitch](https://www.twitch.tv/stoiss2)

# Installation

First you will have to clone the project.

```console
$ git clone https://github.com/osmanzeki/Twitch-Discord-Bot
```

After that open the config.json file

```console
{
    "cron": "* * * * *",
    "discord": {
        "serverId": "DISCORD_GUILD_ID (REQUIRED)",
        "token": "DISCORD_API_BOT_TOKEN (REQUIRED)",
        "channelId": "CHANNEL_ID (REQUIRED)",
        "roleId": "ROLE_ID (OPTIONAL)"
    },
    "twitch": {
        "clientId": "TWITCH_API_CLIENT_ID (REQUIRED)",
        "secret": "TWITCH_API_SECRET (REQUIRED)",
        "authToken": "",
        "channels": [
            {
                "channelName": "STREAMER_NAME (REQUIRED)",
                "twitchStreamId": "",
                "discordServer": "DISCORD_SERVER_INVITE_URL (OPTIONAL)",
                "discordMessageId": ""
            }
        ]
    }
}
```

## Edit Config.json

| Config                  | Description                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **`cron`**              | Enter your Update/check interval here ([Cron Guru](https://crontab.guru/)).                                                       |
| **`discord.serverId`**  | Copy and past your Discord server ID here.                                                                                        |
| **`discord.token`**     | Enter your [Discord bot token](https://discord.com/developers/applications) here.                                                 |
| **`discord.channelId`** | Copy and Paste the Discord channel ID here (The notifications will be send in this channel).                                      |
| **`discord.roleId`**    | Copy and past the Discord Role ID here (This field is NOT required. Please assign "" to this if you don't want to tag any roles). |
| **`twitch.clientId`**   | Enter the Twitch application client ID here ([Twitch Developer Console](https://dev.twitch.tv/console/apps)).                     |
| **`twitch.secret`**     | Generate a api token on the Twitch application page.                                                                              |

> NOTE:
>
> Do **NOT** add anything in the fields that are already empty. These fields will automatically update.
>
> Some of values in the `config.json` template have "(OPTIONAL)" in it. If you are not using this replace it with an empty string.
>
> `"DISCORD_SERVER_INVITE_URL (OPTIONAL)" --> ""`

## Add streamers

In the config.json there is a channels array. If you want to add streamers you just add new objects to this array.

```console
{
   "channelName": "STREAMER_NAME (REQUIRED)",
   "discordServer": "DISCORD_SERVER_INVITE_URL (OPTIONAL)",
   "twitchStreamId": "",
   "discordMessageId": ""
}
```

-   channelName - Enter the streamer login name here. This name is the same as the name in the channel URL.  
    Example:
    ```
    URL = https://www.twitch.tv/stoiss2
    channelName = stoiss2
    ```
-   discordServer - This field is not required but if the Streamer has their own Discord server you could add the invite url here.

An array with multiple streamers will look something like this:

```console
{
   "channelName": "STREAMER1",
   "twitchStreamId": "",
   "discordServer": "Some Discord invite url here",
   "discordMessageId": ""
},
{
   "channelName": "STREAMER2",
   "twitchStreamId": "",
   "discordServer": "",
   "discordMessageId": ""
}
```

## Dependencies

Make sure to install the dependencies before running the app:

```console
$ npm install
```

## Run the bot

Copy and rename the `config.dev.json` to `config.json`.

After you updated the newly-made `config.json` with the appropriate data and installed the dependencies you can run the final command.

```console
$ npm start
```

Congratulations! You have successfully setup the bot.
