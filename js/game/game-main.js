/**
 * プレイヤーの発射する弾クラス
 */
class Projectile {
  constructor(x, y, dir, type) {
    this.x = x;
    this.y = y;
    this.width = 6;
    this.height = 4;
    this.speed = 4.8;
    this.vx = dir * this.speed;
    this.type = type;
    this.removeMe = false;
  }

  update(tileMap) {
    this.x += this.vx;

    const tx = Math.floor((this.vx > 0 ? this.x + this.width : this.x) / TILE_SIZE);
    const ty = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    const tile = tileMap.getTile(tx, ty);
    const def = TILE_DEFINITIONS[tile];
    if (def && def.solid) {
      this.removeMe = true;
    }

    if (this.x < 0 || this.x > tileMap.width * TILE_SIZE) {
      this.removeMe = true;
    }
  }

  render(ctx, camera) {
    const drawX = Math.round(this.x - camera.x);
    const drawY = Math.round(this.y - camera.y);

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(drawX, drawY, this.width, this.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(drawX + 1, drawY + 1, this.width - 2, this.height - 2);
  }
}

/**
 * 2Dアクションゲーム本体管理クラス
 */
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.camera = new Camera(this.canvas.width, this.canvas.height);

    this.hudStatus = document.getElementById("hud-status");
    this.hudEnergy = document.getElementById("hud-energy");
    this.hudStageName = document.getElementById("hud-stage-name");
    this.overlayGameOver = document.getElementById("overlay-gameover");
    this.overlayClear = document.getElementById("overlay-clear");
    this.clearScoreText = document.getElementById("clear-score-text");

    this.editorReturnBar = document.getElementById("editor-return-bar");
    this.btnReturnToEditor = document.getElementById("btn-return-to-editor");

    this.keys = {};
    this.tileMap = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.goalGate = null; // 3x3ゴールゲート位置情報 { x, y, entranceRect }

    this.energyCollected = 0;
    this.totalEnergyCount = 0;
    this.isCleared = false;

