import { CommandInteraction, GuildMember, User } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

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
