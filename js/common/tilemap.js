class TileMap {
  constructor(width = 60, height = 18) {
    this.version = "1.0.0";
    this.name = "Sector 1";
    this.tileSize = TILE_SIZE;
    this.width = width;
    this.height = height;
    this.backgroundColor = "#1a1c23";
    this.spawn = { x: 2, y: height - 4 };
    this.tiles = new Array(this.width * this.height).fill(TILES.EMPTY);
    this.entities = [];

    this.createDefaultTerrain();
  }

  createDefaultTerrain() {
    for (let x = 0; x < this.width; x++) {
      this.setTile(x, this.height - 1, TILES.SOLID_GROUND);
      this.setTile(x, this.height - 2, TILES.SOLID_GROUND);
    }
    this.setTile(this.spawn.x, this.spawn.y, TILES.SPAWN_PLAYER);
    this.setTile(this.width - 4, this.height - 3, TILES.GOAL);
  }

  getIndex(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
    return y * this.width + x;
  }

  getTile(x, y) {
    const idx = this.getIndex(x, y);
    if (idx === -1) return TILES.SOLID_GROUND;
    return this.tiles[idx];
  }

  setTile(x, y, tileId) {
    const idx = this.getIndex(x, y);
    if (idx !== -1) {
      if (tileId === TILES.SPAWN_PLAYER) {
        for (let i = 0; i < this.tiles.length; i++) {
          if (this.tiles[i] === TILES.SPAWN_PLAYER) {
            this.tiles[i] = TILES.EMPTY;
          }
        }
        this.spawn = { x, y };
      }
      this.tiles[idx] = tileId;
    }
  }

  resize(newWidth, newHeight) {
    if (newWidth < 5 || newHeight < 5) return;
    const newTiles = new Array(newWidth * newHeight).fill(TILES.EMPTY);

    for (let y = 0; y < Math.min(this.height, newHeight); y++) {
      for (let x = 0; x < Math.min(this.width, newWidth); x++) {
        const oldIdx = y * this.width + x;
        const newIdx = y * newWidth + x;
        newTiles[newIdx] = this.tiles[oldIdx];
      }
    }

    this.width = newWidth;
    this.height = newHeight;
    this.tiles = newTiles;

    if (this.spawn.x >= this.width) this.spawn.x = this.width - 1;
    if (this.spawn.y >= this.height) this.spawn.y = this.height - 1;
  }

  clear() {
    this.tiles.fill(TILES.EMPTY);
    this.createDefaultTerrain();
  }

  toJSON() {
    const entities = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile === TILES.SPAWN_SLIME) {
          entities.push({ type: "slime", x, y, properties: { patrolRange: 4 } });
        } else if (tile === TILES.SPAWN_FLYER) {
          entities.push({ type: "flyer", x, y, properties: { patrolRange: 3 } });
        }
      }
    }

    return {
      version: this.version,
      name: this.name,
      tileSize: this.tileSize,
      width: this.width,
      height: this.height,
      backgroundColor: this.backgroundColor,
      spawn: { ...this.spawn },
      layers: {
        tiles: [...this.tiles]
      },
      entities: entities
    };
  }

  fromJSON(data) {
    const json = typeof data === "string" ? JSON.parse(data) : data;
    if (!json.width || !json.height || !json.layers?.tiles) {
      throw new Error("無効なステージデータです。");
    }

    this.version = json.version || "1.0.0";
    this.name = json.name || "Untitled";
    this.tileSize = json.tileSize || TILE_SIZE;
    this.width = json.width;
    this.height = json.height;
    this.backgroundColor = json.backgroundColor || "#1a1c23";
    this.spawn = json.spawn ? { ...json.spawn } : { x: 2, y: this.height - 4 };
    this.tiles = [...json.layers.tiles];
    this.entities = json.entities ? [...json.entities] : [];
  }
}

window.TileMap = TileMap;