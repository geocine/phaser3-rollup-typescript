import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

const isProd = process.env.NODE_ENV === 'production';

const config = {
  //  Our games entry point (edit as required)
  input: 'src/index.ts',

  //  Where the build file is to be generated.
  //  Most games being built for distribution can use iife as the module type.
  output: {
    file: 'public/index.js',
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

    // Copy to public folder
    copy({
      targets: [
        { src: 'src/index.html', dest: 'public' },
        { src: 'src/assets', dest: 'public' }
      ]
    }),

    // Parse our .ts source files
    resolve({
      extensions: ['.ts']
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
    //  See https://www.npmjs.com/package/rollup-plugin-uglify for config options
    terser({
      mangle: false
    })
  ];
} else {
  config.plugins = [
    ...config.plugins,
    //  See https://www.npmjs.com/package/rollup-plugin-serve for config options
    serve({
      open: true,
      verbose: true,
      contentBase: 'public',
      host: 'localhost',
      port: 2020,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }),
    livereload('public')
  ];
}

export default config;
