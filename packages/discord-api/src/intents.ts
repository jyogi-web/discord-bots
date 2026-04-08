import { GatewayIntentBits } from 'discord.js';

export const IntentPresets = {
  MESSAGE_READER: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],

  MUSIC_BOT: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],

  ADMIN_BOT: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],

  REACTION_MONITOR: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
} as const;

export type IntentPresetName = keyof typeof IntentPresets;

export function getIntents(preset: IntentPresetName): GatewayIntentBits[] {
  return [...IntentPresets[preset]];
}
