class EditorUI {
  constructor(tileMap, editorCanvas) {
    this.tileMap = tileMap;
    this.editorCanvas = editorCanvas;

    this.paletteContainer = document.getElementById("tile-palette-grid");
    this.statusCoords = document.getElementById("status-coords");
    this.statusSelection = document.getElementById("status-selection");
    this.inputWidth = document.getElementById("input-width");
    this.inputHeight = document.getElementById("input-height");
    this.btnResize = document.getElementById("btn-resize");
    this.btnClear = document.getElementById("btn-clear");
    this.btnIO = document.getElementById("btn-io");
    this.btnTestPlay = document.getElementById("btn-testplay");
    this.btnExportTextures = document.getElementById("btn-export-textures");

    this.modalIO = document.getElementById("modal-io");
    this.btnModalClose = document.getElementById("btn-modal-close");
    this.ioTextarea = document.getElementById("io-textarea");
    this.btnCopyJson = document.getElementById("btn-copy-json");
    this.btnDownloadJson = document.getElementById("btn-download-json");
    this.btnImportJson = document.getElementById("btn-import-json");

    this.initPalette();
    this.initEventListeners();
    this.updateDimensionInputs();

    // テクスチャ画像が後から読み込み完了した際にパレットを自動更新
    if (window.onTexturesReady) {
      window.onTexturesReady(() => {
        this.initPalette();
        this.editorCanvas.render();
      });
    }
  }

  initPalette() {
    this.paletteContainer.innerHTML = "";

    Object.values(TILE_DEFINITIONS).forEach((def) => {
      const btn = document.createElement("button");
      btn.className = "palette-btn";
      btn.dataset.id = def.id;

      if (def.id === this.editorCanvas.currentTileId) {
        btn.classList.add("active");
      }

      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = 32;
      iconCanvas.height = 32;
      iconCanvas.className = "palette-preview";
      const iconCtx = iconCanvas.getContext("2d");
      iconCtx.imageSmoothingEnabled = false;

      const sprite = getSpriteCanvas(def.id);
      if (sprite) {
        iconCtx.drawImage(sprite, 0, 0, 32, 32);
      } else {
        iconCtx.strokeStyle = "#475569";
        iconCtx.lineWidth = 2;
        iconCtx.strokeRect(4, 4, 24, 24);
      }

      const label = document.createElement("span");
      label.className = "palette-name";
      label.innerText = def.name;

      btn.appendChild(iconCanvas);
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        this.selectTile(def.id, btn);
      });

      this.paletteContainer.appendChild(btn);
    });
  }

  selectTile(tileId, activeBtn) {
    this.editorCanvas.currentTileId = tileId;
    const buttons = this.paletteContainer.querySelectorAll(".palette-btn");
    buttons.forEach((b) => b.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");

    const def = TILE_DEFINITIONS[tileId];
    this.statusSelection.innerText = `選択タイル: [${tileId}] ${def ? def.name : "不明"}`;
    this.editorCanvas.render();
  }

  initEventListeners() {
    // テクスチャ画像一括ダウンロード
    if (this.btnExportTextures) {
      this.btnExportTextures.addEventListener("click", () => {
        if (confirm("全テクスチャのベース画像（16x16 PNGファイル一式）をダウンロードしますか？\nダウンロードした画像は assets/textures/ フォルダに配置してください。")) {
          downloadDefaultTextures();
        }
      });
    }

    this.btnResize.addEventListener("click", () => {
      const w = parseInt(this.inputWidth.value, 10);
      const h = parseInt(this.inputHeight.value, 10);

      if (isNaN(w) || isNaN(h) || w < 10 || h < 10 || w > 300 || h > 100) {
        alert("有効なサイズを入力してください（幅: 10〜300, 高さ: 10〜100）");
        return;
      }

      if (confirm(`ステージサイズを ${w} × ${h} に変更しますか？`)) {
        this.tileMap.resize(w, h);
        this.editorCanvas.resizeCanvas();
      }
    });

    this.btnClear.addEventListener("click", () => {
      if (confirm("ステージ上のタイルをすべてリセットしますか？")) {
        this.tileMap.clear();
        this.editorCanvas.render();
      }
    });

    this.btnIO.addEventListener("click", () => {
      const jsonStr = JSON.stringify(this.tileMap.toJSON(), null, 2);
      this.ioTextarea.value = jsonStr;
      this.modalIO.classList.add("open");
    });

    this.btnModalClose.addEventListener("click", () => {
      this.modalIO.classList.remove("open");
    });

    this.btnCopyJson.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(this.ioTextarea.value);
        alert("JSONデータをクリップボードにコピーしました！");
      } catch (err) {
        this.ioTextarea.select();
        document.execCommand("copy");
        alert("JSONデータをコピーしました！");
      }
    });

    this.btnDownloadJson.addEventListener("click", () => {
      const blob = new Blob([this.ioTextarea.value], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.tileMap.name.toLowerCase().replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    this.btnImportJson.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(this.ioTextarea.value);
        this.tileMap.fromJSON(parsed);
        this.updateDimensionInputs();
        this.editorCanvas.resizeCanvas();
        this.modalIO.classList.remove("open");
        alert("ステージデータを正常にインポートしました！");
      } catch (e) {
        alert("JSONの読み込みに失敗しました。\n" + e.message);
      }
    });

    this.btnTestPlay.addEventListener("click", () => {
      const stageData = JSON.stringify(this.tileMap.toJSON());
      localStorage.setItem(STORAGE_KEY_STAGE, stageData);
      window.location.href = "game.html";
    });
  }

  updateDimensionInputs() {
    this.inputWidth.value = this.tileMap.width;
    this.inputHeight.value = this.tileMap.height;
  }

  updateCoordStatus(x, y) {
    if (x < 0 || y < 0) {
      this.statusCoords.innerText = "座標: (--)";
    } else {
      this.statusCoords.innerText = `座標: (X: ${x}, Y: ${y})`;
    }
  }
}

window.EditorUI = EditorUI;