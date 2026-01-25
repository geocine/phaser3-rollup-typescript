import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Use Phaser source build so feature flags can be tree-shaken.
      phaser: path.resolve(__dirname, 'node_modules/phaser/src/phaser.js')
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        //  Toggle the booleans here to enable / disable Phaser 3 features:
        replace({
          preventAssignment: true,
          values: {
            'typeof CANVAS_RENDERER': JSON.stringify(true),
            'typeof WEBGL_RENDERER': JSON.stringify(true),
            'typeof EXPERIMENTAL': JSON.stringify(true),
            'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
            'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
            'typeof FEATURE_SOUND': JSON.stringify(true)
          }
        })
      ]
    }
  }
});
