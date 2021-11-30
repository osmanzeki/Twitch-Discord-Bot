import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup, SlashChoice } from 'discordx';

enum TextChoices {
    // WhatDiscordShows = value
    Hello = 'Hello',
    'Good Bye' = 'GoodBye',
}

@Discord()
class DiscordBot {
    @Slash('hello')
    @SlashGroup('text')
    hello(
        @SlashChoice(TextChoices)
        @SlashChoice('How are you', 'question')
        @SlashOption('text')
        text: string,
        interaction: CommandInteraction
    ) {
        interaction.reply(text);
    }
}
