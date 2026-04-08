import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const TARGET_CHARS = '情報技術研究部'.split('');
const REVERSED_CHARS = [...TARGET_CHARS].reverse();
const JYOGI_EMOJI = ':jyogi2014:';
const FIVE_MATCH_STICKER_ID = '1491081864323141793';
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const RECORDS_FILE = join(DATA_DIR, 'gacha-records.json');

interface GachaRecord {
  username: string;
  userId: string;
  timestamp: string;
  rank: number;
}

interface GachaData {
  records: GachaRecord[];
}

function loadData(): GachaData {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(RECORDS_FILE)) {
    return { records: [] };
  }
  try {
    const raw = readFileSync(RECORDS_FILE, 'utf-8');
    return JSON.parse(raw) as GachaData;
  } catch {
    return { records: [] };
  }
}

function saveRecord(record: GachaRecord): void {
  const data = loadData();
  data.records.push(record);
  writeFileSync(RECORDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
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

export function setupGacha(client: Client, logger: Logger): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'gacha') return;

    await interaction.deferReply();
    const shuffled = shuffleChars();
    const normalMatches = countMatches(shuffled, TARGET_CHARS);

    // 特殊な判定結果の処理
    if (isAllCorrect(shuffled)) {
      // 全部揃った！
      const data = loadData();
      const rank = data.records.length + 1;
      const timestamp = new Date().toISOString();
      saveRecord({ username: interaction.user.username, userId: interaction.user.id, timestamp, rank });

      const jyogiLine = Array(7).fill(JYOGI_EMOJI).join('');
      await interaction.editReply(`${jyogiLine}\nあなたが**${rank}人目**の情報技術研究部を揃えた人です`);
      logger.info(`ユーザー ${interaction.user.tag} が全て揃えました！順位: ${rank}`);

    } else if (isAllReversed(shuffled)) {
      // 逆順に揃った！
      const reversedText = REVERSED_CHARS.join('');
      await interaction.editReply(`\`\`\`\n${reversedText}\n\`\`\`\n逆順で揃えてしまった...`);
      logger.info(`ユーザー ${interaction.user.tag} が逆順で揃えました！`);

    } else {
      // 通常結果
      await interaction.editReply(formatResult(shuffled));

      // 5文字一致でスタンプ送信
      if (normalMatches === 5 && interaction.channel?.isSendable()) {
        await interaction.channel.send({ stickers: [FIVE_MATCH_STICKER_ID] });
        logger.info(`ユーザー ${interaction.user.tag} が5文字一致しました！`);
      }
    }
  });

  logger.info('gacha機能を初期化しました');
}
