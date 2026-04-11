import { createConfig } from '@discord-bots/shared';

const envConfig = createConfig({
  required: [
    'DISCORD_TOKEN',
    'FORWARD_CHANNEL_ID',
    'CLIENT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'KV_NAMESPACE_ID',
  ],
  optional: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    TARGET_EMOJI_NAME: 'kawaii',
    FEATURE_KAWAII: 'true',
    FEATURE_EYES_LIPS: 'true',
    FEATURE_GACHA: 'true',
  },
});

const parseFeatureFlag = (value: string): boolean => value.toLowerCase() !== 'false' && value !== '0';

export const config = {
  DISCORD_TOKEN: envConfig.DISCORD_TOKEN,
  CLIENT_ID: envConfig.CLIENT_ID,
  FORWARD_CHANNEL_ID: envConfig.FORWARD_CHANNEL_ID,
  NODE_ENV: envConfig.NODE_ENV,
  LOG_LEVEL: envConfig.LOG_LEVEL,
  cloudflare: {
    apiToken: envConfig.CLOUDFLARE_API_TOKEN,
    accountId: envConfig.CLOUDFLARE_ACCOUNT_ID,
    kvNamespaceId: envConfig.KV_NAMESPACE_ID,
  },
  features: {
    kawaii: parseFeatureFlag(envConfig.FEATURE_KAWAII),
    eyesLips: parseFeatureFlag(envConfig.FEATURE_EYES_LIPS),
    gacha: parseFeatureFlag(envConfig.FEATURE_GACHA),
  },
  kawaii: {
    emojiName: envConfig.TARGET_EMOJI_NAME,
  },
  eyesLips: {
    triggers: [':eyes:', '👀'],
    responses: ['👄', '🫦'],
  },
};
