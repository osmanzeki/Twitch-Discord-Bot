//-----------------------------------------------------------------
// External Dependencies
//-----------------------------------------------------------------

import { Intents } from 'discord.js';
import { Client as DiscordClient } from 'discordx';
import { importx } from '@discordx/importer';

//-----------------------------------------------------------------
// Internal Dependencies
//-----------------------------------------------------------------

import { configManager } from '../config';
import { twitchManager } from '../twitch/twitch';

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
} from '../types';

//-----------------------------------------------------------------
// Module
//-----------------------------------------------------------------

class DiscordManager {
    //-----------------------------------------------------------------
    // Properties
    //-----------------------------------------------------------------

    private client: DiscordClient;

    //-----------------------------------------------------------------
    // Accessors
    //-----------------------------------------------------------------

    //-----------------------------------------------------------------
    // Lifecycle
    //-----------------------------------------------------------------

    constructor() {}

    public async init() {
        // Initialize Discord client
        this.client = new DiscordClient({
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
        this.client.once('ready', async () => {
            console.log(`\n>> Logged in as ${this.client.user.tag}!\n`);

            // Make sure all guilds are in cache
            await this.client.guilds.fetch();

            // Init bot commands
            await this.client.clearApplicationCommands();
            await this.client.initApplicationCommands({
                global: { log: true },
                guild: { log: true },
            });
            await this.client.initApplicationPermissions(true);

            // Do an immediate check for streams on the first launch
            twitchManager.checkForStreams();

            console.log('\n>> Bot started\n');
        });

        this.client.on('interactionCreate', (interaction) => {
            this.client.executeInteraction(interaction);
        });

        // Autoload our event and command classes
        await importx(`${__dirname}/{events,commands}/**/*.{ts,js}`);

        // Log the Discord bot in
        await this.client.login(configManager.config.discord.token);
    }

    //-----------------------------------------------------------------
    // Methods
    //-----------------------------------------------------------------

    public async sendOrUpdateMessage(
        channelIndex: number,
        streamData: TwitchApiStreamData,
        channelData: TwitchApiChannelData
    ) {
        try {
            let channel = configManager.config.twitch.channels[channelIndex];

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
            const guildChannel = this.client.guilds.cache.get(
                configManager.config.discord.serverId
            );

            // TODO: Find a better type than ANY here
            const sendChannel: any = guildChannel.channels.cache.get(
                configManager.config.discord.channelId
            );

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
                    configManager.config.twitch.channels[channelIndex].twitchStreamId = '';
                }
            } else {
                // This is the message when a streamer goes live. It will tag the assigned role
                let msg = await sendChannel.send({ embeds: [sendEmbed] });

                const channelObj = configManager.config.twitch.channels[channelIndex];

                channelObj.discordMessageId = msg.id;
                channelObj.twitchStreamId = streamData.id;

                // if (this.config.discord.roleId) {
                //     sendChannel.send(`<@&${this.config.discord.roleId}>`);
                // }
            }

            // Save config with new data
            configManager.updateConfigOnDisk();
        } catch (err) {
            console.error(err);
        }
    }
}

// Export Singleton
export const discordManager = new DiscordManager();
