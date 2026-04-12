import { type Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { GACHA_DEBUG, DEBUG_SCENARIO_ORDER, type DebugScenario } from './debug.js';

const TARGET_CHARS = '情報技術研究部'.split('');
const REVERSED_CHARS = [...TARGET_CHARS].reverse();
const JYOGI_EMOJI = ':jyogi2014:';
const FIVE_MATCH_STICKER_ID = '1491081864323141793';
const ALL_CORRECT_STICKER_ID = '1411357962567548969';

function shuffleChars(): string[] {
  const arr = [...TARGET_CHARS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function countMatches(shuffled: string[], target: string[]): number {
  return shuffled.filter((char, i) => char === target[i]).length;
}

function isAllCorrect(shuffled: string[]): boolean {
  return countMatches(shuffled, TARGET_CHARS) === TARGET_CHARS.length;
}

function isAllReversed(shuffled: string[]): boolean {
  return countMatches(shuffled, REVERSED_CHARS) === REVERSED_CHARS.length;
}

function formatResult(shuffled: string[]): string {
  const colored = shuffled.map((char, i) => {
    if (char === TARGET_CHARS[i]) {
      return `\x1b[32m${char}\x1b[0m`; // 緑色（当たり）
    }
    return char;
  });
  return `\`\`\`ansi\n${colored.join('')}\n\`\`\``;
}

// 指定したマッチ数になるように TARGET_CHARS を部分的に崩した配列を返す。
// デバッグ用: 特定レアリティの演出を再現するため。
// 注: 7文字中6文字一致は数学的に不可能なので matches=6 は呼ばないこと。
function buildShuffledForMatches(matches: number): string[] {
  const result = [...TARGET_CHARS];
  const mismatchCount = TARGET_CHARS.length - matches;
  if (mismatchCount < 2) return result;
  // 後ろから mismatchCount 文字分を回転させて一致から外す。
  const tail = result.slice(-mismatchCount);
  const rotated = [...tail.slice(1), tail[0]];
  for (let i = 0; i < mismatchCount; i++) {
    result[TARGET_CHARS.length - mismatchCount + i] = rotated[i];
  }
  return result;
}

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

  client.on('interactionCreate', async (interaction) => {
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
  });

  logger.info(`gacha機能を初期化しました${GACHA_DEBUG ? '（デバッグモード）' : ''}`);
}
