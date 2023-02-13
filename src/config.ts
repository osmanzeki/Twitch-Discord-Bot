import { readFileSync, writeFileSync } from 'fs';
import { TwitchDiscordBotConfig } from './types';

class ConfigManager {
    private cachedConfig: TwitchDiscordBotConfig = null;

    public get config() {
        if (this.cachedConfig === null) {
            let file = readFileSync('./config.json');
            this.cachedConfig = JSON.parse(file.toString());
        }

        return this.cachedConfig;
    }

    constructor() {}

    public updateConfigOnDisk() {
        // Save config with new data
        writeFileSync('./config.json', JSON.stringify(this.config));
    }

    public addTwitchChannel(channelName: string) {
        let isDirty = false;

        // Make sure that we don't already have that channel in our list
        let channel = this.config.twitch.channels.find((x) => x.channelName === channelName);
        if (!channel) {
            console.log(`Adding '${channelName} to our live watch list.'`);

            this.config.twitch.channels.push({
                channelName: channelName,
                discordMessageId: '',
                discordServer: '',
                twitchStreamId: '',
            });

            isDirty = true;
        } else {
            console.log(`The '${channelName}' channel is already in our list, ignoring.'`);

            return false;
        }

        // Save config with new data, if we have made changes in memory
        if (isDirty) {
            this.updateConfigOnDisk();
            return true;
        } else {
            return false;
        }
    }

    public removeTwitchChannel(channelName: string) {
        let isDirty = false;

        // Remove the channel from our list if its in there
        let channel = this.config.twitch.channels.find((x) => x.channelName === channelName);
        if (channel) {
            console.log(`Removing '${channelName} from our live watch list.'`);

            this.config.twitch.channels = this.config.twitch.channels.filter(
                (x) => x.channelName !== channelName
            );

            isDirty = true;
        } else {
            console.log(`The '${channelName}' channel was not in our live watch list, ignoring.'`);

            return false;
        }

        // Save config with new data, if we have made changes in memory
        if (isDirty) {
            this.updateConfigOnDisk();

            return true;
        } else {
            return false;
        }
    }
}

// Export Singleton
export const configManager = new ConfigManager();
