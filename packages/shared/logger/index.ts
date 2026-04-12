import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const VALID_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof VALID_LEVELS)[number];

interface LoggerOptions {
  level?: LogLevel;
}

export type Logger = winston.Logger;

export function createLogger(name: string, options: LoggerOptions = {}): winston.Logger {
  const level: LogLevel =
    options.level ?? (VALID_LEVELS.includes(process.env.LOG_LEVEL as LogLevel)
      ? (process.env.LOG_LEVEL as LogLevel)
      : 'info');

  // ロガーレベルのフォーマット: 全 Transport に適用される正規化処理
  const sharedFormat = winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${name}] ${level}: ${String(stack ?? message)}${metaStr}`;
        }),
      ),
    }),
  ];

  if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
    transports.push(
      new AxiomTransport({
        token: process.env.AXIOM_TOKEN,
        dataset: process.env.AXIOM_DATASET,
      }),
    );
  }

  if (process.env.DISCORD_ERROR_WEBHOOK_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: DiscordTransport } = require('winston-discord-transport');
    transports.push(
      new DiscordTransport({
        webhookUrl: process.env.DISCORD_ERROR_WEBHOOK_URL,
        level: 'error',
      }),
    );
  }

  return winston.createLogger({
    level,
    format: sharedFormat,
    defaultMeta: { bot: name },
    transports,
  });
}
