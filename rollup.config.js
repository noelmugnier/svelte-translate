import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

import execute from "rollup-plugin-execute";

import svelte from 'rollup-plugin-svelte';

import autoPreprocess from 'svelte-preprocess';

import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const production = !process.env.ROLLUP_WATCH;
const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
  .replace(/^\w/, m => m.toUpperCase())
  .replace(/-\w/g, m => m[1].toUpperCase());

export default {  
    input: "src/index.ts",
    output: [
      {
        file: pkg.module,
        format: "es",
        sourcemap: production,
      },
      {
        file: pkg.main,
        format: "umd",
        name,
        sourcemap: production,
        plugins: [
          // we only want to run this once, so we'll just make it part of this output's plugins
          execute([
            "tsc --outDir ./dist --declaration",
            "node scripts/preprocess.js",
          ]),
        ],
      },
    ],
  plugins: [
    svelte({
      dev: !production,
      preprocess: autoPreprocess(),
    }),
    resolve({
      dedupe: [
        'svelte',
      ],
    }),
    commonjs(),
    typescript(),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};