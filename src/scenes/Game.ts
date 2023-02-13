import Phaser from 'phaser';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const SNAP_TOLARANCE = 12; //the tolarance of the mover
const TILE_SIZE = 100//tile size in px
const MOVE_SPEED = 300;
const MOVE_TOLARANCE = 10;
const XTS_SPEED = 200;

const INGREDIENTS = {
  dough : 1,
  sauce : 0.7,
  salami : 0.5,
  cheese : 0.8,
  oven : 1
}

enum ingredients{
  dough = 0,
  sauce,
  salami,
  cheese,
  oven,
  xts,
  done
}

enum depth{
  tile,
  mover,
  xtsTile,
  xtsMover,
  pizza,
  appliances,
  clock,
  arrow,
}

interface ingredient_properties{
  req : boolean,
  done: boolean,
  name : string
} 

class Task{
  public ingredients_list : ingredient_properties[] = [];
  public failed : boolean;
  public done : boolean;

  constructor(){
    this.failed = false
    for( const [key, value] of Object.entries(INGREDIENTS)){
      this.ingredients_list.push({req : Math.random() <= value, done : false, name: key});
    } 
  }

  stepDone(step : ingredients) : ingredients{
    if(step < ingredients.xts)this.ingredients_list[step].done = true;
    do{
      step++;
    }
    while(step < ingredients.xts && !this.ingredients_list[step].req);
    return <ingredients>step;
  }
}

class Task_list{
  public tasks : Task[];
  public cur_task : number;
  private text_field : Phaser.GameObjects.Text;

  constructor(scene : Phaser.Scene){
    this.tasks = [];
    this.text_field = scene.add.text(100, HEIGHT - 300, 'Tasks:', {color : "#000000"});
    this.cur_task = 0;
    this.addTask(this);
  }

  addTask(task_list : Task_list){
    task_list.tasks.push(new Task());
    task_list.displayList();
    let time_next_task = Math.random()*10000+10000;
    setTimeout(task_list.addTask, time_next_task, task_list);
  }

  stepDone(step : ingredients){
    let next_step  : ingredients = this.tasks[this.cur_task].stepDone(step);
    if(next_step == ingredients.done){
      this.tasks[this.cur_task].done = true;
      this.cur_task ++;
    }
    this.displayList();
    return next_step;
  }

  displayList(){
    this.text_field.text = 'Tasks:';
    this.tasks.forEach((value, index) => {
      if(value.failed ||value.done)return;
      this.text_field.text += `\n Pizza ${index+1}:`;
      value.ingredients_list.forEach((value_task, index) => {
        if(value_task.req)this.text_field.text += `\n\t${index+1}: ${<string>ingredients[index]}: ${value_task.done ? "✓": "❌"}`;
      });
    }); 
  }


}

export default class Demo extends Phaser.Scene {

  private tiles : Phaser.Physics.Arcade.StaticGroup;
  private wall : Phaser.Physics.Arcade.StaticGroup;
  private xts : Phaser.Physics.Arcade.StaticGroup;
  private xtsCurve : Phaser.Physics.Arcade.StaticGroup;
  private xtsMover : Phaser.Physics.Arcade.Sprite;
  private xtsMover2 : Phaser.Physics.Arcade.Sprite;
  private mover : Phaser.Physics.Arcade.Image;
  private target : Phaser.Math.Vector2;
  private w_key : Phaser.Input.Keyboard.Key;
  private a_key : Phaser.Input.Keyboard.Key;
  private s_key : Phaser.Input.Keyboard.Key;
  private d_key : Phaser.Input.Keyboard.Key;
  private e_key : Phaser.Input.Keyboard.Key;
  private keys_first_down : any;
  private arrow : Phaser.Physics.Arcade.Sprite;
  private pizza : Phaser.Physics.Arcade.Sprite;
  private pizza_offset : any;
  private sauce_machine : Phaser.Physics.Arcade.Image;
  private cheese_hopper : Phaser.Physics.Arcade.Sprite;
  private cheese_hopper_state : String;
  private oven : Phaser.Physics.Arcade.Sprite;
  private clock : Phaser.Physics.Arcade.Sprite;
  private task_list : Task_list;
  private salami : Phaser.Physics.Arcade.Image;
  
  
  constructor() {
    super('GameScene');
    this.keys_first_down = {w : true, a: true, s: true, d: true };
    this.cheese_hopper_state = 'full';
  }

