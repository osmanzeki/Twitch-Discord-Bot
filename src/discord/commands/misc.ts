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
@SlashGroup('misc', 'Silly commands', {
    insult: 'Be mean to a specify user',
})
export abstract class MiscCommands {
    @Slash('insult')
    insult(
        @SlashOption('user', { type: 'USER' })
        user: GuildMember | User,
        interaction: CommandInteraction
    ) {
        if (!user) {
            interaction.reply('Captain, please specify a user first!');
            return false;
        }

        console.log(`Insulting ${user}, because why not!`);

        interaction.reply(`Hey ${user}, you a dummy!`);
    }
}
