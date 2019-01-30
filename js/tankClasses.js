class BaseTank{
  constructor(scene, x, y, texture, frame){
    this.scene = scene;
    this.shadow = scene.physics.add.sprite(x, y, texture, 'shadow');
    this.shadow.setDepth(1);
    this.hull = scene.physics.add.sprite(x, y, texture, frame);
    this.hull.body.setSize(this.hull.width - 8, this.hull.height - 8)
    this.hull.body.collideWorldBounds = true;
    this.hull.body.bounce.setTo(1,1);
    this.hull.setDepth(2);
    this.turret = scene.physics.add.sprite(x, y, texture, 'turret');
    this.turret.setDepth(4);
    this.damageCount = 0;
    this.damageMax = 2;
	this.localtimer = 0;
  }
  update(time, delta){
    this.shadow.x = this.turret.x = this.hull.x;
    this.shadow.y = this.turret.y = this.hull.y;
    this.shadow.rotation = this.hull.rotation;
  }
  
  damage(){
    console.log('it hurts');
  }
  
  setBullets(bullets){
    this.bullets = bullets;
  }
  
  burn(){
    this.turret.setVisible(false);
    this.hull.setVelocity(0);
    this.hull.body.immovable = true;
  }
  
  isDestroyed(){
    if(this.damageCount >= this.damageMax){
      return true
    }
  }
  enableCollision(destructLayer){
    this.scene.physics.add.collider(this.hull, destructLayer, this.WallGrindProc,null,this);
  }
} 

class EnemyTank extends BaseTank{
  constructor(scene, x, y, texture, frame, player,i){
      super(scene, x, y, texture, frame);
      this.player = player;
      //this.hull.angle = Phaser.Math.RND.angle();
      //this.scene.physics.velocityFromRotation(this.hull.rotation, 100, this.hull.body.velocity);
      this.fireTime = 0;
	  this.speed = 100;
	  this.pathGoalX = 0;
	  this.pathGoalY = 0;
	  this.pathStartX = 0;
	  this.pathStartY = 0;
	  this.ID = i;
	  this.path = [];
	  this.walltimer = 0;

  }
  update(time, delta){
    super.update(time, delta);
	//generating a new goal if we've reached our current one or if the player is out of its range
	//Bullet travel time calc
	var BulletTravelTime = Phaser.Math.Distance.Between(this.hull.x, this.hull.y, this.player.hull.x, this.player.hull.y) / Math.sqrt(500);
	var PlayerPredLoc = new Phaser.Math.Vector2(this.player.hull.body.velocity * BulletTravelTime); 
	PlayerPredLoc.x += this.player.hull.x; 
	PlayerPredLoc.y += this.player.hull.y;
	//rotating turret based on player location prodiction
    this.turret.rotation = Phaser.Math.Angle.Between(this.hull.x, this.hull.y, PlayerPredLoc.x, PlayerPredLoc.y);
    this.shadow.rotation = this.hull.rotation = Math.atan2(this.hull.body.velocity.y, this.hull.body.velocity.x);
    if(this.damageCount <= this.damageMax -2 && Phaser.Math.Distance.Between(this.hull.x, this.hull.y, PlayerPredLoc.x, PlayerPredLoc.y) < 300 && this.fireTime == 0){
    // within Range based on bullet lead time prodictions 
      this.fireTime = time;
      var bullet = this.bullets.get(this.turret.x, this.turret.y);
      if(bullet){
        fireBullet.call(this.scene, bullet, this.turret.rotation, this.player);
      }
    }
	
    if(this.fireTime > 0){
      if(time > this.fireTime + 2000){
        this.fireTime = 0;
      }
    }
	
	if(this.movingtank == true){
		if(this.path[this.movingstage] != [] && this.path[this.movingstage] != null){
			this.hull.rotation = Phaser.Math.Angle.Between(this.hull.x, this.hull.y, this.path[this.movingstage].x,this.path[this.movingstage].y)
			this.scene.physics.velocityFromRotation(this.hull.rotation, 50, this.hull.body.velocity);
			if(Phaser.Math.Within(this.hull.x, this.path[this.movingstage].x, 5) && Phaser.Math.Within(this.hull.y, this.path[this.movingstage].y, 5))
			{
				this.hull.body.velocity.x = 0;
				this.hull.body.velocity.y = 0;
				this.movingstage++;
			}
		if(this.movingstage > this.movinglength){
			this.movingtank = false;
		}
		} else if(this.path[this.movingstage] == [] || this.path[this.movingstage] == null){
			console.log('Moving stage corruption detected. Requesting new path');
			this.movingtank = false;
			this.newgoal();
		}
	}
	
	if(!Phaser.Geom.Circle.ContainsPoint(player.bubble,this.target)){		  
			//if(this.ID == 0){console.log('Tanks goal is outside acceptable player range - requesting new goal');}
			this.newgoal();
		}
	
	if(this.hull.x == this.pathGoalX && this.hull.y == this.pathGoalY ){   
		//if(this.ID == 0){console.log('Tank #'+[i]+' is already at current goal - requesting new goal');}
		this.newgoal();
		}
		navMesh.debugDrawPath(this.path, 0xffd900);
    }
	