  preload() {
    this.load.spritesheet('tiles', 'TileSpritesheet100.png', {frameWidth : 100, frameHeight: 100});
    this.load.image('mover', 'Mover100.png');
    this.load.image('wall', 'Wall100.png');
    this.load.image('xtsrail', 'XTSRail100.png');
    this.load.image('xtscurve', 'XTSRailCurve100.png');
    this.load.spritesheet('xtsmover', 'XTSMoverSpritesheet100.png', {frameWidth : 100, frameHeight: 100});
    this.load.spritesheet('arrow', 'Arrow100.png', {frameWidth: 100, frameHeight:100});
    this.load.spritesheet('pizza', 'Pizza100.png',{frameWidth: 100, frameHeight:100});
    this.load.image('sauce-machine', 'saucemachine100.png');
    this.load.spritesheet('cheese', 'Käse100.png', {frameHeight:200, frameWidth:100});
    this.load.spritesheet('oven', 'Oven100.png', {frameWidth: 100, frameHeight : 110});
    this.load.spritesheet('clock', 'Clock100.png', {frameHeight:100, frameWidth:100});
    this.load.image('salami', 'Salami100.png');
  }

  create() {
    this.add.rectangle(0,0, WIDTH, HEIGHT, 0xffffff).setOrigin(0, 0);

    this.tiles = this.physics.add.staticGroup();
    this.wall = this.physics.add.staticGroup();
    this.xts = this.physics.add.staticGroup();
    this.xtsCurve = this.physics.add.staticGroup();

    //build game area
    for(let j = 0; j < 2; j++){
        for(let i = 0; i < 3; i++){
            this.tiles.create(WIDTH/2 -150 + 100*i, HEIGHT - 200 - 100*j, 'tiles', Math.floor(Math.random()*4));
        }
    }
    for(let j = 0; j < 2; j++){
        for(let i = 0; i < 7; i++){
            if(j==0 && i==1 )this.wall.create(WIDTH/2 - 350 + 100*i, HEIGHT - 400 - 100*j, 'wall');
            else this.tiles.create(WIDTH/2 - 350 + 100*i, HEIGHT - 400 - 100*j, 'tiles', Math.floor(Math.random()*4));
        }
    }
    for(let i = 0; i < 3; i++){
      this.tiles.create(WIDTH/2 - 350 + 100*i, HEIGHT - 600, 'tiles', Math.floor(Math.random()*4));
    }
    for(let i = 3; i < 7; i++){
      this.wall.create(WIDTH/2 - 350 + 100*i, HEIGHT - 600, 'wall', Math.floor(Math.random()*4));
    }
    for(let i = 0; i < 7; i++){
      this.tiles.create(WIDTH/2 - 350 + 100*i, HEIGHT - 700, 'tiles', Math.floor(Math.random()*4));
    }

    //build xts
    let xtstemp = this.physics.add.image(WIDTH/2 + 310, HEIGHT - 400, 'xtsrail');
    xtstemp.angle = -90;
    this.xts.add(xtstemp);
    xtstemp = this.physics.add.image(WIDTH/2 + 310, HEIGHT - 300, 'xtscurve');
    xtstemp.angle = 180;
    this.xtsCurve.add(xtstemp);
    xtstemp = this.physics.add.image(WIDTH/2 + 310, HEIGHT - 500, 'xtscurve');
    xtstemp.angle = -90;
    this.xtsCurve.add(xtstemp);
    for(let i = 0; i < 8; i++){
        xtstemp = this.physics.add.image(WIDTH/2 + 410 + 100*i, HEIGHT - 300, 'xtsrail');
        xtstemp.angle = 180;
        this.xts.add(xtstemp);
        this.xts.add(this.physics.add.image(WIDTH/2 + 410 + 100*i, HEIGHT - 500, 'xtsrail'));
    }
    for(let i = 0; i < 8; i++){
      xtstemp = this.physics.add.image(WIDTH/2 -25 + -400, HEIGHT - 600 - 100*i, 'xtsrail');
      xtstemp.angle = 90;
      this.xts.add(xtstemp);
    }
    xtstemp = this.physics.add.image(WIDTH/2 -25 + -400, HEIGHT - 500, 'xtscurve');
    xtstemp.angle = 90;
    this.xtsCurve.add(xtstemp);
    for(let i = 0; i < 6; i++){
      xtstemp = this.physics.add.image(WIDTH/2 -25 + -500 -100*i, HEIGHT - 500, 'xtsrail');
      xtstemp.angle = 180;
      this.xts.add(xtstemp);
    }

    this.anims.create({
        key: 'turn',
        frames: this.anims.generateFrameNumbers('xtsmover', { start: 1, end: 3 }),
        duration: 175,

    });
    this.anims.create({key:'idle', frames: [{key:'xtsmover', frame: 0},]});

    this.xtsMover = this.physics.add.sprite(WIDTH/2 + 410 + 400, HEIGHT - 300, 'xtsmover');
    this.xtsMover.angle = 180;
    this.xtsMover.setVelocity(-XTS_SPEED, 0);
    this.xtsCurve.children.iterate((xtsCurve) => {
        this.physics.add.overlap(this.xtsMover, xtsCurve, this.turnXTSMover, undefined, this);  
    });    

    this.mover = this.physics.add.image(WIDTH/2 - 50, HEIGHT - 200, 'mover');

    this.target = new Phaser.Math.Vector2(this.mover.x, this.mover.y);

    //add keys
    this.w_key = this.input.keyboard.addKey('W');
    this.a_key = this.input.keyboard.addKey('A');
    this.s_key = this.input.keyboard.addKey('S');
    this.d_key = this.input.keyboard.addKey('D');
    this.e_key = this.input.keyboard.addKey('E');


    //game task setup
    this.data.set('pizza-picked-up', false);
    //pizza
    this.pizza = this.physics.add.sprite(0,0, 'pizza');
    this.pizza_offset = {x:0, y:20};
    this.e_key.on('down', () => {
        if((<Phaser.Physics.Arcade.Body>this.xtsMover.body).speed == 0 && this.physics.overlap(this.mover, this.pizza)){
          this.e_key.removeAllListeners();
            this.data.set('pizza-picked-up', true);
            this.data.set('next-step', ingredients.sauce);

            //  arrow
            this.arrow.x = WIDTH/2 -50;
            this.arrow.y = HEIGHT - 600;
            this.arrow.resetFlip();

            //  end_arrow
            this.xtsMover.setVelocity(0,-XTS_SPEED);
        }
    }); 

    //sauce-machine
    this.sauce_machine = this.physics.add.image(WIDTH/2+50,  HEIGHT - 550, 'sauce-machine');

    //cheese hopper
    this.cheese_hopper = this.physics.add.sprite(WIDTH/2 - 50 -200, HEIGHT - 450, 'cheese');
    //animations
    this.anims.create({key:'cheese-full', frames : this.anims.generateFrameNumbers('cheese', {start : 0, end : 3}), duration: 500});
    this.anims.create({key:'cheese-medium', frames : this.anims.generateFrameNumbers('cheese', {start : 4, end : 7}), duration: 500});
    this.anims.create({key:'cheese-low', frames : this.anims.generateFrameNumbers('cheese', {start : 8, end : 11}), duration: 500});
    this.anims.create({key:'cheese-empty', frames : this.anims.generateFrameNumbers('cheese', {start : 12, end : 15}), duration: 500});

    //oven
    this.oven = this.physics.add.sprite(WIDTH/2 -50, HEIGHT -600, 'oven');
    this.anims.create({key : 'oven-no-pizza', frames : this.anims.generateFrameNumbers('oven', {start: 0, end: 4}), duration: 500});
    this.anims.create({key : 'oven-with-pizza', frames : this.anims.generateFrameNumbers('oven', {start: 5, end: 9}), duration: 500});

    //clock
    this.anims.create({key : 'clock-5s', frames : this.anims.generateFrameNumbers('clock', {start: 0, end: 5}), duration: 5000});
    this.clock = this.physics.add.sprite(WIDTH + 200, HEIGHT -700, 'clock');

    //pointy arrow
    this.anims.create({key:'highlight', frames : this.anims.generateFrameNumbers('arrow', {start: 0, end: 1}), duration: 500, repeat: -1});
    this.arrow = this.physics.add.sprite(WIDTH/2 -50 +475, HEIGHT - 400, 'arrow');
    this.arrow.setFlipX(true);
    this.arrow.anims.play('highlight', true);

    //salami
    this.salami = this.physics.add.image(WIDTH/2 -50 + 200, HEIGHT -600, 'salami');

    this.data.set('tutorial', true);
    //set depth of objets
    this.tiles.setDepth(depth.tile);
    this.wall.setDepth(depth.tile);
    this.xts.setDepth(depth.xtsTile);
    this.xtsCurve.setDepth(depth.xtsTile);
    this.mover.setDepth(depth.mover);
    this.xtsMover.setDepth(depth.xtsMover);
    this.sauce_machine.setDepth(depth.appliances);
    this.cheese_hopper.setDepth(depth.appliances);
    this.salami.setDepth(depth.appliances);
    this.oven.setDepth(depth.appliances);
    this.pizza.setDepth(depth.pizza);
    this.arrow.setDepth(depth.arrow);
  }

