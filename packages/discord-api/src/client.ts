import { Client, type ClientOptions, type GatewayIntentBits } from 'discord.js';
import type { Logger } from '@discord-bots/shared';

interface CreateDiscordClientOptions extends Omit<ClientOptions, 'intents'> {
  intents: GatewayIntentBits[];
}

export function createDiscordClient(options: CreateDiscordClientOptions): Client {
  if (!options.intents || options.intents.length === 0) {
    throw new Error('Discord Client には少なくとも1つのIntentが必要です');
  }
  return new Client(options);
}

export async function loginClient(client: Client, token: string, logger?: Logger): Promise<Client> {
  if (!token) {
    throw new Error('DISCORD_TOKEN が設定されていません');
  }
  try {
    await client.login(token);
    return client;
  } catch (error) {
    logger?.error('Discord ログインに失敗:', error);
    throw error;
  }
}
