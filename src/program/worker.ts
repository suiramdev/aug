import { ModuleKind } from 'typescript';
import { readFile } from 'fs/promises';
import { transpile } from 'typescript';
import vm from 'vm';
import nodeModule from 'module';
import path from 'path';

const cache = new Map<string, vm.SourceTextModule>();
const require = nodeModule.createRequire(import.meta.url);
const baseContext = vm.createContext({
  require,
  module: nodeModule.Module,
  console,
});

const createModule = async (code: string, filename: string) => {
  const transpiledCode = transpile(code, {
    allowJs: true,
    module: ModuleKind.ES2022,
  });
  return new vm.SourceTextModule(transpiledCode, {
    context: baseContext,
    identifier: filename,
  });
};

export async function runFile(filePath: string) {
  const sourceCode = await readFile(filePath, 'utf8');
  const moduleScript = await createModule(sourceCode, filePath);
  await moduleScript.link(async (specifier, referencingModule) => {
    const resolvedPath = require.resolve(specifier, {
      paths: [path.dirname(referencingModule.identifier)],
    });

    // Check if module is already cached
    if (cache.has(resolvedPath)) {
      return cache.get(resolvedPath)!;
    }

    // Load and create new module
    const code = await readFile(resolvedPath, 'utf8');
    const linkedModule = await createModule(code, resolvedPath);
    cache.set(resolvedPath, linkedModule);

    return linkedModule;
  });
  await moduleScript.evaluate();
}