  update ()
    {
      //bounce clock
      if(this.clock.anims.hasStarted && this.clock.visible){
        this.clock.setVelocityY(Math.sin(this.clock.anims.getProgress()*4*Math.PI)*20);
      }

      //check if xts mover is offscreen
      if(this.xtsMover.x > WIDTH +100 ){
        this.xtsMover.x = WIDTH/2 + 410 + 400;
        this.xtsMover.y = HEIGHT - 300;
        this.xtsMover.angle = 180;
      }

      //check if xtsmover should stop
      if(!this.data.get('pizza-picked-up')&& HEIGHT - 400 + SNAP_TOLARANCE > this.xtsMover.y && this.xtsMover.y > HEIGHT-400-SNAP_TOLARANCE){
        this.xtsMover.y = HEIGHT -400;
        this.xtsMover.setVelocity(0,0);
      }

      if(this.data.get('pizza-ready') || this.data.get('next-step') == ingredients.xts && HEIGHT - 600 + SNAP_TOLARANCE > this.xtsMover2.y && this.xtsMover2.y > HEIGHT - 600 -SNAP_TOLARANCE){
        this.xtsMover2.y = HEIGHT - 600;
        this.xtsMover2.setVelocity(0,0);
      }

       //put pizza on XTS
      if(!this.data.get('pizza-picked-up') ){
        this.pizza.x = this.xtsMover.x + this.pizza_offset.x;
        this.pizza.y = this.xtsMover.y + this.pizza_offset.y;
      }
      else if(this.data.get('pizza-on-xts2')){
        this.pizza.x = this.xtsMover2.x + this.pizza_offset.x;
        this.pizza.y = this.xtsMover2.y + this.pizza_offset.y;
      }
      else{
        this.pizza.x = this.mover.x;
        this.pizza.y = this.mover.y
      }

      if(this.data.get('tutorial')){           

        //check if turorial pizza left screen & start game
        if(this.data.get('pizza-on-xts2') && this.xtsMover2.x < 0){
          this.xtsMover2.destroy();
          this.pizza.destroy();
          this.task_list = new Task_list(this);
          this.pizza = this.physics.add.sprite(this.xtsMover.x, this.xtsMover.y, 'pizza', 0);
          this.pizza.setDepth(depth.pizza);
          this.xtsMover.setVelocity(-XTS_SPEED, 0);
          this.data.reset();
          this.data.set('tutorial', false);
          this.data.set('next-step', ingredients.dough);
        }

        //put sauce on pizza
        if(this.data.get('next-step') == ingredients.sauce){
          this.e_key.on('down', () => {
                if(this.physics.overlap(this.mover, this.sauce_machine)){
                  this.e_key.removeAllListeners();
                    this.data.set('next-step', ingredients.cheese);
                    this.pizza.setFrame(1);//add sauce to the pizza

                    //hopper extend
                    this.cheese_hopper.anims.play('cheese-'+this.cheese_hopper_state, true);

                    //  arrow
                    this.arrow.x = WIDTH/2 -50 - 300;
                    this.arrow.y = HEIGHT - 500;
                    //  end_arrow
                }
            });
        }
        //put cheese on pizza
        if(this.data.get('next-step') == ingredients.cheese && this.e_key.isDown){
            if(this.physics.overlap(this.mover, this.cheese_hopper)){
                this.data.set('next-step', ingredients.oven);
                this.pizza.setFrame(3);//add cheese to the pizza
                //adjust cheese fill state
                if(this.cheese_hopper_state === 'full')this.cheese_hopper_state = 'medium';
                else if(this.cheese_hopper_state === 'medium')this.cheese_hopper_state = 'low';
                else this.cheese_hopper_state = 'empty';


                //hopper retract
                this.cheese_hopper.anims.playReverse('cheese-'+this.cheese_hopper_state, true);
                this.oven.anims.play('oven-no-pizza', true);

                //  arrow WIDTH/2+50,  HEIGHT - 550
                this.arrow.x = WIDTH/2 + 50;
                this.arrow.y = HEIGHT - 600;
                this.arrow.setFlipX(true);
                //  end_arrow
            }
        }

        if(this.data.get('next-step') == ingredients.oven && this.e_key.isDown){
          if(this.physics.collide(this.mover, this.oven)){
            this.data.set('next-step', 'xts');
            this.pizza.setVisible(false);

            this.oven.anims.playReverse('oven-with-pizza', true);
            this.clock.x = WIDTH/2 -50;
            this.clock.setDepth(depth.clock);
            this.clock.anims.play('clock-5s', true);
            this.clock.once('animationcomplete', () => {this.clock.setVisible(false);});


            //activate pick-up xts
            setTimeout(() => {
              this.oven.play('oven-with-pizza');
              this.e_key.once('down', () => {
                this.xtsMover2 = this.physics.add.sprite(WIDTH/2 -25 -400, 0, 'xtsmover');
                this.xtsMover2.angle = 90;
                this.xtsMover2.setVelocity(0, XTS_SPEED);
                this.xtsMover2.setDepth(depth.xtsMover);
                this.xtsCurve.children.iterate((xtsCurve) => {
                    this.physics.add.overlap(this.xtsMover2, xtsCurve, this.turnXTSMover, undefined, this);  
                });
                this.data.set('pizza-ready', true);
                this.pizza.setVisible(true);
                this.oven.anims.playReverse('oven-no-pizza');

                //  arrow
                this.arrow.x = WIDTH/2 + 50 - 600;
                this.arrow.y = HEIGHT - 600;
                this.arrow.setFlipX(false);
                //  end_arrow

              });

            }, 5000);
          }
        }

        if(this.data.get('next-step') == 'xts' && this.e_key.isDown){
          if(this.physics.collide(this.mover, this.xtsMover2)){
            this.data.set('pizza-on-xts2', true);
            this.data.set('pizza-ready', false);
            this.xtsMover2.setVelocity(0, XTS_SPEED);
            this.pizza_offset = {x:20, y:0};
            this.arrow.destroy();
          }
        }
      }
      else{
        if(this.data.get('next-step') == ingredients.dough && this.e_key.isDown && this.physics.collide(this.mover, this.pizza)){
          this.data.set('pizza-picked-up', true);
          this.data.set('next-step', this.task_list.stepDone(ingredients.dough));
          this.xtsMover.setVelocity(0,-XTS_SPEED);
          if(this.data.get('next-step') == ingredients.cheese)this.cheese_hopper.anims.play('cheese-'+this.cheese_hopper_state, true);  
        }
        else if (this.data.get('next-step') == ingredients.sauce && this.e_key.isDown && this.physics.collide(this.mover,this.sauce_machine)){
          this.pizza.setFrame(1);//add sauce to the pizza
          this.data.set('next-step', this.task_list.stepDone(ingredients.sauce));

          //hopper extende

          if(this.data.get('next-step') == ingredients.cheese)this.cheese_hopper.anims.play('cheese-'+this.cheese_hopper_state, true);
        }
        else if (this.data.get('next-step') == ingredients.salami && this.e_key.isDown && this.physics.collide(this.mover,this.salami)){
          this.pizza.setFrame(2);//add sauce to the pizza
          this.data.set('next-step', this.task_list.stepDone(ingredients.salami));

          //hopper extende

          if(this.data.get('next-step') == ingredients.cheese)this.cheese_hopper.anims.play('cheese-'+this.cheese_hopper_state, true);
        }
        else if (this.data.get('next-step') == ingredients.cheese && this.e_key.isDown && this.physics.collide(this.mover,this.cheese_hopper)){
          if(this.task_list.tasks[this.task_list.cur_task].ingredients_list[ingredients.salami].req)this.pizza.setFrame(4);//add cheese to the pizza
          else this.pizza.setFrame(3);
          this.data.set('next-step', this.task_list.stepDone(ingredients.cheese));
          //adjust cheese fill state
          if(this.cheese_hopper_state === 'full')this.cheese_hopper_state = 'medium';
          else if(this.cheese_hopper_state === 'medium')this.cheese_hopper_state = 'low';
          else if(this.cheese_hopper_state === 'empty')this.cheese_hopper_state = 'full';
          else this.cheese_hopper_state = 'empty';

          //hopper retract
          this.cheese_hopper.anims.playReverse('cheese-'+this.cheese_hopper_state, true);
          if(this.data.get('next-step') == ingredients.oven)this.oven.anims.play('oven-no-pizza', true);
        }
        else if (this.data.get('next-step') == ingredients.oven && this.e_key.isDown && this.physics.collide(this.mover,this.oven)){
          this.data.set('pizza-on-xts2', false);
          this.data.set('next-step', this.task_list.stepDone(ingredients.oven));
          this.pizza.setVisible(false);

          //close oven and start clock
          this.oven.anims.playReverse('oven-with-pizza', true);
          this.clock.setVisible(true);
          this.clock.anims.play('clock-5s', true);
          this.clock.once('animationcomplete', () => {this.clock.setVisible(false);});

          setTimeout(() => {
            this.oven.play('oven-with-pizza');
            this.e_key.once('down', () => {
              this.xtsMover2 = this.physics.add.sprite(WIDTH/2 -25 -400, 0, 'xtsmover');
              this.xtsMover2.angle = 90;
              this.xtsMover2.setVelocity(0, XTS_SPEED);
              this.xtsMover2.setDepth(depth.xtsMover);
              this.xtsCurve.children.iterate((xtsCurve) => {
                  this.physics.add.overlap(this.xtsMover2, xtsCurve, this.turnXTSMover, undefined, this);  
              });
              this.pizza.setVisible(true);
              this.oven.anims.playReverse('oven-no-pizza');
            });

            }, 5000);  
        }
        else if(this.data.get('next-step') == ingredients.xts && this.e_key.isDown && this.physics.collide(this.mover, this.xtsMover2)){
          this.data.set('next-step', this.task_list.stepDone(ingredients.xts));
          this.data.set('pizza-on-xts2', true);
          this.data.set('pizza-ready', false);
          this.xtsMover2.setVelocity(0, XTS_SPEED);
          this.pizza_offset = {x:20, y:0};
        }
        else if(this.data.get('next-step') == ingredients.done && this.xtsMover2.x < 0){
          this.xtsMover2.destroy();
          this.pizza.destroy();
          this.pizza = this.physics.add.sprite(this.xtsMover.x, this.xtsMover.y, 'pizza', 0);
          this.pizza.setDepth(depth.pizza);
          this.xtsMover.setVelocity(-XTS_SPEED, 0);  
          this.data.reset();
          this.data.set('next-step', ingredients.dough);
        }
      }

      //check key events
      {
          //w key
          if(this.w_key.isDown && this.keys_first_down.w){
              this.move('w', this);
              this.keys_first_down.w = false;
          }
          else if (this.w_key.isUp && this.keys_first_down.w == false)this.keys_first_down.w = true;
          
          //a key
          else if(this.a_key.isDown && this.keys_first_down.a){
              this.move('a', this);

              this.keys_first_down.a = false;
          }
          else if (this.a_key.isUp && this.keys_first_down.a == false) this.keys_first_down.a = true;

          //s key
          else if(this.s_key.isDown && this.keys_first_down.s){
            this.move('s', this);

            this.keys_first_down.s = false;
          }
          else if (this.s_key.isUp && this.keys_first_down.s == false) this.keys_first_down.s = true;

          //d key
          else if(this.d_key.isDown && this.keys_first_down.d){
            this.move('d', this)

            this.keys_first_down.d = false;
          }
          else if (this.d_key.isUp && this.keys_first_down.d == false) this.keys_first_down.d = true;
      }

      //stop mover if target is reached
      if((<Phaser.Physics.Arcade.Body>this.mover.body).speed > 0 && Phaser.Math.Distance.BetweenPoints(this.mover, this.target) < SNAP_TOLARANCE){
        this.mover.body.reset(this.target.x, this.target.y);
      }

        
    }

