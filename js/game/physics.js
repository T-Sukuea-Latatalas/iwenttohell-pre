class Physics {
  static intersects(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  static collideAndMoveX(entity, tileMap) {
    if (entity.vx === 0) return;

    entity.x += entity.vx;

    const startTileY = Math.floor(entity.y / TILE_SIZE);
    const endTileY = Math.floor((entity.y + entity.height - 0.001) / TILE_SIZE);

    if (entity.vx > 0) {
      // 右移動: 右端が触れるタイル列をチェック（境界ピクセルでの誤判定を防ぐため -0.001 を適用）
      const checkTileX = Math.floor((entity.x + entity.width - 0.001) / TILE_SIZE);

      for (let ty = startTileY; ty <= endTileY; ty++) {
        const tileId = tileMap.getTile(checkTileX, ty);
        const def = TILE_DEFINITIONS[tileId];

        if (def && def.solid) {
          entity.x = checkTileX * TILE_SIZE - entity.width;
          entity.vx = 0;
          break;
        }
      }
    } else if (entity.vx < 0) {
      // 左移動: 左端が触れるタイル列をチェック
      const checkTileX = Math.floor(entity.x / TILE_SIZE);

      for (let ty = startTileY; ty <= endTileY; ty++) {
        const tileId = tileMap.getTile(checkTileX, ty);
        const def = TILE_DEFINITIONS[tileId];

        if (def && def.solid) {
          entity.x = (checkTileX + 1) * TILE_SIZE;
          entity.vx = 0;
          break;
        }
      }
    }
  }

  static collideAndMoveY(entity, tileMap) {
    const prevY = entity.y;
    entity.y += entity.vy;
    entity.isGrounded = false;

    const startTileX = Math.floor(entity.x / TILE_SIZE);
    const endTileX = Math.floor((entity.x + entity.width - 0.001) / TILE_SIZE);

    if (entity.vy > 0) {
      // 下降中: 足元が触れるタイル行をチェック
      const checkTileY = Math.floor((entity.y + entity.height) / TILE_SIZE);

      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileId = tileMap.getTile(tx, checkTileY);
        const def = TILE_DEFINITIONS[tileId];

        if (!def) continue;

        // 1. 通常ソリッド床
        if (def.solid) {
          entity.y = checkTileY * TILE_SIZE - entity.height;
          entity.vy = 0;
          entity.isGrounded = true;
          break;
        }

        // 2. 一方通行プラットフォーム
        if (def.oneWay) {
          const platformTop = checkTileY * TILE_SIZE;
          const prevBottom = prevY + entity.height;

          if (prevBottom <= platformTop + 1.0) {
            entity.y = platformTop - entity.height;
            entity.vy = 0;
            entity.isGrounded = true;
            break;
          }
        }
      }
    } else if (entity.vy < 0) {
      // 上昇中: 頭頂部が触れるタイル行をチェック
      const checkTileY = Math.floor(entity.y / TILE_SIZE);

      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileId = tileMap.getTile(tx, checkTileY);
        const def = TILE_DEFINITIONS[tileId];

        if (def && def.solid) {
          entity.y = (checkTileY + 1) * TILE_SIZE;
          entity.vy = 0;
          break;
        }
      }
    }
  }

  static checkTriggers(entity, tileMap, callbacks) {
    const startTileX = Math.floor(entity.x / TILE_SIZE);
    const endTileX = Math.floor((entity.x + entity.width - 0.001) / TILE_SIZE);
    const startTileY = Math.floor(entity.y / TILE_SIZE);
    const endTileY = Math.floor((entity.y + entity.height - 0.001) / TILE_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileId = tileMap.getTile(tx, ty);

        if (tileId === TILES.HAZARD_SPIKE && callbacks.onHazard) {
          callbacks.onHazard(tx, ty);
        } else if (tileId === TILES.ITEM_ENERGY && callbacks.onItemCollect) {
          callbacks.onItemCollect(tx, ty);
        } else if (tileId === TILES.GOAL && callbacks.onGoal) {
          callbacks.onGoal(tx, ty);
        }
      }
    }
  }
}

window.Physics = Physics;