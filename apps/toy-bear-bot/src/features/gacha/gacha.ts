import { EmbedBuilder, type Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import type { StorageAdapter } from '@discord-bots/storage';
import { GACHA_DEBUG, DEBUG_SCENARIO_ORDER, type DebugScenario } from './debug.js';

const TARGET_CHARS = '情報技術研究部'.split('');
const REVERSED_CHARS = [...TARGET_CHARS].reverse();
const JYOGI_EMOJI = ':jyogi2014:';
const FIVE_MATCH_STICKER_ID = '1491081864323141793';
const ALL_CORRECT_STICKER_ID = '1411357962567548969';

const KV_WINNER_COUNT = 'gacha:winner:count';
const kvWinnerKey = (rank: number) => `gacha:winner:${rank}`;

interface GachaRecord {
  username: string;
  userId: string;
  timestamp: string;
  rank: number;
}

async function getWinnerCount(storage: StorageAdapter): Promise<number> {
  const raw = await storage.get(KV_WINNER_COUNT);
  if (raw === null) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function saveWinner(storage: StorageAdapter, record: GachaRecord): Promise<void> {
  await storage.put(kvWinnerKey(record.rank), JSON.stringify(record));
  await storage.put(KV_WINNER_COUNT, String(record.rank));
}

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

function getRarityColor(matches: number): number {
  if (matches >= 7) return 0xffd700;
  if (matches === 6) return 0xff8c00;
  if (matches === 5) return 0xf1c40f;
  if (matches === 4) return 0x9b59b6;
  if (matches >= 2) return 0x3498db;
  return 0x95a5a6;
}

function buildResultEmbed(shuffled: string[], matches: number): EmbedBuilder {
  return new EmbedBuilder()
    .setDescription(formatResult(shuffled))
    .setColor(getRarityColor(matches));
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

export function setupGacha(client: Client, logger: Logger, storage: StorageAdapter): void {
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

    // 特殊な判定結果の処理
    if (isAllCorrect(shuffled)) {
      // 全部揃った！
      if (GACHA_DEBUG) {
        // デバッグ時はランキングに記録しない
        const jyogiLine = Array(7).fill(JYOGI_EMOJI).join('');
        await interaction.editReply(`${jyogiLine}\n[DEBUG] 全て揃えた演出\nおめでとう！あなたは**名誉じょぎ部員**に認定されました！`);
        if (interaction.channel?.isSendable()) {
          await interaction.channel.send({ stickers: [ALL_CORRECT_STICKER_ID] });
        }
        logger.info(`[gacha debug] ユーザー ${interaction.user.tag} が全て揃えました（記録なし）`);
      } else {
        try {
          const count = await getWinnerCount(storage);
          const rank = count + 1;
          const timestamp = new Date().toISOString();
          await saveWinner(storage, { username: interaction.user.username, userId: interaction.user.id, timestamp, rank });

          const jyogiLine = Array(7).fill(JYOGI_EMOJI).join('');
          await interaction.editReply(`${jyogiLine}\nあなたが**${rank}人目**の情報技術研究部を揃えた人です\nおめでとう！あなたは**名誉じょぎ部員**に認定されました！`);
          if (interaction.channel?.isSendable()) {
            await interaction.channel.send({ stickers: [ALL_CORRECT_STICKER_ID] });
          }
          logger.info(`ユーザー ${interaction.user.tag} が全て揃えました！順位: ${rank}`);
        } catch (err) {
          logger.error(`ガチャ記録の保存に失敗しました: ${interaction.user.tag}`, err);
          await interaction.editReply('おめでとう！全て揃えましたが、記録の保存に失敗しました。もう一度お試しください。');
          return;
        }
      }

    } else if (isAllReversed(shuffled)) {
      // 逆順に揃った！
      const reversedText = REVERSED_CHARS.join('');
      await interaction.editReply(`\`\`\`\n${reversedText}\n\`\`\`\n逆順で揃えてしまった...`);
      logger.info(`ユーザー ${interaction.user.tag} が逆順で揃えました！`);

    } else {
      // 通常結果
      const embed = buildResultEmbed(shuffled, normalMatches);
      await interaction.editReply({ embeds: [embed] });

      // 5文字一致でスタンプ送信
      if (normalMatches === 5 && interaction.channel?.isSendable()) {
        await interaction.channel.send({ stickers: [FIVE_MATCH_STICKER_ID] });
        logger.info(`ユーザー ${interaction.user.tag} が5文字一致しました！`);
      }
    }
  });

  logger.info(`gacha機能を初期化しました${GACHA_DEBUG ? '（デバッグモード）' : ''}`);
}
