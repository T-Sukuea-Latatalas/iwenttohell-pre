// 読み込んだ画像およびフォールバックCanvasのキャッシュ
const spriteCache = new Map();
const fallbackCache = new Map();
const imageCache = new Map();

// 画像ロード完了コールバックリスト
const textureLoadCallbacks = [];

/**
 * テクスチャ画像のロード監視リスナーを登録
 */
function onTexturesReady(callback) {
  textureLoadCallbacks.push(callback);
}

function notifyTexturesReady() {
  for (const cb of textureLoadCallbacks) {
    cb();
  }
}

/**
 * 初期フォールバック用のプロシージャル画像を生成
 */
function generateFallbackSprites() {
  if (fallbackCache.size > 0) return;

  // 1. 地面
  createProceduralSprite(TILES.SOLID_GROUND, (ctx) => {
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

  // 2. レンガ
  createProceduralSprite(TILES.SOLID_BRICK, (ctx) => {
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

  // 3. 足場
  createProceduralSprite(TILES.PLATFORM, (ctx) => {
    ctx.fillStyle = "#d97706";
    ctx.fillRect(0, 0, 16, 5);
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(3, 5, 2, 4);
    ctx.fillRect(11, 5, 2, 4);
  });

  // 4. トゲ
  createProceduralSprite(TILES.HAZARD_SPIKE, (ctx) => {
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

  // 5. アイテム
  createProceduralSprite(TILES.ITEM_ENERGY, (ctx) => {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(7, 7, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. ゴール
  createProceduralSprite(TILES.GOAL, (ctx) => {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(2, 0, 12, 16);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(4, 2, 8, 12);
    ctx.fillStyle = "#a7f3d0";
    ctx.fillRect(6, 4, 4, 8);
  });

  // 10. プレイヤー
  createProceduralSprite(TILES.SPAWN_PLAYER, (ctx) => {
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(3, 2, 10, 8);
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(4, 10, 8, 5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, 4, 6, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(7, 0, 2, 2);
  });

  // 20. スライム
  createProceduralSprite(TILES.SPAWN_SLIME, (ctx) => {
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

  // 21. ドローン
  createProceduralSprite(TILES.SPAWN_FLYER, (ctx) => {
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(1, 2, 14, 2);
    ctx.fillRect(7, 4, 2, 1);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(6, 7, 4, 2);
  });
}

function createProceduralSprite(tileId, renderFn) {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d");
  renderFn(ctx);
  fallbackCache.set(tileId, canvas);
  spriteCache.set(tileId, canvas);
}

/**
 * すべてのテクスチャ画像をロード
 */
function initSprites() {
  generateFallbackSprites();

  const entries = Object.entries(TEXTURE_FILES);
  let loadedCount = 0;

  for (const [tileIdStr, filename] of entries) {
    const tileId = Number(tileIdStr);
    const img = new Image();
    img.src = TEXTURE_DIR + filename;

    img.onload = () => {
      // ロード成功：画像オブジェクトを本番キャッシュに登録
      spriteCache.set(tileId, img);
      imageCache.set(tileId, img);
      loadedCount++;
      if (loadedCount === entries.length) {
        notifyTexturesReady();
      }
    };

    img.onerror = () => {
      // 画像が存在しない場合はフォールバックを使用（エラー停止しない）
      console.info(`[Info] 画像 '${TEXTURE_DIR + filename}' が未配置のためフォールバック描画を使用します。`);
      spriteCache.set(tileId, fallbackCache.get(tileId));
      loadedCount++;
      if (loadedCount === entries.length) {
        notifyTexturesReady();
      }
    };
  }
}

/**
 * 指定の座標にスプライトを描画
 */
function drawTile(ctx, tileId, dx, dy, dSize = TILE_SIZE) {
  if (tileId === TILES.EMPTY) return;
  const sprite = spriteCache.get(tileId) || fallbackCache.get(tileId);
  if (sprite) {
    ctx.drawImage(sprite, dx, dy, dSize, dSize);
  } else {
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(dx, dy, dSize, dSize);
  }
}

/**
 * パレット表示用スプライト（CanvasまたはImage）の取得
 */
function getSpriteCanvas(tileId) {
  return spriteCache.get(tileId) || fallbackCache.get(tileId);
}

/**
 * ★初期テクスチャ画像（16x16 PNG）を一括ダウンロードする便利機能
 */
function downloadDefaultTextures() {
  generateFallbackSprites();

  Object.entries(TEXTURE_FILES).forEach(([tileIdStr, filename], index) => {
    const tileId = Number(tileIdStr);
    const canvas = fallbackCache.get(tileId);
    if (!canvas) return;

    // ブラウザの同時ダウンロード制限を避けるため少しずつ遅延実行
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename;
      a.click();
    }, index * 180);
  });
}

window.initSprites = initSprites;
window.drawTile = drawTile;
window.getSpriteCanvas = getSpriteCanvas;
window.onTexturesReady = onTexturesReady;
window.downloadDefaultTextures = downloadDefaultTextures;