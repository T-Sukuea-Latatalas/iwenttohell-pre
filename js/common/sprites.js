const spriteCache = new Map();

function initSprites() {
  if (spriteCache.size > 0) return;

  // 1. SOLID_GROUND (地面)
  createTileSprite(TILES.SOLID_GROUND, (ctx) => {
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(2, 4, 2, 2);
    ctx.fillRect(7, 4, 3, 2);
    ctx.fillRect(13, 4, 2, 1);
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(3, 8, 2, 2);
    ctx.fillRect(10, 11, 2, 2);
  });

  // 2. SOLID_BRICK (レンガ)
  createTileSprite(TILES.SOLID_BRICK, (ctx) => {
    ctx.fillStyle = "#9a3412";
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#431407";
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(7, 0, 1, 7);
    ctx.fillRect(15, 0, 1, 7);
    ctx.fillRect(3, 8, 1, 7);
    ctx.fillRect(11, 8, 1, 7);
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(1, 1, 5, 1);
    ctx.fillRect(8, 1, 6, 1);
  });

  // 3. PLATFORM (足場)
  createTileSprite(TILES.PLATFORM, (ctx) => {
    ctx.fillStyle = "#d97706";
    ctx.fillRect(0, 0, 16, 5);
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(3, 5, 2, 4);
    ctx.fillRect(11, 5, 2, 4);
  });

  // 4. HAZARD_SPIKE (トゲ)
  createTileSprite(TILES.HAZARD_SPIKE, (ctx) => {
    ctx.fillStyle = "#94a3b8";
    for (const offset of [0, 8]) {
      ctx.beginPath();
      ctx.moveTo(offset, 16);
      ctx.lineTo(offset + 4, 2);
      ctx.lineTo(offset + 8, 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(3, 2, 2, 3);
    ctx.fillRect(11, 2, 2, 3);
  });

  // 5. ITEM_ENERGY (収集アイテム)
  createTileSprite(TILES.ITEM_ENERGY, (ctx) => {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(7, 7, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. GOAL (パレット用 16x16 簡易表示)
  createTileSprite(TILES.GOAL, (ctx) => {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(2, 0, 12, 16);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(4, 2, 8, 12);
    ctx.fillStyle = "#a7f3d0";
    ctx.fillRect(6, 4, 4, 8);
  });

  // 10. SPAWN_PLAYER (プレイヤー)
  createTileSprite(TILES.SPAWN_PLAYER, (ctx) => {
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(3, 2, 10, 8);
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(4, 10, 8, 5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, 4, 6, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(7, 0, 2, 2);
  });

  // 20. SPAWN_SLIME (スライム)
  createTileSprite(TILES.SPAWN_SLIME, (ctx) => {
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(8, 9, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(2, 10, 12, 5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(4, 8, 2, 3);
    ctx.fillRect(10, 8, 2, 3);
    ctx.fillStyle = "#000000";
    ctx.fillRect(5, 9, 1, 2);
    ctx.fillRect(11, 9, 1, 2);
  });

  // 21. SPAWN_FLYER (ドローン)
  createTileSprite(TILES.SPAWN_FLYER, (ctx) => {
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(1, 2, 14, 2);
    ctx.fillRect(7, 4, 2, 1);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(6, 7, 4, 2);
  });
}

function createTileSprite(tileId, renderFn) {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d");
  renderFn(ctx);
  spriteCache.set(tileId, canvas);
}

function drawTile(ctx, tileId, dx, dy, dSize = TILE_SIZE) {
  if (tileId === TILES.EMPTY) return;
  const sprite = spriteCache.get(tileId);
  if (sprite) {
    ctx.drawImage(sprite, dx, dy, dSize, dSize);
  } else {
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(dx, dy, dSize, dSize);
  }
}

/**
 * 3x3マス (48x48px) のゴールゲートを描画
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x ゲート左上X座標 (px)
 * @param {number} y ゲート左上Y座標 (px)
 */
function drawGoalGate3x3(ctx, x, y) {
  const size = TILE_SIZE * 3; // 48px

  ctx.save();

  // ゲート外枠（アーチ柱）
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x + 2, y + 4, 10, size - 4);            // 左柱
  ctx.fillRect(x + size - 12, y + 4, 10, size - 4);     // 右柱
  ctx.fillRect(x + 2, y + 2, size - 4, 12);            // 天井アーチ

  // 内枠ハイライト
  ctx.fillStyle = "#334155";
  ctx.fillRect(x + 6, y + 6, size - 12, 6);
  ctx.fillRect(x + 4, y + 12, 6, size - 12);
  ctx.fillRect(x + size - 10, y + 12, 6, size - 12);

  // ポータル内部空間（中央の縦2マス分）
  ctx.fillStyle = "#064e3b";
  ctx.fillRect(x + 14, y + 16, 20, 32);

  // エネルギーポータル（輝くエネルギーの渦）
  ctx.fillStyle = "#10b981";
  ctx.fillRect(x + 17, y + 20, 14, 28);
  ctx.fillStyle = "#6ee7b7";
  ctx.fillRect(x + 20, y + 24, 8, 24);
  ctx.fillStyle = "#ecfdf5";
  ctx.fillRect(x + 22, y + 28, 4, 20);

  // 上部エナジーコアランプ（発光体）
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // 足元ステップ
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x, y + size - 3, size, 3);

  ctx.restore();
}

function getSpriteCanvas(tileId) {
  return spriteCache.get(tileId);
}

window.initSprites = initSprites;
window.drawTile = drawTile;
window.drawGoalGate3x3 = drawGoalGate3x3;
window.getSpriteCanvas = getSpriteCanvas;