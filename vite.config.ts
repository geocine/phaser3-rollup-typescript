import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import path from 'path';

const globalDefine = { global: 'globalThis' };
const phaserFeatureFlags = {
  'typeof CANVAS_RENDERER': JSON.stringify(true),
  'typeof WEBGL_RENDERER': JSON.stringify(true),
  'typeof EXPERIMENTAL': JSON.stringify(true),
  'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
  'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
  'typeof FEATURE_SOUND': JSON.stringify(true)
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
      define: globalDefine
    }
  },
  plugins: [phaserReplace],
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
