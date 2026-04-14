import { type Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { GACHA_DEBUG, DEBUG_SCENARIO_ORDER, type DebugScenario } from './debug.js';
import {
  TARGET_CHARS,
  REVERSED_CHARS,
  shuffleChars,
  countMatches,
  isAllCorrect,
  isAllReversed,
  formatResult,
  buildShuffledForMatches,
} from './gacha-core.js';

const JYOGI_EMOJI = ':jyogi2014:';
const FIVE_MATCH_STICKER_ID = '1491081864323141793';
const ALL_CORRECT_STICKER_ID = '1411357962567548969';

function buildShuffledForScenario(scenario: DebugScenario): string[] {
  switch (scenario) {
    case 'n0':
      return buildShuffledForMatches(0);
    case 'n1':
      return buildShuffledForMatches(1);
    case 'r2':
      return buildShuffledForMatches(2);
    case 'r3':
      return buildShuffledForMatches(3);
    case 'sr':
      return buildShuffledForMatches(4);
    case 'ssr':
      return buildShuffledForMatches(5);
    case 'legend':
      return [...TARGET_CHARS];
    case 'reversed':
      return [...REVERSED_CHARS];
  }
}

export function setupGacha(client: Client, logger: Logger): void {
  let debugIndex = 0;

  client.on('interactionCreate', (interaction) => void (async () => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'gacha') return;

    await interaction.deferReply();

    let shuffled: string[];
    if (GACHA_DEBUG) {
      const scenario = DEBUG_SCENARIO_ORDER[debugIndex % DEBUG_SCENARIO_ORDER.length];
      debugIndex = (debugIndex + 1) % DEBUG_SCENARIO_ORDER.length;
      shuffled = buildShuffledForScenario(scenario);
      logger.info(`[gacha debug] シナリオ: ${scenario}`);
    } else {
      shuffled = shuffleChars();
    }

    const normalMatches = countMatches(shuffled, TARGET_CHARS);

    if (isAllCorrect(shuffled)) {
      const jyogiLine = Array(7).fill(JYOGI_EMOJI).join('');
      const debugPrefix = GACHA_DEBUG ? '[DEBUG] ' : '';
      await interaction.editReply(`${jyogiLine}\n${debugPrefix}おめでとう！あなたは**名誉じょぎ部員**に認定されました！`);
      if (interaction.channel?.isSendable()) {
        await interaction.channel.send({ stickers: [ALL_CORRECT_STICKER_ID] });
      }
      logger.info('gacha: 全て揃えた', {
        feature: 'gacha',
        action: 'all_correct',
        user: interaction.user.username,
        debug: GACHA_DEBUG,
      });

    } else if (isAllReversed(shuffled)) {
      const reversedText = REVERSED_CHARS.join('');
      await interaction.editReply(`\`\`\`\n${reversedText}\n\`\`\`\n逆順で揃えてしまった...`);
      logger.info('gacha: 逆順で揃えた', {
        feature: 'gacha',
        action: 'reversed',
        user: interaction.user.username,
      });

    } else {
      await interaction.editReply(formatResult(shuffled));

      if (normalMatches === 5 && interaction.channel?.isSendable()) {
        await interaction.channel.send({ stickers: [FIVE_MATCH_STICKER_ID] });
        logger.info('gacha: 5文字一致', {
          feature: 'gacha',
          action: 'five_match',
          user: interaction.user.username,
        });
      }
    }
  })());

  logger.info(`gacha機能を初期化しました${GACHA_DEBUG ? '（デバッグモード）' : ''}`);
}
