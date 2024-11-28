import { ModuleKind } from 'typescript';
import fs from 'fs/promises';
import { transpile } from 'typescript';
import vm from 'vm';
import nodeModule from 'module';
import path from 'path';

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

async function linker(
  specifier: string,
  referencingModule: vm.SourceTextModule,
) {
  // Resolve the absolute path of the specifier
  let resolvedPath = path.resolve(
    path.dirname(referencingModule.identifier),
    specifier,
  );

  // Check if the resolved path is a directory
  const stats = await fs.stat(resolvedPath);

  if (stats.isDirectory()) {
    // Look for package.json in the directory
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    let entryFile;

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      // Check for "module" or "main" fields
      entryFile = packageJson.module || packageJson.main || 'index.js';
    } catch (err) {
      // If package.json doesn't exist, default to index.js
      entryFile = 'index.js';
    }

    // Update the resolved path to the entry file
    resolvedPath = path.join(resolvedPath, entryFile);
  } else if (stats.isFile()) {
    // If it's a file, check for file extensions
    if (!path.extname(resolvedPath)) {
      // Try adding .js or .mjs extensions
      const extensions = ['.js', '.mjs'];
      for (const ext of extensions) {
        try {
          await fs.access(resolvedPath + ext);
          resolvedPath += ext;
          break;
        } catch (err) {
          // Continue trying other extensions
        }
      }
    }
  }

  // Read the module code
  const code = await fs.readFile(resolvedPath, 'utf8');

  console.log('resolvedPath', resolvedPath);
  console.log('code', code);

  // Create and return a new SourceTextModule
  return new vm.SourceTextModule(code, {
    context: referencingModule.context,
    identifier: resolvedPath,
  });
}

export async function runFile(filePath: string) {
  const sourceCode = await fs.readFile(filePath, 'utf8');
  const moduleScript = await createModule(sourceCode, filePath);
  await moduleScript.link(linker);
  await moduleScript.evaluate();
}
