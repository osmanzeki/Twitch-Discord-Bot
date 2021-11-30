interface DiscordConfig {
    serverId: string;
    token: string;
    channelId: string;
    roleId: string;
}

interface TwitchConfigChannel {
    channelName: string;
    twitchStreamId: string;
    discordServer: string;
    discordMessageId: string;
}

interface TwitchConfig {
    clientId: string;
    secret: string;
    authToken: string;
    channels: Array<TwitchConfigChannel>;
}

interface TwitchDiscordBotConfig {
    cron: string;
    discord: DiscordConfig;
    twitch: TwitchConfig;
}
