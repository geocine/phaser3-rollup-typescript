# Phaser 3 TypeScript Starter

This is a Phaser 3 starter with [TypeScript](https://www.typescriptlang.org/) and uses [Rollup](https://rollupjs.org) for bundling.


## Available Commands

| Command | Description |
|---------|-------------|
| `yarn install` | Install project dependencies |
| `yarn dev` | Builds project and open web server, watching for changes |
| `yarn build` | Builds code bundle with production settings (minification, no source maps, etc..) |
| `yarn start` | Run a web server to serve built code bundle |

## Developmnet

After cloning the repo, run `yarn install` from your project directory. Then, you can start the local development
server by running `yarn dev`.

After starting the development server with `yarn dev`, you can edit any files in the `src` folder
and Rollup will automatically recompile and reload your server (available at `http://localhost:2020`
by default).

## Production

After running `yarn build` , the files you need for production will be on the `public` folder.