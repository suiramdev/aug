import type { RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';

const bundle = (config: RollupOptions): RollupOptions => ({
  input: 'src/index.ts',
  external: (id: string) => !/^[./]/.test(id),
  ...config,
});

export default [
  bundle({
    plugins: [typescript({ tsconfig: 'tsconfig.build.json' })],
    output: [
      {
        file: `dist/index.js`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `dist/index.mjs`,
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [
      dts({
        compilerOptions: {
          preserveSymlinks: false,
        },
      }),
    ],
    output: {
      file: `dist/index.d.ts`,
      format: 'es',
    },
  }),
  bundle({
    plugins: [typescript({ tsconfig: 'tsconfig.build.json' })],
    input: 'src/program/index.ts',
    output: [
      {
        file: `dist/bin/aug.js`,
        format: 'cjs',
        sourcemap: true,
        banner: '#!/usr/bin/env node --experimental-vm-modules',
      },
      {
        file: `dist/bin/aug.mjs`,
        format: 'es',
        sourcemap: true,
        banner: '#!/usr/bin/env node --experimental-vm-modules',
      },
    ],
  }),
];
