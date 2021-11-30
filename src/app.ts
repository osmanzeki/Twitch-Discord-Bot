import { readFileSync, writeFileSync } from 'fs';
import { CronJob } from 'cron';
import { Client as DiscordClient } from 'discordx';
import {
    Channel,
    GuildChannel,
    Intents,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import axios from 'axios';

export class App {
    // Properties
    private cachedConfig: TwitchDiscordBotConfig = null;
    private discordClient: DiscordClient;

    // Cronjobs
    private checkForStreamsJob: CronJob;
    private updateAuthJob: CronJob;

    private get config() {
        if (this.cachedConfig === null) {
            let file = readFileSync('./config.json');
            this.cachedConfig = JSON.parse(file.toString());
        }

        return this.cachedConfig;
    }

    private updateConfigOnDisk() {
        // Save config with new data
        writeFileSync('./config.json', JSON.stringify(this.config));
    }

    public init() {
        // Initialize Discord client
        this.discordClient = new DiscordClient({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
            ],
            silent: false,
        });

        // Attach Discord client events
        this.discordClient.once('ready', async () => {
            console.log(`Logged in as ${this.discordClient.user.tag}!`);

            // Init bot commands
            await this.discordClient.clearApplicationCommands();
            await this.discordClient.initApplicationCommands();
            await this.discordClient.initApplicationPermissions();

            // Update the authorization key on startup
            this.updateAuthConfig();
        });

        this.discordClient.on('interactionCreate', (interaction) => {
            this.discordClient.executeInteraction(interaction);
        });

        // Initialize the cron jobs
        this.initJobs();

        // Start the timers
        this.updateAuthJob.start();
        this.checkForStreamsJob.start();
    }

    private initJobs() {
        this.checkForStreamsJob = new CronJob(this.config.cron, async () => {
            this.config.twitch.channels.map(async (chan, i) => {
                if (!chan.channelName) return;

                let streamData = await this.getStreams(
                    chan.channelName,
                    this.config.twitch.clientId,
                    this.config.twitch.authToken
                );

                if (streamData.data.length == 0) {
                    return;
                }

                streamData = streamData.data[0];

                // Get the channel data for the thumbnail image
                const channelData = await this.getChannelData(
                    chan.channelName,
                    this.config.twitch.clientId,
                    this.config.twitch.authToken
                );

                if (!channelData) {
                    return;
                }

                // Structure for the embed
                var sendEmbed = {
                    title: `🔴 ${streamData.user_name} is now live`,
                    description: streamData.title,
                    url: `https://www.twitch.tv/${streamData.user_login}`,
                    color: 6570404,
                    fields: [
                        {
                            name: 'Playing:',
                            value: streamData.game_name,
                            inline: true,
                        },
                        {
                            name: 'Viewers:',
                            value: streamData.viewer_count,
                            inline: true,
                        },
                        {
                            name: 'Twitch:',
                            value: `[Watch stream](https://www.twitch.tv/${streamData.user_login})`,
                        },
                        chan.discordServer
                            ? {
                                  name: 'Discord Server:',
                                  value: `[Join here](${chan.discordServer})`,
                              }
                            : {
                                  name: '** **',
                                  value: '** **',
                              },
                    ],
                    footer: {
                        text: streamData.started_at,
                    },
                    image: {
                        url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${
                            streamData.user_login
                        }-640x360.jpg?cacheBypass=${Math.random().toString()}`,
                    },
                    thumbnail: {
                        url: `${channelData.thumbnail_url}`,
                    },
                };

                // Get the assigned channel
                const guildChannel = this.discordClient.guilds.cache.get(
                    this.config.discord.serverId
                );

                // TODO: Find a better type than ANY here
                const sendChannel: any = guildChannel.channels.cache.get(
                    this.config.discord.channelId
                );

                if (chan.twitchStreamId == streamData.id) {
                    let msg = await sendChannel.messages.fetch(
                        chan.discordMessageId
                    );

                    // Update the title, game, viewer_count and the thumbnail
                    msg.edit({ embed: sendEmbed });
                } else {
                    // This is the message when a streamer goes live. It will tag the assigned role
                    await sendChannel.send({ embed: sendEmbed }).then((msg) => {
                        const channelObj = this.config.twitch.channels[i];

                        channelObj.discordMessageId = msg.id;
                        channelObj.twitchStreamId = streamData.id;

                        if (this.config.discord.roleId) {
                            sendChannel.send(
                                `<@&${this.config.discord.roleId}>`
                            );
                        }
                    });
                }
                // Save config with new data
                this.updateConfigOnDisk();
            });
        });

        // Update the authorization key every hour
        this.updateAuthJob = new CronJob('0 * * * *', async () =>
            this.updateAuthConfig()
        );
    }

    private async getChannelData(channelName, clientId, authkey) {
        try {
            var headers = {
                'client-id': clientId,
                Authorization: `Bearer ${authkey}`,
            };

            let body: string = await axios.get(
                `https://api.twitch.tv/helix/search/channels?query=${channelName}`,
                { headers: headers }
            );

            const channelTempData = JSON.parse(body).data;
            var doesExist = false;

            for (let i = 0; i < channelTempData.length; i++) {
                if (
                    channelTempData[i].broadcaster_login.toLowerCase() ==
                    channelName.toLowerCase()
                ) {
                    doesExist = true;
                    // TODO: Why parse twice here?
                    return JSON.parse(body).data[i];
                }
            }

            if (!doesExist) {
                return false;
            }
        } catch (err) {
            console.error(err);
        }
    }

    private async getTwitchAccessToken(clientId, clientSecret) {
        try {
            let body: string = await axios.post(
                `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
            );

            let accessToken = JSON.parse(body).access_token;
            return accessToken;
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    private async getStreams(channelName, clientId, authkey) {
        try {
            var headers = {
                'Client-Id': clientId,
                Authorization: `Bearer ${authkey}`,
            };

            let body: string = await axios.get(
                `https://api.twitch.tv/helix/streams?user_login=${channelName}`,
                { headers: headers }
            );

            return JSON.parse(body);
        } catch (err) {
            console.error(err);
        }
    }

    // Get a new authorization key and update the config
    private async updateAuthConfig() {
        // Get the auth key
        const authKey = await this.getTwitchAccessToken(
            this.config.twitch.clientId,
            this.config.twitch.secret
        );

        if (!authKey) {
            return;
        }

        // Write the new auth key
        this.config.twitch.authToken = authKey;

        // Save to disk
        this.updateConfigOnDisk();
    }
}
