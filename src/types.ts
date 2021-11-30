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

interface TwitchApiChannelData {
    broadcaster_language: string;
    broadcaster_login: string;
    display_name: string;
    game_id: string;
    game_name: string;
    id: string;
    is_live: boolean;
    started_at: Date;
    thumbnail_url: string;
    title: string;
}

interface TwitchApiStreamData {
    game_id: string;
    game_name: string;
    id: string;
    is_mature: boolean;
    language: string;
    started_at: Date;
    thumbnail_url: string;
    title: string;
    type: string;
    user_id: string;
    user_login: string;
    user_name: string;
    viewer_count: number;
}

interface TwitchApiAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

interface TwitchApiPaginatedData<T> {
    data: T[];
    pagination: any;
}
