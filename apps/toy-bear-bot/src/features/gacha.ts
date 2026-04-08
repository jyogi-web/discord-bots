import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';

const TARGET_CHARS = '情報技術研究部'.split('');

function shuffleChars(): string[] {
  const arr = [...TARGET_CHARS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
    await interaction.editReply(formatResult(shuffled));
  });

  logger.info('gacha機能を初期化しました');
}
