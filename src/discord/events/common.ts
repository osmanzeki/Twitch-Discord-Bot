import type { ArgsOf } from 'discordx';
import { Discord, On, Client } from 'discordx';

@Discord()
export abstract class CommonEvents {
    @On('messageDelete')
    onMessage([message]: ArgsOf<'messageDelete'>, client: Client) {
        console.log('Message Deleted', client.user?.username, message.content);
    }
}
