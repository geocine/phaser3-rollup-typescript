# Phaser 3 TypeScript Starter

This is a Phaser 3 starter with [TypeScript](https://www.typescriptlang.org/), [Rollup](https://rollupjs.org) for bundling and [nollup](https://github.com/PepsRyuu/nollup) as development server.


## Available Commands

| Command | Description |
|---------|-------------|
| `yarn install` | Install project dependencies |
| `yarn dev` | Builds project and open web server, watching for changes |
| `yarn build` | Builds code bundle with production settings (minification, no source maps, etc..) |
| `yarn start` | Run a web server to serve built code bundle |

## Development

After cloning the repo, run `yarn install` from your project directory. Then, you can start the local development
server by running `yarn dev`.

After starting the development server with `yarn dev`, you can edit any files in the `src` folder
and **nollup** will automatically recompile and reload your browser (available at `http://localhost:8080`
by default).

The development server makes use of [nollup](https://github.com/PepsRyuu/nollup) which makes hot reload very fast.

## Production

After running `yarn build`, the files you need for production will be on the `dist` folder. To test code on your `dist` folder, run `yarn start` and navigate to `http://localhost:5000`