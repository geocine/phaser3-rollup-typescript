import Phaser from 'phaser';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const SNAP_TOLARANCE = 12; //the tolarance of the mover
const TILE_SIZE = 100//tile size in px
const MOVE_SPEED = 300;
const MOVE_TOLARANCE = 10;
const XTS_SPEED = 200;

export default {
  type: Phaser.AUTO,
  parent: 'game',
  scale: {
    width: WIDTH,
    height: HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
        debug: false
    }
}
};
