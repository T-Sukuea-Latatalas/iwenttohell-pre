// 1タイルの基本ピクセルサイズ
const TILE_SIZE = 16;
const RENDER_SCALE = 2.5;

// タイルID定義
const TILES = Object.freeze({
  EMPTY: 0,
  SOLID_GROUND: 1,
  SOLID_BRICK: 2,
  PLATFORM: 3,
  HAZARD_SPIKE: 4,
  ITEM_ENERGY: 5,
  GOAL: 6,
  SPAWN_PLAYER: 10,
  SPAWN_SLIME: 20,
  SPAWN_FLYER: 21,
});

// ==========================================
// ★テクスチャ画像の一括管理設定
// ==========================================
const TEXTURE_DIR = "assets/textures/";

// タイルIDと画像ファイル名の対応表（ここを変更・追加するだけでOK）
const TEXTURE_FILES = Object.freeze({
  [TILES.SOLID_GROUND]: "ground.png",
  [TILES.SOLID_BRICK]:  "brick.png",
  [TILES.PLATFORM]:     "platform.png",
  [TILES.HAZARD_SPIKE]: "spike.png",
  [TILES.ITEM_ENERGY]:  "energy.png",
  [TILES.GOAL]:         "goal.png",
  [TILES.SPAWN_PLAYER]: "player.png",
  [TILES.SPAWN_SLIME]:  "slime.png",
  [TILES.SPAWN_FLYER]:  "flyer.png",
});

// タイルメタデータ情報
const TILE_DEFINITIONS = Object.freeze({
  [TILES.EMPTY]: { id: TILES.EMPTY, name: "空気 / 空白", solid: false, color: "transparent" },
  [TILES.SOLID_GROUND]: { id: TILES.SOLID_GROUND, name: "地面ブロック", solid: true, color: "#6b7280" },
  [TILES.SOLID_BRICK]: { id: TILES.SOLID_BRICK, name: "レンガブロック", solid: true, color: "#b45309" },
  [TILES.PLATFORM]: { id: TILES.PLATFORM, name: "すり抜け足場", solid: false, oneWay: true, color: "#a16207" },
  [TILES.HAZARD_SPIKE]: { id: TILES.HAZARD_SPIKE, name: "トゲ", solid: false, hazard: true, color: "#dc2626" },
  [TILES.ITEM_ENERGY]: { id: TILES.ITEM_ENERGY, name: "エナジーコア", solid: false, item: true, color: "#fbbf24" },
  [TILES.GOAL]: { id: TILES.GOAL, name: "ゴールゲート", solid: false, goal: true, color: "#10b981" },
  [TILES.SPAWN_PLAYER]: { id: TILES.SPAWN_PLAYER, name: "プレイヤー初期位置", solid: false, spawn: true, color: "#38bdf8" },
  [TILES.SPAWN_SLIME]: { id: TILES.SPAWN_SLIME, name: "敵 (スライム)", solid: false, spawn: true, color: "#a855f7" },
  [TILES.SPAWN_FLYER]: { id: TILES.SPAWN_FLYER, name: "敵 (ドローン)", solid: false, spawn: true, color: "#ec4899" }
});

const STORAGE_KEY_STAGE = "retro_platformer_custom_stage";

const PHYSICS = Object.freeze({
  GRAVITY: 0.38,
  MAX_FALL_SPEED: 7.0,
  MOVE_SPEED: 2.2,
  ACCELERATION: 0.3,
  FRICTION: 0.78,
  JUMP_FORCE: -6.8,
  ENEMY_SPEED: 0.8
});

// グローバルスコープへ公開
window.TILE_SIZE = TILE_SIZE;
window.RENDER_SCALE = RENDER_SCALE;
window.TILES = TILES;
window.TEXTURE_DIR = TEXTURE_DIR;
window.TEXTURE_FILES = TEXTURE_FILES;
window.TILE_DEFINITIONS = TILE_DEFINITIONS;
window.STORAGE_KEY_STAGE = STORAGE_KEY_STAGE;
window.PHYSICS = PHYSICS;