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
    input: 'src/index.ts',
    output: [
      {
        file: `dist/index.js`,
        format: 'cjs',
      },
      {
        file: `dist/index.mjs`,
        format: 'es',
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
        file: `dist/cli.js`,
        format: 'cjs',
      },
      {
        file: `dist/cli.mjs`,
        format: 'es',
      },
    ],
  }),
  bundle({
    plugins: [typescript({ tsconfig: 'tsconfig.build.json' })],
    input: 'src/worker.ts',
    output: { file: 'dist/worker.js', format: 'cjs' },
  }),
];
