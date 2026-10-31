class Player {
  constructor(tileX, tileY) {
    this.normalWidth = 14;
    this.normalHeight = 15;
    this.crouchHeight = 9; // しゃがみ時の高さ

    this.width = this.normalWidth;
    this.height = this.normalHeight;

    this.spawnTileX = tileX;
    this.spawnTileY = tileY;

    this.prevY = 0;
    this.prevVy = 0;

    // アイテム所持状態 (null: 未所持, "core_blaster": 所持中)
    this.equippedItem = null;

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
  }

  /**
   * アイテム取得
   */
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

    // 1. しゃがみ判定 (Sキー)
    const crouchRequested = Boolean(keys["KeyS"]);
    if (crouchRequested && this.isGrounded) {
      if (!this.isCrouching) {
        this.isCrouching = true;
        this.y += (this.normalHeight - this.crouchHeight);
        this.height = this.crouchHeight;
      }
    } else if (this.isCrouching) {
      // 立ち上がり判定
      this.isCrouching = false;
      this.y -= (this.normalHeight - this.crouchHeight);
      this.height = this.normalHeight;
    }

    // 2. 移動 & ダッシュ (Shiftキー)
    const isRunning = (keys["ShiftLeft"] || keys["ShiftRight"]) && !this.isCrouching;
    let maxSpeed = isRunning ? PHYSICS.MOVE_SPEED * 1.5 : PHYSICS.MOVE_SPEED;
    if (this.isCrouching) {
      maxSpeed *= 0.4; // しゃがみ歩き
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

    // 3. ジャンプ判定 (W または Space)
    const jumpRequested = Boolean(keys["KeyW"] || keys["Space"]);
    if (jumpRequested && this.isGrounded && !this.isCrouching) {
      this.vy = PHYSICS.JUMP_FORCE;
      this.isGrounded = false;
    }

    // 4. 攻撃判定 (Eキー) - 「アイテム所持時のみ」発動
    const attackRequested = Boolean(keys["KeyE"]);
    if (attackRequested && this.equippedItem !== null && this.attackCooldown === 0) {
      if (onAttack) {
        // 弾の生成
        const projectileX = this.facingLeft ? this.x - 6 : this.x + this.width + 1;
        const projectileY = this.y + (this.isCrouching ? 2 : 5);
        const direction = this.facingLeft ? -1 : 1;
        onAttack(projectileX, projectileY, direction, this.equippedItem);
      }
      this.attackCooldown = 18; // 発射ディレイ
    }

    // 5. 重力加算
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

  /**
   * 被ダメージ処理
   * HP制は廃止。アイテム未所持なら即死、所持中ならアイテム消失で耐える
   */
  takeDamage() {
    if (this.invincibleTimer > 0 || this.isDead) return;

    if (this.equippedItem !== null) {
      // アイテムを消費して通常状態に戻る
      this.equippedItem = null;
      this.invincibleTimer = 90; // 約1.5秒の無敵時間
      this.vy = -3.5;
    } else {
      // アイテムなしでの被弾は即座にゲームオーバー
      this.isDead = true;
    }
  }

  bounce() {
    this.vy = PHYSICS.JUMP_FORCE * 0.85;
  }

  render(ctx, camera) {
    if (this.isDead) return;

    // 無敵点滅
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      return;
    }

    const drawX = Math.round(this.x - camera.x);
    const drawY = Math.round(this.y - camera.y);

    ctx.save();

    // 左右反転
    if (this.facingLeft) {
      ctx.translate(drawX + this.width, drawY);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(drawX, drawY);
    }

    // しゃがみ描画調整
    if (this.isCrouching) {
      // しゃがみ時の簡易スプライト描画
      ctx.fillStyle = this.equippedItem ? "#38bdf8" : "#94a3b8";
      ctx.fillRect(1, 1, 12, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(8, 2, 4, 3);
    } else {
      drawTile(ctx, TILES.SPAWN_PLAYER, 0, 0, TILE_SIZE);
      // アイテム所持時はアンテナ部分を強調表示
      if (this.equippedItem) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(6, -2, 4, 3);
      }
    }

    ctx.restore();
  }
}

window.Player = Player;