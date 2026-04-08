import { createConfig } from '@discord-bots/shared';

const envConfig = createConfig({
  required: ['DISCORD_TOKEN', 'FORWARD_CHANNEL_ID', 'CLIENT_ID'],
  optional: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    TARGET_EMOJI_NAME: 'kawaii',
  },
});

export const config = {
  DISCORD_TOKEN: envConfig.DISCORD_TOKEN,
  CLIENT_ID: envConfig.CLIENT_ID,
  FORWARD_CHANNEL_ID: envConfig.FORWARD_CHANNEL_ID,
  NODE_ENV: envConfig.NODE_ENV,
  LOG_LEVEL: envConfig.LOG_LEVEL,
  kawaii: {
    emojiName: envConfig.TARGET_EMOJI_NAME,
  },
  eyesLips: {
    triggers: [':eyes:', '👀'],
    responses: ['👄', '🫦'],
  },
};
