export interface DiscordConfig {
    serverId: string;
    token: string;
    channelId: string;
    roleId: string;
}

export interface TwitchConfigChannel {
    channelName: string;
    twitchStreamId: string;
    discordServer: string;
    discordMessageId: string;
}

export interface TwitchConfig {
    clientId: string;
    secret: string;
    authToken: string;
    channels: Array<TwitchConfigChannel>;
}

export interface TwitchDiscordBotConfig {
    cron: string;
    discord: DiscordConfig;
    twitch: TwitchConfig;
}

export interface TwitchApiChannelData {
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

export interface TwitchApiStreamData {
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

export interface TwitchApiAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface TwitchApiPaginatedData<T> {
    data: T[];
    pagination: any;
}
