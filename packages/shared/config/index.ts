import dotenv from 'dotenv';

interface ConfigManagerOptions {
  envPath?: string;
  required?: string[];
  optional?: Record<string, string>;
}

export class ConfigManager {
  private required: string[];
  private optional: Record<string, string>;

  constructor(options: ConfigManagerOptions = {}) {
    dotenv.config({ path: options.envPath });
    this.required = options.required ?? [];
    this.optional = options.optional ?? {};
  }

  load(): Record<string, string> {
    const config: Record<string, string> = {};

    for (const key of this.required) {
      const value = process.env[key];
      if (!value) {
        throw new Error(`必須の環境変数 ${key} が設定されていません`);
      }
      config[key] = value;
    }

    for (const [key, defaultValue] of Object.entries(this.optional)) {
      config[key] = process.env[key] ?? defaultValue;
    }

    return config;
  }

  validate(config: Record<string, string>, schema: Record<string, (value: string) => boolean>): boolean {
    for (const [key, validator] of Object.entries(schema)) {
      if (!validator(config[key])) {
        throw new Error(`設定値 ${key} が無効です: ${config[key]}`);
      }
    }
    return true;
  }
}

export function createConfig(options: ConfigManagerOptions): Record<string, string> {
  return new ConfigManager(options).load();
}
