import {
  AttachmentBuilder,
  MessageFlags,
  type Client,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { generateImage } from './superchat.js';

const LIMITS: [number, number][] = [
  [50000, 350], [40000, 330], [30000, 310], [20000, 290],
  [10000, 270], [5000, 250], [2000, 225], [1000, 200],
  [500, 150], [200, 50], [100, 0],
];

function validate(price: number, message?: string): string | null {
  if (!Number.isInteger(price) || price < 100 || price > 50000) {
    return '金額は100〜50,000円で指定してください';
  }
  const maxLen = LIMITS.find(([t]) => price >= t)?.[1] ?? 0;
  if (message && [...message].length > maxLen) {
    return maxLen === 0
      ? '200円未満のスパチャにはコメントを付けられません'
      : `コメントは${maxLen}文字以内で指定してください`;
  }
  return null;
}

function resolveDisplayName(interaction: ChatInputCommandInteraction): string {
  const member = interaction.member as GuildMember | null;
  if (member && typeof member === 'object' && 'nickname' in member && member.nickname) {
    return member.nickname;
  }
  return interaction.user.globalName ?? interaction.user.username;
}

function resolveAvatarUrl(interaction: ChatInputCommandInteraction): string | undefined {
  const member = interaction.member as GuildMember | null;
  if (member && typeof (member as GuildMember).displayAvatarURL === 'function') {
    return (member as GuildMember).displayAvatarURL({ extension: 'png', size: 128 });
  }
  return interaction.user.displayAvatarURL({ extension: 'png', size: 128 });
}

export function setupSuperchat(client: Client, logger: Logger): void {
  client.on('interactionCreate', (interaction) => void (async () => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'superchat') return;

    const price = interaction.options.getInteger('金額', true);
    const message = interaction.options.getString('コメント') ?? undefined;

    const error = validate(price, message);
    if (error) {
      await interaction.reply({ content: error, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    try {
      const name = resolveDisplayName(interaction);
      const iconSrc = resolveAvatarUrl(interaction);

      const image = await generateImage({ price, name, iconSrc, message });
      const attachment = new AttachmentBuilder(Buffer.from(image), { name: 'superchat.png' });

      await interaction.editReply({ files: [attachment] });

      logger.info('superchat: 画像を送信しました', {
        feature: 'superchat',
        action: 'send',
        user: interaction.user.username,
        price,
        hasMessage: Boolean(message),
      });
    } catch (err) {
      logger.error('superchat: 画像生成に失敗しました', err);
      const content = '画像の生成に失敗しました';
      try {
        await interaction.editReply({ content });
      } catch (replyErr) {
        logger.error('superchat: エラー応答にも失敗しました', replyErr);
      }
    }
  })());

  logger.info('superchat機能を初期化しました');
}
