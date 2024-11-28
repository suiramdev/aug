import { Config, resolveConfig } from '../../config';
import { program } from 'commander';
import path from 'path';
import { glob } from 'glob';
import { runFile } from '../worker';

program
  .command('run')
  .option('-c, --config <path>', 'path to config file', './aug.config.ts')
  .action(run);

async function run(options: { config: string }) {
  const configPath = path.join(process.cwd(), options.config);
  let config: Config | undefined;
  try {
    config = await resolveConfig(configPath);
  } catch (error) {
    console.error('Failed to resolve config', error);
    process.exit(1);
  }

  if (!config) {
    console.error('The config file must export a valid Config object');
    process.exit(1);
  }

  try {
    const files: string[] = [];
    for (const pattern of config.patterns) {
      const matchedFiles = await glob(pattern);
      files.push(...matchedFiles);
    }

    if (files.length === 0) {
      console.error('No files found to run');
      process.exit(1);
    }

    for (const file of files) {
      await runFile(file);
    }
  } catch (error) {
    console.error('Failed to run files:', error);
    process.exit(1);
  }
}
