import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';
import path from 'path';

const globalDefine = { global: 'globalThis' };
// Toggle the booleans here to enable / disable Phaser 3 features:
const phaserFeatureFlags = {
  'typeof CANVAS_RENDERER': JSON.stringify(true),
  'typeof WEBGL_RENDERER': JSON.stringify(true),
  'typeof WEBGL_DEBUG': JSON.stringify(false),
  'typeof EXPERIMENTAL': JSON.stringify(true),
  'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
  'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
  'typeof FEATURE_SOUND': JSON.stringify(true)
};

const applyPhaserFeatureFlags = (code: string): string => {
  let next = code;
  for (const [key, value] of Object.entries(phaserFeatureFlags)) {
    if (next.includes(key)) {
      next = next.split(key).join(value);
    }
  }
  return next;
};

const phaserSourceFile =
  /node_modules[\/\\]phaser[\/\\]src[\/\\].*\.js$/;

const phaserSourceEsbuildPlugin = {
  name: 'phaser-source-transform',
  setup(build: { onLoad: Function }) {
    build.onLoad(
      {
        filter: phaserSourceFile
      },
      (args: { path: string }) => {
        const code = readFileSync(args.path, 'utf8');
        const replaced = applyPhaserFeatureFlags(code);
        if (replaced !== code) {
          return {
            contents: replaced,
            loader: 'js'
          };
        }
        return null;
      }
    );
  }
};
const phaserReplace = replace({
  preventAssignment: true,
  values: phaserFeatureFlags,
  include: ['**/node_modules/phaser/src/**/*.js']
});
phaserReplace.enforce = 'pre';

export default defineConfig({
  define: globalDefine,
  optimizeDeps: {
    esbuildOptions: {
      define: globalDefine,
      plugins: [phaserSourceEsbuildPlugin]
    }
  },
  plugins: [
    phaserReplace
  ],
  resolve: {
    alias: {
      // Use Phaser source build so feature flags can be tree-shaken.
      phaser: path.resolve(__dirname, 'node_modules/phaser/src/phaser.js')
    }
  },
  build: {
    minify: 'terser'
  }
});
