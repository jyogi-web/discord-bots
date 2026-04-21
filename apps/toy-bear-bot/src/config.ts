import { createConfig } from '@discord-bots/shared';

const envConfig = createConfig({
  required: [
    'DISCORD_TOKEN',
    'FORWARD_CHANNEL_ID',
    'CLIENT_ID',
    'AXIOM_TOKEN',
    'AXIOM_DATASET',
  ],
  optional: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    TARGET_EMOJI_NAME: 'kawaii',
    FEATURE_KAWAII: 'true',
    FEATURE_EYES_LIPS: 'true',
    FEATURE_GACHA: 'true',
    FEATURE_SUPERCHAT: 'true',
    DISCORD_ERROR_WEBHOOK_URL: '',
  },
});

const parseFeatureFlag = (value: string): boolean => value.toLowerCase() !== 'false' && value !== '0';

export const config = {
  DISCORD_TOKEN: envConfig.DISCORD_TOKEN,
  CLIENT_ID: envConfig.CLIENT_ID,
  FORWARD_CHANNEL_ID: envConfig.FORWARD_CHANNEL_ID,
  NODE_ENV: envConfig.NODE_ENV,
  LOG_LEVEL: envConfig.LOG_LEVEL,
  features: {
    kawaii: parseFeatureFlag(envConfig.FEATURE_KAWAII),
    eyesLips: parseFeatureFlag(envConfig.FEATURE_EYES_LIPS),
    gacha: parseFeatureFlag(envConfig.FEATURE_GACHA),
    superchat: parseFeatureFlag(envConfig.FEATURE_SUPERCHAT),
  },
  kawaii: {
    emojiName: envConfig.TARGET_EMOJI_NAME,
  },
  eyesLips: {
    triggers: [':eyes:', '👀'],
    responses: ['👄', '🫦'],
  },
};
