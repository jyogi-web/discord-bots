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

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${name}] ${level}: ${message}${metaStr}`;
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

  return winston.createLogger({
    level,
    defaultMeta: { bot: name },
    transports,
  });
}
