class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.camera = new Camera(this.canvas.width, this.canvas.height);

    this.hudHp = document.getElementById("hud-hp");
    this.hudEnergy = document.getElementById("hud-energy");
    this.hudStageName = document.getElementById("hud-stage-name");
    this.overlayGameOver = document.getElementById("overlay-gameover");
    this.overlayClear = document.getElementById("overlay-clear");
    this.clearScoreText = document.getElementById("clear-score-text");

    this.keys = {};
    this.tileMap = null;
    this.player = null;
    this.enemies = [];
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

    if (window.onTexturesReady) {
      window.onTexturesReady(() => {
        this.render();
      });
    }

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

  bindInputs() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "KeyR") {
        this.restart();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("blur", () => {
      this.keys = {};
    });

    document.getElementById("btn-restart-gameover").addEventListener("click", () => this.restart());
    document.getElementById("btn-restart-clear").addEventListener("click", () => this.restart());

    const toEditor = () => {
      window.location.href = "editor.html";
    };
    document.getElementById("btn-to-editor-gameover").addEventListener("click", toEditor);
    document.getElementById("btn-to-editor-clear").addEventListener("click", toEditor);
  }

  restart() {
    this.keys = {};
    this.loadStage();
    this.camera.focusImmediately(this.player);
  }

  update() {
    if (this.isCleared) return;

    this.player.update(this.keys, this.tileMap);

    if (this.player.isDead) {
      this.overlayGameOver.classList.add("active");
      return;
    }

    this.camera.follow(this.player);

    Physics.checkTriggers(this.player, this.tileMap, {
      onHazard: () => {
        this.player.takeDamage(1);
      },
      onItemCollect: (tx, ty) => {
        this.tileMap.setTile(tx, ty, TILES.EMPTY);
        this.energyCollected++;
        this.updateHUD();
      },
      onGoal: () => {
        this.onGoalReach();
      }
    });

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
          this.player.takeDamage(1);
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !e.removeMe);
    this.updateHUD();
  }

  onGoalReach() {
    this.isCleared = true;
    this.clearScoreText.innerText = `回収エネルギー: ${this.energyCollected} / ${this.totalEnergyCount}`;
    this.overlayClear.classList.add("active");
  }

  updateHUD() {
    this.hudHp.innerText = "♥".repeat(this.player.hp) + "♡".repeat(Math.max(0, this.player.maxHp - this.player.hp));
    this.hudEnergy.innerText = `${this.energyCollected} / ${this.totalEnergyCount}`;
  }

  render() {
    const ctx = this.ctx;
    const camera = this.camera;

    ctx.fillStyle = this.tileMap.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

    for (const enemy of this.enemies) {
      enemy.render(ctx, camera);
    }

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