 WallGrindProc(tank,tile){ //Wall damage collider function
		//console.log('im stuck on a wall!')
		this.walltimer++;
		//console.log(this.walltimer);
		if(this.walltimer == 100)
		{
			this.walltimer = 0
			console.log('GET THIS FUCKING WALL OUT OF MY FACE')
			//damageWall(null,tile)
		}
			
	}

  
newgoal(){ //creating a new goal
    console.log('calculating new goal point')
	this.movingtank = false;
	this.target = new Phaser.Geom.Circle.Random(player.bubble);
	this.target.x = Math.floor(Phaser.Math.Clamp(this.target.x,0,WorldSizeW));
	this.target.y = Math.floor(Phaser.Math.Clamp(this.target.y,0,WorldSizeH));
	//this.target.x = (this.target.x/64) + (Phaser.Math.Clamp(this.target.x%64,24,40));//clamp target region to location with navmesh
	//this.target.y = (this.target.y/64) + (Phaser.Math.Clamp(this.target.y%64,24,40));//clamp target region to location with navmesh
	//console.log('target =[' + this.target.x + '][' + this.target.y +']');
	this.pathGoalX = this.target.x;
	this.pathGoalY = this.target.y;
	this.pathStartX = this.hull.x;
	this.pathStartY = this.hull.y;
	//console.log('target =[' + this.pathGoalX + '][' + this.pathGoalY +']');
	//console.log('Moving going from ('+ this.pathStartX*32 +','+this.pathStartY*32+') to ('+this.pathGoalX*32+','+this.pathGoalY*32+')');
	//computing path
	//console.log(navMesh);
	this.path = navMesh.findPath({x: this.pathStartX, y: this.pathStartY}, {x: this.pathGoalX, y: this.pathGoalY});
	if(this.path != null && this.path != []){
		console.log(this.path,this.pathStartX,this.pathStartY);
		this.movingtank = true;
		this.movingstage = 0;
		this.movinglength = this.path.length;
	}
  }
  

  
damage(){
    this.damageCount++;
    if(this.damageCount >= this.damageMax){
      // destroy
      this.turret.destroy();
      this.hull.destroy();
    }else if(this.damageCount == this.damageMax -1){this.burn();}
  }
}

class PlayerTank extends BaseTank{
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        this.currentSpeed = 0;
		this.bubble = new Phaser.Geom.Circle(this.hull.x,this.hull.y,200);
        this.keys = scene.input.keyboard.addKeys(
            {
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                w: Phaser.Input.Keyboard.KeyCodes.W,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                d: Phaser.Input.Keyboard.KeyCodes.D
            }
        );
        this.damageMax = 10;
    }
    update() {
      super.update();
	  this.bubble.x = this.hull.x;
	  this.bubble.y = this.hull.y;
	  //console.log(this.bubble);
        if (this.keys.up.isDown || this.keys.w.isDown) {
            if (this.currentSpeed < 500) {this.currentSpeed += 10;}
        } else if (this.keys.down.isDown || this.keys.s.isDown) {
            if (this.currentSpeed > -500) {this.currentSpeed -= 10;}
        } else {this.currentSpeed *= 0.9;}
		
        if (this.keys.left.isDown || this.keys.a.isDown) {
            if (this.currentSpeed > 0) { this.hull.angle--} else {this.hull.angle++}
        } else if (this.keys.right.isDown || this.keys.d.isDown){
            if (this.currentSpeed > 0) {this.hull.angle++ } else {this.hull.angle--}
        }
    this.scene.physics.velocityFromRotation(this.hull.rotation, this.currentSpeed, this.hull.body.velocity);
    const worldPoint = this.scene.input.activePointer.positionToCamera(this.scene.cameras.main);
    this.turret.rotation = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, worldPoint.x, worldPoint.y);
	}
	
    damage(){
      this.scene.cameras.main.shake(200,0.005);
      this.damageCount++
      if(this.damageCount >= this.damageMax){
        this.burn();
      }
    }
	
	 WallGrindProc(tank,tile){ //Wall damage collider function
		  //console.log('im a player. I dont care about walls!')
	}
}
