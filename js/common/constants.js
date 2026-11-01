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

// 物理演算パラメータ（緩やかな落下と可変ジャンプ用に調整）
const PHYSICS = Object.freeze({
  GRAVITY: 0.22,           // 重力を緩和 (0.38 -> 0.22)
  MAX_FALL_SPEED: 4.2,     // 落下終端速度を制限し急落下を防止 (7.0 -> 4.2)
  MOVE_SPEED: 2.0,         // 横移動基本速度
  ACCELERATION: 0.28,      // 横移動の立ち上がり加速度
  FRICTION: 0.80,          // 地上摩擦
  INITIAL_JUMP_FORCE: -4.8,// ジャンプ初速度
  JUMP_HOLD_ACCEL: -0.16,  // 長押し時に上乗せする持続上昇力
  MAX_JUMP_HOLD_FRAMES: 12,// 長押し効果が続く最大フレーム数
  ENEMY_SPEED: 0.75
});

// グローバルスコープへ公開
window.TILE_SIZE = TILE_SIZE;
window.RENDER_SCALE = RENDER_SCALE;
window.TILES = TILES;
window.TILE_DEFINITIONS = TILE_DEFINITIONS;
window.STORAGE_KEY_STAGE = STORAGE_KEY_STAGE;
window.PHYSICS = PHYSICS;