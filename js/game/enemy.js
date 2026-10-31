class Enemy {
  constructor(tileX, tileY) {
    this.x = tileX * TILE_SIZE;
    this.y = tileY * TILE_SIZE;
    this.width = 14;
    this.height = 14;
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.removeMe = false;
    this.isGrounded = false;
  }

  defeat() {
    this.isDead = true;
    this.removeMe = true;
  }

  update(tileMap) {}
  render(ctx, camera) {}
}

class SlimeEnemy extends Enemy {
  constructor(tileX, tileY, range = 4) {
    super(tileX, tileY);
    this.direction = -1; // -1: 左, 1: 右
    this.speed = PHYSICS.ENEMY_SPEED;
    this.startX = this.x;
    this.maxPatrolDistance = range * TILE_SIZE;
    this.wasGrounded = false; // 着地検出用
  }

  update(tileMap) {
    if (this.isDead) return;

    // 水平方向速度と重力加速度の設定
    this.vx = this.direction * this.speed;
    this.vy += PHYSICS.GRAVITY;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) {
      this.vy = PHYSICS.MAX_FALL_SPEED;
    }

    // 地形衝突解決
    Physics.collideAndMoveX(this, tileMap);
    Physics.collideAndMoveY(this, tileMap);

    // 1. 空中から地面に着地した瞬間を検知
    if (this.isGrounded && !this.wasGrounded) {
      // 着地地点を新たなパトロール原点として設定
      this.startX = this.x;
    }
    this.wasGrounded = this.isGrounded;

    // 2. 地面に接地している場合のみ反転判定を実行（空中での誤判定・振動を防止）
    if (this.isGrounded) {
      // 壁衝突判定: collideAndMoveX で壁に衝突し速度が 0 にリセットされた場合
      if (this.vx === 0) {
        this.direction *= -1;
        this.startX = this.x; // 壁から反対方向へ新しくパトロール開始
      }
      // パトロール上限判定: 進行方向に対して上限を超えた場合のみ反転
      else if (this.direction > 0 && this.x >= this.startX + this.maxPatrolDistance) {
        this.direction = -1;
      } else if (this.direction < 0 && this.x <= this.startX - this.maxPatrolDistance) {
        this.direction = 1;
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const drawX = Math.round(this.x - camera.x);
    const drawY = Math.round(this.y - camera.y);
    drawTile(ctx, TILES.SPAWN_SLIME, drawX, drawY, TILE_SIZE);
  }
}

class FlyerEnemy extends Enemy {
  constructor(tileX, tileY, range = 3) {
    super(tileX, tileY);
    this.startY = this.y;
    this.amplitude = range * 8;
    this.angle = 0;
    this.speed = 0.04;
  }

  update() {
    if (this.isDead) return;
    this.angle += this.speed;
    this.y = this.startY + Math.sin(this.angle) * this.amplitude;
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const drawX = Math.round(this.x - camera.x);
    const drawY = Math.round(this.y - camera.y);
    drawTile(ctx, TILES.SPAWN_FLYER, drawX, drawY, TILE_SIZE);
  }
}

window.Enemy = Enemy;
window.SlimeEnemy = SlimeEnemy;
window.FlyerEnemy = FlyerEnemy;