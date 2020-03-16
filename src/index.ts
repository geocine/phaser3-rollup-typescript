import 'phaser';
import config from './config';
import GameScene from './scenes/game';

new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene]
  })
);
