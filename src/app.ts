import 'reflect-metadata';

// import { configManager } from './config';
import { discordManager } from './discord/discord';
import { twitchManager } from './twitch/twitch';

export class App {
    public async init() {
        await discordManager.init();
        await twitchManager.init();
    }
}
