//-----------------------------------------------------------------
// Decorator Metadata
//-----------------------------------------------------------------

import 'reflect-metadata';

//-----------------------------------------------------------------
// External Dependencies
//-----------------------------------------------------------------

import { readFileSync, writeFileSync } from 'fs';
import { CronJob } from 'cron';
import { Intents } from 'discord.js';
import { Client as DiscordClient } from 'discordx';
import { importx } from '@discordx/importer';
import axios from 'axios';

//-----------------------------------------------------------------
// Internal Dependencies
//-----------------------------------------------------------------

//-----------------------------------------------------------------
// Types
//-----------------------------------------------------------------

import {
    TwitchApiAuthResponse,
    TwitchApiChannelData,
    TwitchApiStreamData,
    TwitchApiPaginatedData,
    TwitchConfigChannel,
    DiscordConfig,
    TwitchConfig,
    TwitchDiscordBotConfig,
} from './types';

//-----------------------------------------------------------------
// Module
//-----------------------------------------------------------------

export class App {
    //-----------------------------------------------------------------
    // Properties
    //-----------------------------------------------------------------

    private discordClient: DiscordClient;
    private cachedConfig: TwitchDiscordBotConfig = null;

    // Cronjobs
    private checkForStreamsJob: CronJob;
    private updateAuthJob: CronJob;

    //-----------------------------------------------------------------
    // Accessors
    //-----------------------------------------------------------------

    private get config() {
        if (this.cachedConfig === null) {
            let file = readFileSync('./config.json');
            this.cachedConfig = JSON.parse(file.toString());
        }

        return this.cachedConfig;
    }

    //-----------------------------------------------------------------
    // Lifecycle
    //-----------------------------------------------------------------

    public async init() {
        // Initialize Discord client
        this.discordClient = new DiscordClient({
            botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES,
            ],
        });

        // Attach Discord client events
        this.discordClient.once('ready', async () => {
            console.log(`Logged in as ${this.discordClient.user.tag}!`);

            // Make sure all guilds are in cache
            await this.discordClient.guilds.fetch();

            // Init bot commands
            await this.discordClient.clearApplicationCommands();
            await this.discordClient.initApplicationCommands({
                global: { log: true },
                guild: { log: true },
            });
            await this.discordClient.initApplicationPermissions(true);

            // Update the authorization key on startup
            this.refreshTwitchAuthConfig();

            // Initialize the cron jobs
            this.initJobs();

            // Start the timers
            this.updateAuthJob.start();
            this.checkForStreamsJob.start();

            // Do an immediate check for streams on the first launch
            this.checkForStreams();

            console.log('>> Bot started');
        });

        this.discordClient.on('interactionCreate', (interaction) => {
            this.discordClient.executeInteraction(interaction);
        });

