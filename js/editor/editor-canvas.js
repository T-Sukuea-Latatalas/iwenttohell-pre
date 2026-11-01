class EditorCanvas {
  constructor(canvasElement, tileMap, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.tileMap = tileMap;

    this.scale = options.scale || 2;
    this.scaledTileSize = TILE_SIZE * this.scale;

    // 編集モード: 'pen' | 'eraser' | 'select' | 'stamp'
    this.mode = "pen";
    this.currentTileId = TILES.SOLID_GROUND;

    // マウスカーソル状態
    this.hoverTileX = -1;
    this.hoverTileY = -1;
    this.isMouseDown = false;

    // 範囲選択状態
    this.selectStart = null; // { x, y }
    this.selectBox = null;   // { x, y, width, height }
    this.hasSelection = false;

    // 複製バッファ
    this.clipboard = null; // { width, height, tiles: [[]] }

    this.onCoordChange = options.onCoordChange || null;

    this.initEvents();
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = this.tileMap.width * this.scaledTileSize;
    this.canvas.height = this.tileMap.height * this.scaledTileSize;
    this.ctx.imageSmoothingEnabled = false;
    this.render();
  }

  setMode(newMode) {
    this.mode = newMode;
    // 選択モード以外で未確定のドラッグがあればクリア
    if (newMode !== "select" && newMode !== "stamp") {
      this.selectStart = null;
    }
    this.render();
  }

  initEvents() {
    // 右クリックによるコンテキストメニューおよび右クリック消去を完全に無効化
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.canvas.addEventListener("mousedown", (e) => {
      // 左クリック(button === 0)のみを受け付ける（右クリック消去は一切禁止）
      if (e.button !== 0) return;

      this.isMouseDown = true;
      const { tileX, tileY } = this.getTileCoords(e);

      if (this.mode === "select") {
        this.selectStart = { x: tileX, y: tileY };
        this.selectBox = { x: tileX, y: tileY, width: 1, height: 1 };
        this.hasSelection = true;
      } else if (this.mode === "stamp") {
        this.pasteStamp(tileX, tileY);
      } else {
        this.handleDrawOrErase(tileX, tileY);
      }
      this.render();
    });

    window.addEventListener("mouseup", () => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        if (this.mode === "select" && this.selectBox) {
          // 選択範囲確定
        }
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const { tileX, tileY } = this.getTileCoords(e);

      if (tileX !== this.hoverTileX || tileY !== this.hoverTileY) {
        this.hoverTileX = tileX;
        this.hoverTileY = tileY;
        if (this.onCoordChange) {
          this.onCoordChange(tileX, tileY);
        }
      }

      if (this.isMouseDown) {
        if (this.mode === "select" && this.selectStart) {
          const minX = Math.min(this.selectStart.x, tileX);
          const minY = Math.min(this.selectStart.y, tileY);
          const maxX = Math.max(this.selectStart.x, tileX);
          const maxY = Math.max(this.selectStart.y, tileY);

          this.selectBox = {
            x: Math.max(0, minX),
            y: Math.max(0, minY),
            width: Math.min(this.tileMap.width - 1, maxX) - Math.max(0, minX) + 1,
            height: Math.min(this.tileMap.height - 1, maxY) - Math.max(0, minY) + 1
          };
          this.hasSelection = true;
        } else if (this.mode === "pen" || this.mode === "eraser") {
          this.handleDrawOrErase(tileX, tileY);
        }
      }

      this.render();
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.hoverTileX = -1;
      this.hoverTileY = -1;
      if (this.onCoordChange) {
        this.onCoordChange(-1, -1);
      }
      this.render();
    });
  }

  getTileCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return {
      tileX: Math.floor(mouseX / this.scaledTileSize),
      tileY: Math.floor(mouseY / this.scaledTileSize)
    };
  }

  /**
   * 配置または消しゴム処理
   */
  handleDrawOrErase(tx, ty) {
    if (tx < 0 || tx >= this.tileMap.width || ty < 0 || ty >= this.tileMap.height) return;

    if (this.mode === "eraser") {
      if (this.tileMap.getTile(tx, ty) !== TILES.EMPTY) {
        this.tileMap.setTile(tx, ty, TILES.EMPTY);
      }
    } else if (this.mode === "pen") {
      if (this.tileMap.getTile(tx, ty) !== this.currentTileId) {
        this.tileMap.setTile(tx, ty, this.currentTileId);
      }
    }
  }

  /**
   * 選択領域のコピー
   */
  copySelection() {
    if (!this.selectBox) return false;

    const { x, y, width, height } = this.selectBox;
    const tiles = [];

    for (let dy = 0; dy < height; dy++) {
      const row = [];
      for (let dx = 0; dx < width; dx++) {
        row.push(this.tileMap.getTile(x + dx, y + dy));
      }
      tiles.push(row);
    }

    this.clipboard = { width, height, tiles };
    return true;
  }

  /**
   * 複製スタンプのペースト
   */
  pasteStamp(targetX, targetY) {
    if (!this.clipboard) return;

    const { width, height, tiles } = this.clipboard;

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const placeX = targetX + dx;
        const placeY = targetY + dy;
        const tileId = tiles[dy][dx];

        if (placeX >= 0 && placeX < this.tileMap.width && placeY >= 0 && placeY < this.tileMap.height) {
          // 元が空気でない、または元通りの形を敷設
          this.tileMap.setTile(placeX, placeY, tileId);
        }
      }
    }
  }

  /**
   * 選択状態の解除
   */
  clearSelection() {
    this.selectBox = null;
    this.selectStart = null;
    this.hasSelection = false;
    if (this.mode === "select" || this.mode === "stamp") {
      this.mode = "pen";
    }
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const sSize = this.scaledTileSize;

    // 1. 背景描画
    ctx.fillStyle = this.tileMap.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 2. タイル描画
    for (let y = 0; y < this.tileMap.height; y++) {
      for (let x = 0; x < this.tileMap.width; x++) {
        const tileId = this.tileMap.getTile(x, y);
        if (tileId !== TILES.EMPTY) {
          drawTile(ctx, tileId, x * sSize, y * sSize, sSize);
        }
      }
    }

    // 3. グリッド線描画
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.beginPath();
    for (let x = 0; x <= this.tileMap.width; x++) {
      const px = x * sSize;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let y = 0; y <= this.tileMap.height; y++) {
      const py = y * sSize;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    // 4. 範囲選択ハイライト枠
    if (this.selectBox) {
      const bx = this.selectBox.x * sSize;
      const by = this.selectBox.y * sSize;
      const bw = this.selectBox.width * sSize;
      const bh = this.selectBox.height * sSize;

      ctx.save();
      ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
      ctx.fillRect(bx, by, bw, bh);

      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    }

    // 5. ホバーカーソル & プレビュー表示
    if (
      this.hoverTileX >= 0 &&
      this.hoverTileX < this.tileMap.width &&
      this.hoverTileY >= 0 &&
      this.hoverTileY < this.tileMap.height
    ) {
      const hx = this.hoverTileX * sSize;
      const hy = this.hoverTileY * sSize;

      ctx.save();
      if (this.mode === "eraser") {
        // 消しゴムカーソル（赤い×枠）
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, sSize - 2, sSize - 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.fillRect(hx + 1, hy + 1, sSize - 2, sSize - 2);
      } else if (this.mode === "pen") {
        // 配置プレビュー
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, sSize - 2, sSize - 2);
        ctx.globalAlpha = 0.55;
        drawTile(ctx, this.currentTileId, hx, hy, sSize);
      } else if (this.mode === "stamp" && this.clipboard) {
        // 複製スタンププレビュー
        const cw = this.clipboard.width;
        const ch = this.clipboard.height;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, cw * sSize, ch * sSize);
        ctx.globalAlpha = 0.6;
        for (let dy = 0; dy < ch; dy++) {
          for (let dx = 0; dx < cw; dx++) {
            const tid = this.clipboard.tiles[dy][dx];
            if (tid !== TILES.EMPTY) {
              drawTile(ctx, tid, (this.hoverTileX + dx) * sSize, (this.hoverTileY + dy) * sSize, sSize);
            }
          }
        }
      }
      ctx.restore();
    }
  }
}

window.EditorCanvas = EditorCanvas;