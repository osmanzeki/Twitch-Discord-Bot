import axios from 'axios';
import { CronJob } from 'cron';
import { configManager } from '../config';
import { discordManager } from '../discord/discord';

import {
    TwitchApiAuthResponse,
    TwitchApiChannelData,
    TwitchApiPaginatedData,
    TwitchApiStreamData,
} from '../types';

class TwitchManager {
    // Cronjobs
    private checkForStreamsJob: CronJob;
    private updateAuthJob: CronJob;

    constructor() {}

    public async init() {
        // Update the authorization key on startup
        await this.refreshAuthConfig();

        // Start cronjobs
        this.initJobs();
    }

    private initJobs() {
        this.checkForStreamsJob = new CronJob(configManager.config.cron, async () =>
            twitchManager.checkForStreams()
        );

        // Update the authorization key every hour
        this.updateAuthJob = new CronJob('0 * * * *', async () =>
            twitchManager.refreshAuthConfig()
        );

        // Start the timers
        this.updateAuthJob.start();
        this.checkForStreamsJob.start();
    }

    public async getAccessToken(clientId: string, clientSecret: string) {
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

    /**
     * Get a new authorization key and update the config
     */
    public async refreshAuthConfig() {
        try {
            // Get the auth key
            const authKey = await this.getAccessToken(
                configManager.config.twitch.clientId,
                configManager.config.twitch.secret
            );

            if (!authKey) {
                throw new Error('Could not get Twitch Auth Token.');
            }

            // Write the new auth key
            configManager.config.twitch.authToken = authKey;

            // Save to disk
            configManager.updateConfigOnDisk();
        } catch (err) {
            console.error(err);
            // exit(1);
        }
    }

    public async checkForStreams() {
        configManager.config.twitch.channels.map(async (channel, channelIndex) => {
            if (!channel.channelName) return;

            let streams = await this.getStreams(channel.channelName);

            if (streams && streams.data && streams.data.length == 0) {
                return;
            }

            let streamData = streams.data[0];

            // Get the channel data for the thumbnail image
            const channelData: TwitchApiChannelData = await this.getChannelData(
                channel.channelName
            );

            if (!channelData) {
                return;
            }

            // Send or update stream message on the Discord channel
            discordManager.sendOrUpdateMessage(channelIndex, streamData, channelData);
        });
    }

    public async getChannelData(channelName: string) {
        try {
            let headers = {
                'client-id': configManager.config.twitch.clientId,
                Authorization: `Bearer ${configManager.config.twitch.authToken}`,
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

    public async getStreams(channelName: string) {
        try {
            let headers = {
                'Client-Id': configManager.config.twitch.clientId,
                Authorization: `Bearer ${configManager.config.twitch.authToken}`,
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
}

// Export Singleton
export const twitchManager = new TwitchManager();
