class Player {
  constructor(tileX, tileY) {
    this.normalWidth = 14;
    this.normalHeight = 15;
    this.crouchHeight = 9;

    this.width = this.normalWidth;
    this.height = this.normalHeight;

    this.spawnTileX = tileX;
    this.spawnTileY = tileY;

    this.prevY = 0;
    this.prevVy = 0;

    // アイテム所持状態
    this.equippedItem = null;

    // ジャンプ管理
    this.jumpInputConsumed = false; // キーを離すまで次のジャンプを禁止するフラグ
    this.isJumping = false;          // 上昇ジャンプ中フラグ
    this.jumpHoldTimer = 0;          // 長押し継続フレーム

    this.reset();
  }

  reset() {
    this.width = this.normalWidth;
    this.height = this.normalHeight;
    this.x = this.spawnTileX * TILE_SIZE + (TILE_SIZE - this.width) / 2;
    this.y = this.spawnTileY * TILE_SIZE + (TILE_SIZE - this.height);
    this.prevY = this.y;
    this.prevVy = 0;
    this.vx = 0;
    this.vy = 0;

    this.isGrounded = false;
    this.isCrouching = false;
    this.facingLeft = false;

    this.isDead = false;
    this.invincibleTimer = 0;
    this.attackCooldown = 0;

    this.jumpInputConsumed = false;
    this.isJumping = false;
    this.jumpHoldTimer = 0;
  }

  obtainItem(itemId = "core_blaster") {
    this.equippedItem = itemId;
  }

  update(keys, tileMap, onAttack) {
    if (this.isDead) return;

    this.prevY = this.y;
    this.prevVy = this.vy;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // 1. しゃがみ入力 (Sキー)
    const crouchRequested = Boolean(keys["KeyS"]);
    if (crouchRequested && this.isGrounded) {
      if (!this.isCrouching) {
        this.isCrouching = true;
        this.y += (this.normalHeight - this.crouchHeight);
        this.height = this.crouchHeight;
      }
    } else if (this.isCrouching) {
      this.isCrouching = false;
      this.y -= (this.normalHeight - this.crouchHeight);
      this.height = this.normalHeight;
    }

    // 2. 左右移動 & ダッシュ (Shiftキー)
    const isRunning = (keys["ShiftLeft"] || keys["ShiftRight"]) && !this.isCrouching;
    let maxSpeed = isRunning ? PHYSICS.MOVE_SPEED * 1.5 : PHYSICS.MOVE_SPEED;
    if (this.isCrouching) {
      maxSpeed *= 0.4;
    }

    let moveInput = 0;
    if (keys["KeyA"]) moveInput -= 1;
    if (keys["KeyD"]) moveInput += 1;

    if (moveInput !== 0) {
      this.vx += moveInput * PHYSICS.ACCELERATION;
      if (Math.abs(this.vx) > maxSpeed) {
        this.vx = Math.sign(this.vx) * maxSpeed;
      }
      this.facingLeft = moveInput < 0;
    } else {
      this.vx *= PHYSICS.FRICTION;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    // 3. ジャンプ入力・長押し可変ジャンプ・オートジャンプ防止
    const jumpKeyDown = Boolean(keys["KeyW"] || keys["Space"]);

    // キーを離した時点でジャンプ消費フラグをリセット
    if (!jumpKeyDown) {
      this.jumpInputConsumed = false;
      // 上昇中にキーを離したら上昇速度をカット（小ジャンプ対応）
      if (this.isJumping && this.vy < -1.8) {
        this.vy = -1.8;
      }
      this.isJumping = false;
    }

    // ジャンプ発動条件: キー押下中 + まだ消費されていない + 地面に立っている + しゃがんでいない
    if (jumpKeyDown && !this.jumpInputConsumed && this.isGrounded && !this.isCrouching) {
      this.vy = PHYSICS.INITIAL_JUMP_FORCE;
      this.isGrounded = false;
      this.isJumping = true;
      this.jumpHoldTimer = 0;
      this.jumpInputConsumed = true; // このキー押下でのジャンプは消費（着地しても再ジャンプさせない）
    }

    // 長押しによる継続上昇力付与
    if (this.isJumping && jumpKeyDown && this.vy < 0) {
      if (this.jumpHoldTimer < PHYSICS.MAX_JUMP_HOLD_FRAMES) {
        this.vy += PHYSICS.JUMP_HOLD_ACCEL;
        this.jumpHoldTimer++;
      } else {
        this.isJumping = false;
      }
    }

    // 4. 攻撃入力 (Eキー)
    const attackRequested = Boolean(keys["KeyE"]);
    if (attackRequested && this.equippedItem !== null && this.attackCooldown === 0) {
      if (onAttack) {
        const projectileX = this.facingLeft ? this.x - 6 : this.x + this.width + 1;
        const projectileY = this.y + (this.isCrouching ? 2 : 5);
        const direction = this.facingLeft ? -1 : 1;
        onAttack(projectileX, projectileY, direction, this.equippedItem);
      }
      this.attackCooldown = 18;
    }

    // 5. 緩やかな重力加算
    this.vy += PHYSICS.GRAVITY;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) {
      this.vy = PHYSICS.MAX_FALL_SPEED;
    }

    // 6. 地形衝突判定
    Physics.collideAndMoveX(this, tileMap);
    Physics.collideAndMoveY(this, tileMap);

    // 7. 画面外落下即死
    if (this.y > tileMap.height * TILE_SIZE + 32) {
      this.isDead = true;
    }
  }

  takeDamage() {
    if (this.invincibleTimer > 0 || this.isDead) return;

    if (this.equippedItem !== null) {
      this.equippedItem = null;
      this.invincibleTimer = 90;
      this.vy = -2.8;
    } else {
      this.isDead = true;
    }
  }

  bounce() {
    this.vy = PHYSICS.INITIAL_JUMP_FORCE * 0.82;
    this.isJumping = false;
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
    } else {
      ctx.translate(drawX, drawY);
    }

    if (this.isCrouching) {
      ctx.fillStyle = this.equippedItem ? "#38bdf8" : "#94a3b8";
      ctx.fillRect(1, 1, 12, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(8, 2, 4, 3);
    } else {
      drawTile(ctx, TILES.SPAWN_PLAYER, 0, 0, TILE_SIZE);
      if (this.equippedItem) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(6, -2, 4, 3);
      }
    }

    ctx.restore();
  }
}

window.Player = Player;