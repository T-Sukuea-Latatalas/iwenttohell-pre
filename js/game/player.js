class Player {
  constructor(tileX, tileY) {
    this.width = 14;
    this.height = 15;
    this.spawnTileX = tileX;
    this.spawnTileY = tileY;
    this.prevY = 0;
    this.prevVy = 0;

    this.reset();
  }

  reset() {
    this.x = this.spawnTileX * TILE_SIZE + (TILE_SIZE - this.width) / 2;
    this.y = this.spawnTileY * TILE_SIZE + (TILE_SIZE - this.height);
    this.prevY = this.y;
    this.prevVy = 0;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.facingLeft = false;

    this.maxHp = 3;
    this.hp = this.maxHp;
    this.isDead = false;
    this.invincibleTimer = 0;
  }

  update(keys, tileMap) {
    if (this.isDead) return;

    this.prevY = this.y;
    this.prevVy = this.vy;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    const isRunning = keys["ShiftLeft"] || keys["ShiftRight"];
    const currentMaxSpeed = isRunning ? PHYSICS.MOVE_SPEED * 1.4 : PHYSICS.MOVE_SPEED;

    let moveInput = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) moveInput -= 1;
    if (keys["ArrowRight"] || keys["KeyD"]) moveInput += 1;

    if (moveInput !== 0) {
      this.vx += moveInput * PHYSICS.ACCELERATION;
      if (Math.abs(this.vx) > currentMaxSpeed) {
        this.vx = Math.sign(this.vx) * currentMaxSpeed;
      }
      this.facingLeft = moveInput < 0;
    } else {
      this.vx *= PHYSICS.FRICTION;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    const jumpRequested = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
    if (jumpRequested && this.isGrounded) {
      this.vy = PHYSICS.JUMP_FORCE;
      this.isGrounded = false;
    }

    this.vy += PHYSICS.GRAVITY;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) {
      this.vy = PHYSICS.MAX_FALL_SPEED;
    }

    Physics.collideAndMoveX(this, tileMap);
    Physics.collideAndMoveY(this, tileMap);

    if (this.y > tileMap.height * TILE_SIZE + 32) {
      this.takeDamage(this.maxHp);
    }
  }

  takeDamage(amount = 1) {
    if (this.invincibleTimer > 0 || this.isDead) return;

    this.hp -= amount;
    this.invincibleTimer = 60;
    this.vy = -3.5;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  bounce() {
    this.vy = PHYSICS.JUMP_FORCE * 0.85;
  }

  render(ctx, camera) {
    if (this.isDead) return;

    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      return;
    }

    const drawX = Math.round(this.x - camera.x);
    const drawY = Math.round(this.y - camera.y);

    ctx.save();
    if (this.facingLeft) {
      ctx.translate(drawX + this.width, drawY);
      ctx.scale(-1, 1);
      drawTile(ctx, TILES.SPAWN_PLAYER, 0, 0, TILE_SIZE);
    } else {
      drawTile(ctx, TILES.SPAWN_PLAYER, drawX, drawY, TILE_SIZE);
    }
    ctx.restore();
  }
}

window.Player = Player;