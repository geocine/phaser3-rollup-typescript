import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import staticFiles from 'rollup-plugin-static-files';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

const config = {
  //  Our games entry point (edit as required)
  input: 'src/index.ts',

  //  Where the build file is to be generated.
  //  Most games being built for distribution can use iife as the module type.
  output: {
    dir: 'dist',
    entryFileNames: 'index.js',
    name: 'Phaser',
    format: 'iife',
    sourcemap: isProd,
    intro: 'var global = window'
  },

  plugins: [
    //  Toggle the booleans here to enable / disable Phaser 3 features:
    replace({
      'typeof CANVAS_RENDERER': JSON.stringify(true),
      'typeof WEBGL_RENDERER': JSON.stringify(true),
      'typeof EXPERIMENTAL': JSON.stringify(true),
      'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
      'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
      'typeof FEATURE_SOUND': JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development'
      )
    }),

    // Parse our .ts source files
    resolve({
      extensions: ['.ts']
    }),

    alias({
      entries: [
        {
          find: 'phaser',
          replacement: path.resolve(
            process.cwd(),
            'node_modules/phaser/dist/phaser.js'
          )
        }
      ]
    }),

    // We need to convert the Phaser 3 CJS modules into a format Rollup can use:
    commonjs({
      include: ['node_modules/eventemitter3/**', 'node_modules/phaser/**'],
      exclude: ['node_modules/phaser/src/polyfills/requestAnimationFrame.js'],
      sourceMap: isProd,
      ignoreGlobal: true
    }),

    //  See https://www.npmjs.com/package/rollup-plugin-typescript2 for config options
    typescript()
  ]
};

if (isProd) {
  config.plugins = [
    ...config.plugins,
    staticFiles({
      include: ['./public']
    }),
    //  See https://www.npmjs.com/package/rollup-plugin-uglify for config options
    terser({
      mangle: false
    })
  ];
}

export default config;