  move(dir, scene) : void{
    if(Phaser.Math.Distance.BetweenPoints(this.mover, this.target) < MOVE_TOLARANCE){

        var old_target = this.target.clone();

        if(dir === 'w'){
            this.target.x = this.target.x;
            this.target.y = this.target.y - TILE_SIZE;
        }
        else if (dir === 'a'){
          this.target.x = this.target.x - TILE_SIZE;
          this.target.y = this.target.y;
        }
        else if (dir === 's'){
          this.target.x = this.target.x;
          this.target.y = this.target.y + TILE_SIZE;
        }
        else if (dir === 'd'){
          this.target.x = this.target.x + TILE_SIZE;
          this.target.y = this.target.y;
        }
        else{
            return null;
        }

        let valid_position = false;

        this.tiles.children.iterate((tile) => {
            if((<Phaser.Physics.Arcade.Image>tile).x == this.target.x && (<Phaser.Physics.Arcade.Image>tile).y == this.target.y){
                valid_position = true;
            } 
        });

        if(valid_position){
            scene.physics.moveToObject(this.mover, this.target, MOVE_SPEED);
        }
        else{
          this.target = old_target;
        }
        
    }
  }

  turnXTSMover(xtsMover, xtsCurve) : void{
    if(Phaser.Math.Distance.BetweenPoints(xtsMover, xtsCurve) < 25 && !xtsMover.anims.isPlaying){
        xtsMover.x = xtsCurve.x;
        xtsMover.y = xtsCurve.y;
        xtsMover.anims.play('turn', true);
        xtsMover.setVelocity(0, 0);
        xtsMover.once('animationcomplete', () => {
            if(xtsCurve.angle === -180){
                xtsMover.setVelocity(0, -XTS_SPEED);
                xtsMover.y = xtsCurve.y - 25;
                xtsMover.angle = -90;
                this.pizza_offset = {x:-20, y:0};
            }
            else if(xtsCurve.angle === -90){
                xtsMover.setVelocity(XTS_SPEED, 0);
                xtsMover.x = xtsCurve.x + 25;
                xtsMover.angle = 0;
            }
            else if(xtsCurve.angle === 90){
              xtsMover.setVelocity(-XTS_SPEED, 0);
              xtsMover.x = xtsCurve.x - 25;
              xtsMover.angle = 180;
              this.pizza_offset = {x:0, y:20};
            }
            
            xtsMover.anims.play('idle', true);
        });
        

    }
  }

}
