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

    // 壁との衝突で消滅
    const tx = Math.floor((this.vx > 0 ? this.x + this.width : this.x) / TILE_SIZE);
    const ty = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    const tile = tileMap.getTile(tx, ty);
    const def = TILE_DEFINITIONS[tile];
    if (def && def.solid) {
      this.removeMe = true;
    }

    // 画面外範囲で消滅
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

    // DOM参照
    this.hudStatus = document.getElementById("hud-status");
    this.hudEnergy = document.getElementById("hud-energy");
    this.hudStageName = document.getElementById("hud-stage-name");
    this.overlayGameOver = document.getElementById("overlay-gameover");
    this.overlayClear = document.getElementById("overlay-clear");
    this.clearScoreText = document.getElementById("clear-score-text");

    this.keys = {};
    this.tileMap = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];

    this.energyCollected = 0;
    this.totalEnergyCount = 0;
    this.isCleared = false;

    this.init();
  }

  init() {
    initSprites();
    this.bindInputs();
    this.loadStage();
    this.camera.setBounds(this.tileMap);
    this.camera.focusImmediately(this.player);

    requestAnimationFrame(this.loop.bind(this));
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
    this.energyCollected = 0;
    this.totalEnergyCount = 0;

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
        }
      }
    }

    this.isCleared = false;
    this.overlayGameOver.classList.remove("active");
    this.overlayClear.classList.remove("active");
    this.updateHUD();
  }

  /**
   * キー入力監視（クリックリスタートは完全に排除）
   */
  bindInputs() {
    window.addEventListener("keydown", (e) => {
      // ゲームオーバーまたはクリア時の [R] 再スタート処理
      if (e.code === "KeyR") {
        if (this.player.isDead || this.isCleared) {
          this.restart();
          return;
        }
      }

      // ゲーム進行中のみキーを記録（Space/Jump残留による誤作動を防止）
      if (!this.player.isDead && !this.isCleared) {
        this.keys[e.code] = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // ウィンドウからフォーカスが外れた際のキー入力残留を防止
    window.addEventListener("blur", () => {
      this.keys = {};
    });

    // 画面クリックによる再スタート防止（コンテキストメニューやクリック無効）
    window.addEventListener("click", (e) => {
      e.stopPropagation();
    }, true);
  }

  /**
   * 明示的なリスタート処理
   */
  restart() {
    this.keys = {}; // 入力バッファを強制クリア（ジャンプ残留防止）
    this.loadStage();
    this.camera.focusImmediately(this.player);
  }

  update() {
    if (this.isCleared) return;

    // 1. プレイヤー更新
    this.player.update(this.keys, this.tileMap, (px, py, dir, type) => {
      // 弾発射（アイテム所持時のみ呼ばれる）
      this.projectiles.push(new Projectile(px, py, dir, type));
    });

    // ゲームオーバー判定（入力バッファを完全に消去）
    if (this.player.isDead) {
      this.keys = {};
      this.overlayGameOver.classList.add("active");
      return;
    }

    // 2. カメラ更新
    this.camera.follow(this.player);

    // 3. 弾の更新とエネミー衝突判定
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

    // 4. マップトリガー（トゲ、アイテム、ゴール）
    Physics.checkTriggers(this.player, this.tileMap, {
      onHazard: () => {
        this.player.takeDamage();
      },
      onItemCollect: (tx, ty) => {
        this.tileMap.setTile(tx, ty, TILES.EMPTY);
        this.energyCollected++;
        // アイテム取得により攻撃可能になる
        this.player.obtainItem("core_blaster");
        this.updateHUD();
      },
      onGoal: () => {
        this.onGoalReach();
      }
    });

    // 5. エネミー更新とプレイヤー衝突
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.update(this.tileMap);

      if (Physics.intersects(this.player, enemy)) {
        // 踏みつけ判定
        const prevBottom = this.player.prevY + this.player.height;
        const isStomping = (this.player.prevVy >= 0) && (prevBottom <= enemy.y + 8);

        if (isStomping) {
          enemy.defeat();
          this.player.bounce();
        } else {
          // 被ダメージ（アイテムなしなら即死、ありなら通常化）
          this.player.takeDamage();
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !e.removeMe);
    this.updateHUD();
  }

  onGoalReach() {
    this.isCleared = true;
    this.keys = {}; // 入力バッファを消去
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

    // 背景クリア
    ctx.fillStyle = this.tileMap.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // タイル描画
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

    // 弾描画
    for (const proj of this.projectiles) {
      proj.render(ctx, camera);
    }

    // エネミー描画
    for (const enemy of this.enemies) {
      enemy.render(ctx, camera);
    }

    // プレイヤー描画
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