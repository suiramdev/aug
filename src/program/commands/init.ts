import { program } from 'commander';
import { writeFile } from 'fs/promises';
import path from 'path';

program
  .command('init')
  .option('-ts, --useTypescript <true|false>', 'use typescript', 'true')
  .action(init);

const configs = {
  ts: {
    content: `import type { Config } from 'aug';

export const config: Config = {
  outdir: 'dist',
  patterns: ['**/*.guide.{ts,js}'],
};`,
    filename: 'aug.config.ts',
  },
  js: {
    content: `module.exports = {
  outdir: 'dist',
  patterns: ['**/*.guide.{js}'],
};`,
    filename: 'aug.config.js',
  },
};

export async function init(options: { useTypescript: string }) {
  const configType = options.useTypescript === 'true' ? 'ts' : 'js';
  const config = configs[configType];
  const configPath = path.join(process.cwd(), config.filename);

  await writeFile(configPath, config.content);
  console.log(`Initialized ${config.filename}`);
}
