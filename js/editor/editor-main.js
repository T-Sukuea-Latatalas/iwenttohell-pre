window.addEventListener("DOMContentLoaded", () => {
  initSprites();

  const tileMap = new TileMap(60, 18);
  const savedStage = localStorage.getItem(STORAGE_KEY_STAGE);
  if (savedStage) {
    try {
      tileMap.fromJSON(JSON.parse(savedStage));
    } catch (e) {
      console.warn("前回保存されたステージの復元に失敗しました:", e);
    }
  }

  const canvasElement = document.getElementById("editor-canvas");
  let ui = null;

  const editorCanvas = new EditorCanvas(canvasElement, tileMap, {
    scale: 2,
    onCoordChange: (x, y) => {
      if (ui) ui.updateCoordStatus(x, y);
    }
  });

  ui = new EditorUI(tileMap, editorCanvas);
  console.log("2D Stage Editor 初期化完了");
});