        // Log the Discord bot in
        await importx(__dirname + '/{events,commands}/**/*.{ts,js}');
        await this.discordClient.login(this.config.discord.token);
    }

    //-----------------------------------------------------------------
    // Methods
    //-----------------------------------------------------------------

    private initJobs() {
        this.checkForStreamsJob = new CronJob(this.config.cron, async () => this.checkForStreams());

        // Update the authorization key every hour
        this.updateAuthJob = new CronJob('0 * * * *', async () => this.refreshTwitchAuthConfig());
    }

    private updateConfigOnDisk() {
        // Save config with new data
        writeFileSync('./config.json', JSON.stringify(this.config));
    }

    // Get a new authorization key and update the config
    private async refreshTwitchAuthConfig() {
        try {
            // Get the auth key
            const authKey = await this.getTwitchAccessToken(
                this.config.twitch.clientId,
                this.config.twitch.secret
            );

            if (!authKey) {
                throw new Error('Could not get Twitch Auth Token.');
            }

            // Write the new auth key
            this.config.twitch.authToken = authKey;

            // Save to disk
            this.updateConfigOnDisk();
        } catch (err) {
            console.error(err);
            // exit(1);
        }
    }

    //-----------------------------------------------------------------
    // Twitch
    //-----------------------------------------------------------------

    private async checkForStreams() {
        this.config.twitch.channels.map(async (channel, channelIndex) => {
            if (!channel.channelName) return;

            let streams = await this.getTwitchStreams(
                channel.channelName,
                this.config.twitch.clientId,
                this.config.twitch.authToken
            );

            if (streams && streams.data && streams.data.length == 0) {
                return;
            }

            let streamData = streams.data[0];

            // Get the channel data for the thumbnail image
            const channelData: TwitchApiChannelData = await this.getTwitchChannelData(
                channel.channelName,
                this.config.twitch.clientId,
                this.config.twitch.authToken
            );

            if (!channelData) {
                return;
            }

            // Send or update stream message on the Discord channel
            this.sendOrUpdateMessageOnDiscord(channelIndex, streamData, channelData);
        });
    }

    private async getTwitchChannelData(channelName: string, clientId: string, authKey: string) {
        try {
            let headers = {
                'client-id': clientId,
                Authorization: `Bearer ${authKey}`,
            };

            let body = await axios.get<TwitchApiPaginatedData<TwitchApiChannelData>>(
                `https://api.twitch.tv/helix/search/channels?query=${channelName.toLowerCase()}`,
                { headers: headers }
            );

            if (body && body.data) {
                const foundChannels = body.data.data;
                const targetChannelName = channelName.toLowerCase();

                const targetChannelndex = foundChannels.findIndex((channel) => {
                    return channel.broadcaster_login.toLowerCase() === targetChannelName;
                });

                if (targetChannelndex != -1) {
                    return foundChannels[targetChannelndex];
                } else {
                    return null;
                }
            } else {
                throw new Error('Could not load Twitch Channel data.');
            }
        } catch (err) {
            console.error(err);
            // exit(1);
        }
    }

    private async getTwitchAccessToken(clientId: string, clientSecret: string) {
        try {
            let body = await axios.post<TwitchApiAuthResponse>(
                `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
            );

            if (body && body.data) {
                return body.data.access_token;
            } else {
                throw new Error('Could not get Twitch Access Token.');
            }
        } catch (err) {
            console.error(err);
            // exit(1);
        }
    }

    private async getTwitchStreams(channelName: string, clientId: string, authKey: string) {
        try {
            let headers = {
                'Client-Id': clientId,
                Authorization: `Bearer ${authKey}`,
            };

            let body = await axios.get<TwitchApiPaginatedData<TwitchApiStreamData>>(
                `https://api.twitch.tv/helix/streams?user_login=${channelName}`,
                { headers: headers }
            );

            if (body && body.data) {
                return body.data;
            } else {
                throw new Error('Could not get Twitch stream data.');
            }
        } catch (err) {
            console.error(err);
            // exit(1);
        }
    }

    //-----------------------------------------------------------------
    // Discord
    //-----------------------------------------------------------------

    private async sendOrUpdateMessageOnDiscord(
        channelIndex: number,
        streamData: TwitchApiStreamData,
        channelData: TwitchApiChannelData
    ) {
        try {
            let channel = this.config.twitch.channels[channelIndex];

            let embedFields = [
                {
                    name: 'Playing:',
                    value: streamData.game_name,
                    inline: true,
                },
                {
                    name: 'Viewers:',
                    value: streamData.viewer_count.toString(),
                    inline: true,
                },
                {
                    name: 'Twitch:',
                    value: `[Watch the Stream](https://www.twitch.tv/${streamData.user_login})`,
                },
            ];

            // Add the streamers Discord server as a field, if it was mention in the configs
            if (channel.discordServer) {
                embedFields.push({
                    name: 'Discord Server:',
                    value: `[Join the Discord](${channel.discordServer})`,
                });
            }

            // Structure for the embed
            let sendEmbed = {
                title: `🔴 ${streamData.user_name} is now live`,
                description: streamData.title,
                url: `https://www.twitch.tv/${streamData.user_login}`,
                color: 6570404,
                fields: embedFields,
                // footer: {
                //     text: `Stream started at: ${new Date(streamData.started_at)}`,
                // },
                image: {
                    url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${
                        streamData.user_login
                    }-640x360.jpg?cacheBypass=${Math.random().toString()}`,
                },
                thumbnail: {
                    url: `${channelData.thumbnail_url}`,
                },
                // timestamp: new Date(),
            };

            // Get the assigned channel
            const guildChannel = this.discordClient.guilds.cache.get(this.config.discord.serverId);

            // TODO: Find a better type than ANY here
            const sendChannel: any = guildChannel.channels.cache.get(this.config.discord.channelId);

            if (channel.twitchStreamId == streamData.id) {
                // Update the title, game, viewer_count and the thumbnail
                try {
                    console.log('Updating stream notification message');

                    let msg = await sendChannel.messages.fetch(channel.discordMessageId);
                    if (msg) {
                        await msg.edit({ embeds: [sendEmbed] });
                    }
                } catch (err) {
                    console.log(
                        'The stream notification message seems to have been deleted. It will be reposted on the next notification cycle.'
                    );

                    // Empty the saved stream ID so that we can repost the message on the next run
                    this.config.twitch.channels[channelIndex].twitchStreamId = '';
                }
            } else {
                // This is the message when a streamer goes live. It will tag the assigned role
                let msg = await sendChannel.send({ embeds: [sendEmbed] });

                const channelObj = this.config.twitch.channels[channelIndex];

                channelObj.discordMessageId = msg.id;
                channelObj.twitchStreamId = streamData.id;

                // if (this.config.discord.roleId) {
                //     sendChannel.send(`<@&${this.config.discord.roleId}>`);
                // }
            }

            // Save config with new data
            this.updateConfigOnDisk();
        } catch (err) {
            console.error(err);
        }
    }
}
