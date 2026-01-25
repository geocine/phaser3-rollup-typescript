import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';
import path from 'path';
import { patchCanvasFeatures } from './build/patchCanvasFeatures';

const globalDefine = { global: 'globalThis' };
const enableCanvasFeaturesPatch = ['1', 'true', 'on'].includes(
  (process.env.PHASER_CANVAS_PATCH || '').toLowerCase()
);
// Toggle the booleans here to enable / disable Phaser 3 features:
const phaserFeatureFlags = {
  'typeof CANVAS_RENDERER': JSON.stringify(true),
  'typeof WEBGL_RENDERER': JSON.stringify(true),
  'typeof EXPERIMENTAL': JSON.stringify(true),
  'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
  'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
  'typeof FEATURE_SOUND': JSON.stringify(true)
};

const canvasFeaturesFile =
  /node_modules[\/\\]phaser[\/\\]src[\/\\]device[\/\\]CanvasFeatures\.js$/;

const canvasFeaturesPatch = {
  name: 'phaser-canvas-features-patch',
  enforce: 'pre',
  transform(code: string, id: string) {
    if (!enableCanvasFeaturesPatch) {
      return null;
    }
    const cleanId = id.split('?')[0];
    if (canvasFeaturesFile.test(cleanId)) {
      const patched = patchCanvasFeatures(code);
      return patched === code ? null : patched;
    }
    return null;
  }
};

const canvasFeaturesEsbuildPlugin = {
  name: 'phaser-canvas-features-patch',
  setup(build: { onLoad: Function }) {
    if (!enableCanvasFeaturesPatch) {
      return;
    }
    build.onLoad(
      {
        filter: canvasFeaturesFile
      },
      (args: { path: string }) => {
        const code = readFileSync(args.path, 'utf8');
        return {
          contents: patchCanvasFeatures(code),
          loader: 'js'
        };
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
      plugins: enableCanvasFeaturesPatch ? [canvasFeaturesEsbuildPlugin] : []
    }
  },
  plugins: [
    phaserReplace,
    ...(enableCanvasFeaturesPatch ? [canvasFeaturesPatch] : [])
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
