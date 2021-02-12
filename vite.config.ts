import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        //  Toggle the booleans here to enable / disable Phaser 3 features:
        replace({
          'typeof CANVAS_RENDERER': "'true'",
          'typeof WEBGL_RENDERER': "'true'",
          'typeof EXPERIMENTAL': "'true'",
          'typeof PLUGIN_CAMERA3D': "'false'",
          'typeof PLUGIN_FBINSTANT': "'false'",
          'typeof FEATURE_SOUND': "'true'",
          'process.env.NODE_ENV': isProd ? "'production'" : "'development'"
        })
      ]
    }
  }
});
