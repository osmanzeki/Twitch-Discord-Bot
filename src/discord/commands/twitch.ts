//-----------------------------------------------------------------
// External Dependencies
//-----------------------------------------------------------------

import { CommandInteraction, GuildMember, Role, User } from 'discord.js';
import { Discord, Guard, Permission, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';

//-----------------------------------------------------------------
// Internal Dependencies
//-----------------------------------------------------------------

import { configManager } from '../../config';
import { twitchManager } from '../../twitch/twitch';

//-----------------------------------------------------------------
// Module
//-----------------------------------------------------------------

@Discord()
@SlashGroup('twitch', 'Twitch-related commands', {
    addChannel: 'Add a streamer to the live notifications for the bot',
    removeChannel: 'Remove a streamer to the live notifications for the bot',
})
export abstract class TwitchCommands {
    @Slash('addchannel')
    addChannel(
        @SlashOption('channel', { description: 'The channel name of the Twitch streamer' })
        channelName: string,
        interaction: CommandInteraction
    ) {
        if (!channelName) {
            interaction.reply('Captain, please specify a channel name first!');
            return false;
        }

        console.log(`Checking to see if ${channelName} exists`);

        twitchManager
            .getChannelData(channelName)
            .then((channel) => {
                if (channel) {
                    console.log(`${channelName} was found on Twitch, adding to our list.`);

                    let result = configManager.addTwitchChannel(channelName);
                    if (result) {
                        interaction.reply(
                            `I have successfully added [${channelName}](https://www.twitch.tv/${channelName}) to the list of Twitch channels we are spying on, Captain!`
                        );
                    } else {
                        interaction.reply(
                            `Its seems like \`${channelName}\` is already in our list of channels, Captain!`
                        );
                    }
                } else {
                    console.log(`\`${channelName}\` does not seem to exist on Twitch`);
                    interaction.reply(
                        `Sorry Captain, but it seems that the channel \`${channelName}\` does not exist!`
                    );
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }

    @Slash('removechannel')
    @Guard()
    removeChannel(
        @SlashOption('channel', { description: 'The channel name of the Twitch streamer' })
        channelName: string,
        interaction: CommandInteraction
    ) {
        if (!channelName) {
            interaction.reply('Captain, please specify a channel name first!');
            return false;
        }

        console.log(`Removing ${channelName} from our watch list (if it is in there).`);

        let result = configManager.removeTwitchChannel(channelName);
        if (result) {
            interaction.reply(
                `I have successfully removed \`${channelName}\` from our Twitch watch list, Captain!`
            );
        } else {
            interaction.reply(
                `I could not find \`${channelName}\` in our Twitch watch list, oh well!`
            );
        }
    }
}
