import vm from 'vm';
import { readFile } from 'fs/promises';
import { ModuleKind, transpile } from 'typescript';
import nodeModule from 'module';

/**
 * Configuration interface for the application
 */
export interface Config {
  /** Output directory for generated files */
  outdir: string;
  /** Glob patterns to match guide files */
  patterns: string[];
}

/**
 * Default configuration values
 */
export const defaultConfig: Config = {
  outdir: 'dist',
  patterns: ['**/*.guide.{js,ts}'],
};

/**
 * Resolves and loads configuration from a TypeScript/JavaScript file
 *
 * @param configPath - Path to the config file
 * @returns Resolved configuration object merged with defaults
 */
export async function resolveConfig(
  configPath: string,
): Promise<Config | undefined> {
  // Read and transpile the config file
  let sourceCode = await readFile(configPath, 'utf8');
  const transpiledCode = transpile(sourceCode, {
    allowJs: true,
    module: ModuleKind.ES2022,
  });

  // Create VM context with Node.js module system
  const vmContext = vm.createContext({
    require: nodeModule.createRequire(import.meta.url),
    module: nodeModule.Module,
  });

  // Execute code in VM
  const moduleScript = new vm.SourceTextModule(transpiledCode, {
    context: vmContext,
  });
  await moduleScript.link(() => Promise.resolve(moduleScript));
  await moduleScript.evaluate();

  // Check different export patterns
  const moduleNamespace = moduleScript.namespace as {
    default?: Config;
    config?: Config;
  };

  // Try default export
  if (moduleNamespace.default) {
    return {
      ...defaultConfig,
      ...moduleNamespace.default,
    };
  }

  // Try named 'config' export
  if (moduleNamespace.config) {
    return {
      ...defaultConfig,
      ...moduleNamespace.config,
    };
  }

  // Try CommonJS exports
  if (moduleScript.context.module.exports) {
    return {
      ...defaultConfig,
      ...moduleScript.context.module.exports,
    };
  }

  // Fallback to defaults if no config found
  return defaultConfig;
}
