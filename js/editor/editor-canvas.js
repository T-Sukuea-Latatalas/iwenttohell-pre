class EditorCanvas {
  constructor(canvasElement, tileMap, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.tileMap = tileMap;

    this.scale = options.scale || 2;
    this.scaledTileSize = TILE_SIZE * this.scale;
    this.currentTileId = TILES.SOLID_GROUND;

    this.hoverTileX = -1;
    this.hoverTileY = -1;
    this.isMouseDown = false;
    this.mouseButton = 0;

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

  initEvents() {
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.canvas.addEventListener("mousedown", (e) => {
      this.isMouseDown = true;
      this.mouseButton = e.button;
      this.handlePaint(e);
    });

    window.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const tileX = Math.floor(mouseX / this.scaledTileSize);
      const tileY = Math.floor(mouseY / this.scaledTileSize);

      if (tileX !== this.hoverTileX || tileY !== this.hoverTileY) {
        this.hoverTileX = tileX;
        this.hoverTileY = tileY;
        if (this.onCoordChange) {
          this.onCoordChange(tileX, tileY);
        }
      }

      if (this.isMouseDown) {
        this.handlePaint(e);
      } else {
        this.render();
      }
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

  handlePaint(e) {
    if (
      this.hoverTileX < 0 ||
      this.hoverTileX >= this.tileMap.width ||
      this.hoverTileY < 0 ||
      this.hoverTileY >= this.tileMap.height
    ) {
      return;
    }

    const placeTileId = (this.mouseButton === 2) ? TILES.EMPTY : this.currentTileId;
    const currentTile = this.tileMap.getTile(this.hoverTileX, this.hoverTileY);

    if (currentTile !== placeTileId) {
      this.tileMap.setTile(this.hoverTileX, this.hoverTileY, placeTileId);
      this.render();
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const sSize = this.scaledTileSize;

    ctx.fillStyle = this.tileMap.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < this.tileMap.height; y++) {
      for (let x = 0; x < this.tileMap.width; x++) {
        const tileId = this.tileMap.getTile(x, y);
        if (tileId !== TILES.EMPTY) {
          drawTile(ctx, tileId, x * sSize, y * sSize, sSize);
        }
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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

    if (
      this.hoverTileX >= 0 &&
      this.hoverTileX < this.tileMap.width &&
      this.hoverTileY >= 0 &&
      this.hoverTileY < this.tileMap.height
    ) {
      const hx = this.hoverTileX * sSize;
      const hy = this.hoverTileY * sSize;

      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, sSize - 2, sSize - 2);

      if (this.currentTileId !== TILES.EMPTY) {
        ctx.globalAlpha = 0.55;
        drawTile(ctx, this.currentTileId, hx, hy, sSize);
      }
      ctx.restore();
    }
  }
}

window.EditorCanvas = EditorCanvas;