    this.init();
  }

  init() {
    initSprites();
    this.checkEditorTestMode();
    this.bindInputs();
    this.loadStage();
    this.camera.setBounds(this.tileMap);
    this.camera.focusImmediately(this.player);

    requestAnimationFrame(this.loop.bind(this));
  }

  checkEditorTestMode() {
    const params = new URLSearchParams(window.location.search);
    const isEditorTest = params.get("mode") === "editor_test";

    if (isEditorTest) {
      this.editorReturnBar.style.display = "block";
      const hud = document.getElementById("hud");
      if (hud) hud.style.top = "44px";

      this.btnReturnToEditor.addEventListener("click", () => {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
        }
        window.close();
      });
    } else {
      this.editorReturnBar.style.display = "none";
    }
  }

  loadStage() {
    this.tileMap = new TileMap(60, 18);
    const saved = localStorage.getItem(STORAGE_KEY_STAGE);
    if (saved) {
      try {
        this.tileMap.fromJSON(JSON.parse(saved));
      } catch (e) {
        console.error("ステージロード失敗:", e);
      }
    }

    this.hudStageName.innerText = this.tileMap.name;
    this.player = new Player(this.tileMap.spawn.x, this.tileMap.spawn.y);

    this.enemies = [];
    this.projectiles = [];
    this.goalGate = null;
    this.energyCollected = 0;
    this.totalEnergyCount = 0;

    // ステージ走査: エネミー、ゴールゲート(3x3)、アイテムの抽出
    for (let y = 0; y < this.tileMap.height; y++) {
      for (let x = 0; x < this.tileMap.width; x++) {
        const tile = this.tileMap.getTile(x, y);

        if (tile === TILES.SPAWN_SLIME) {
          this.enemies.push(new SlimeEnemy(x, y));
          this.tileMap.setTile(x, y, TILES.EMPTY);
        } else if (tile === TILES.SPAWN_FLYER) {
          this.enemies.push(new FlyerEnemy(x, y));
          this.tileMap.setTile(x, y, TILES.EMPTY);
        } else if (tile === TILES.SPAWN_PLAYER) {
          this.tileMap.setTile(x, y, TILES.EMPTY);
        } else if (tile === TILES.ITEM_ENERGY) {
          this.totalEnergyCount++;
        } else if (tile === TILES.GOAL && !this.goalGate) {
          // 配置タイル (x, y) を「3x3ゲートの底辺中央」として登録
          const gatePixelX = (x - 1) * TILE_SIZE;
          const gatePixelY = (y - 2) * TILE_SIZE;

          this.goalGate = {
            tileX: x,
            tileY: y,
            pixelX: gatePixelX,
            pixelY: gatePixelY,
            // 進入判定領域: 縦中央（幅16px）× 下から2マス（高さ32px）
            entranceRect: {
              x: gatePixelX + TILE_SIZE,      // 中央列
              y: gatePixelY + TILE_SIZE,      // 上から2マス目〜3マス目（下から2マス）
              width: TILE_SIZE,              // 16px
              height: TILE_SIZE * 2          // 32px
            }
          };
          this.tileMap.setTile(x, y, TILES.EMPTY); // 地形タイルとしては消去し、専用描画・判定へ
        }
      }
    }

    this.isCleared = false;
    this.overlayGameOver.classList.remove("active");
    this.overlayClear.classList.remove("active");
    this.updateHUD();
  }

  bindInputs() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        if (this.player.isDead || this.isCleared) {
          this.restart();
          return;
        }
      }

      if (!this.player.isDead && !this.isCleared) {
        this.keys[e.code] = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("blur", () => {
      this.keys = {};
      if (this.player) {
        this.player.jumpInputConsumed = false;
      }
    });

    window.addEventListener("click", (e) => {
      if (e.target !== this.btnReturnToEditor) {
        e.stopPropagation();
      }
    }, true);
  }

  restart() {
    this.keys = {};
    this.loadStage();
    this.camera.focusImmediately(this.player);
  }

  update() {
    if (this.isCleared) return;

    // 1. プレイヤー更新
    this.player.update(this.keys, this.tileMap, (px, py, dir, type) => {
      this.projectiles.push(new Projectile(px, py, dir, type));
    });

    if (this.player.isDead) {
      this.keys = {};
      this.overlayGameOver.classList.add("active");
      return;
    }

    // 2. カメラ追従
    this.camera.follow(this.player);

    // 3. 弾の更新 & エネミー衝突
    for (const proj of this.projectiles) {
      proj.update(this.tileMap);
      for (const enemy of this.enemies) {
        if (!enemy.isDead && Physics.intersects(proj, enemy)) {
          enemy.defeat();
          proj.removeMe = true;
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.removeMe);

    // 4. マップトリガー（トゲ・アイテム）
    Physics.checkTriggers(this.player, this.tileMap, {
      onHazard: () => {
        this.player.takeDamage();
      },
      onItemCollect: (tx, ty) => {
        this.tileMap.setTile(tx, ty, TILES.EMPTY);
        this.energyCollected++;
        this.player.obtainItem("core_blaster");
        this.updateHUD();
      }
    });

    // 5. ゴールゲート進入判定（中央下2マス領域 + 着地状態 + Wキー押下）
    if (this.goalGate) {
      const ent = this.goalGate.entranceRect;
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerFeetY = this.player.y + this.player.height;

      const isInEntrance = (
        playerCenterX >= ent.x &&
        playerCenterX <= ent.x + ent.width &&
        playerFeetY >= ent.y + 4 &&
        playerFeetY <= ent.y + ent.height + 4
      );

      // ジャンプ中は無視。地面に立っていて、かつWキーを押したときのみゴール
      if (isInEntrance && this.player.isGrounded && this.keys["KeyW"]) {
        this.onGoalReach();
        return;
      }
    }

    // 6. エネミー更新とプレイヤー衝突
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.update(this.tileMap);

      if (Physics.intersects(this.player, enemy)) {
        const prevBottom = this.player.prevY + this.player.height;
        const isStomping = (this.player.prevVy >= 0) && (prevBottom <= enemy.y + 8);

        if (isStomping) {
          enemy.defeat();
          this.player.bounce();
        } else {
          this.player.takeDamage();
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !e.removeMe);
    this.updateHUD();
  }

  onGoalReach() {
    this.isCleared = true;
    this.keys = {};
    if (this.player) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.jumpInputConsumed = true;
    }
    this.clearScoreText.innerText = `回収エネルギーコア: ${this.energyCollected} / ${this.totalEnergyCount}`;
    this.overlayClear.classList.add("active");
  }

  updateHUD() {
    if (this.player.equippedItem) {
      this.hudStatus.innerText = "ARMED";
      this.hudStatus.className = "hud-value active-item";
    } else {
      this.hudStatus.innerText = "NORMAL";
      this.hudStatus.className = "hud-value";
    }
    this.hudEnergy.innerText = `${this.energyCollected} / ${this.totalEnergyCount}`;
  }

  render() {
    const ctx = this.ctx;
    const camera = this.camera;

    // 1. 背景描画
    ctx.fillStyle = this.tileMap.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. タイル描画
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.ceil((camera.x + camera.width) / TILE_SIZE);
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.ceil((camera.y + camera.height) / TILE_SIZE);

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const tileId = this.tileMap.getTile(x, y);
        if (tileId !== TILES.EMPTY) {
          const drawX = Math.round(x * TILE_SIZE - camera.x);
          const drawY = Math.round(y * TILE_SIZE - camera.y);
          drawTile(ctx, tileId, drawX, drawY, TILE_SIZE);
        }
      }
    }

    // 3. 3x3 ゴールゲート描画
    if (this.goalGate) {
      const gateDrawX = Math.round(this.goalGate.pixelX - camera.x);
      const gateDrawY = Math.round(this.goalGate.pixelY - camera.y);
      drawGoalGate3x3(ctx, gateDrawX, gateDrawY);
    }

    // 4. 弾描画
    for (const proj of this.projectiles) {
      proj.render(ctx, camera);
    }

    // 5. エネミー描画
    for (const enemy of this.enemies) {
      enemy.render(ctx, camera);
    }

    // 6. プレイヤー描画
    this.player.render(ctx, camera);
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Game();
  console.log("2D Platformer Game 初期化完了");
});