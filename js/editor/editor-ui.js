class EditorUI {
  constructor(tileMap, editorCanvas) {
    this.tileMap = tileMap;
    this.editorCanvas = editorCanvas;

    // DOM要素
    this.paletteList = document.getElementById("object-palette-list");
    this.statusCoords = document.getElementById("status-coords");
    this.statusMode = document.getElementById("status-mode");
    this.inputWidth = document.getElementById("input-width");
    this.inputHeight = document.getElementById("input-height");
    this.btnResize = document.getElementById("btn-resize");
    this.btnClear = document.getElementById("btn-clear");
    this.btnIO = document.getElementById("btn-io");
    this.btnTestPlay = document.getElementById("btn-testplay");

    // モード切替ツールボタン
    this.toolPen = document.getElementById("tool-pen");
    this.toolEraser = document.getElementById("tool-eraser");
    this.toolSelect = document.getElementById("tool-select");
    this.toolDuplicate = document.getElementById("tool-duplicate");

    // モーダル
    this.modalIO = document.getElementById("modal-io");
    this.btnModalClose = document.getElementById("btn-modal-close");
    this.ioTextarea = document.getElementById("io-textarea");
    this.btnCopyJson = document.getElementById("btn-copy-json");
    this.btnDownloadJson = document.getElementById("btn-download-json");
    this.btnImportJson = document.getElementById("btn-import-json");

    this.initPalette();
    this.initTools();
    this.initShortcuts();
    this.initEventListeners();
    this.updateDimensionInputs();
  }

  /**
   * 上部オブジェクトトレイ生成（「空白」はパレットから除外し、消しゴムで消す仕様）
   */
  initPalette() {
    this.paletteList.innerHTML = "";

    Object.values(TILE_DEFINITIONS).forEach((def) => {
      // 空白タイルはオブジェクト一覧には含めない
      if (def.id === TILES.EMPTY) return;

      const btn = document.createElement("button");
      btn.className = "tray-btn";
      btn.dataset.id = def.id;

      if (def.id === this.editorCanvas.currentTileId) {
        btn.classList.add("active");
      }

      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = 28;
      iconCanvas.height = 28;
      iconCanvas.className = "tray-preview";
      const iconCtx = iconCanvas.getContext("2d");
      iconCtx.imageSmoothingEnabled = false;

      const sprite = getSpriteCanvas(def.id);
      if (sprite) {
        iconCtx.drawImage(sprite, 0, 0, 28, 28);
      }

      const label = document.createElement("span");
      label.className = "tray-label";
      label.innerText = def.name;

      btn.appendChild(iconCanvas);
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        this.selectObject(def.id, btn);
      });

      this.paletteList.appendChild(btn);
    });
  }

  selectObject(tileId, activeBtn) {
    this.editorCanvas.currentTileId = tileId;
    this.setMode("pen");

    const buttons = this.paletteList.querySelectorAll(".tray-btn");
    buttons.forEach((b) => b.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");

    const def = TILE_DEFINITIONS[tileId];
    this.statusMode.innerText = `MODE: 配置 [${def ? def.name : ""}]`;
    this.editorCanvas.render();
  }

  /**
   * 編集モード切替
   */
  setMode(mode) {
    this.editorCanvas.setMode(mode);

    [this.toolPen, this.toolEraser, this.toolSelect, this.toolDuplicate].forEach((btn) => {
      btn.classList.remove("active");
    });

    if (mode === "pen") {
      this.toolPen.classList.add("active");
      const def = TILE_DEFINITIONS[this.editorCanvas.currentTileId];
      this.statusMode.innerText = `MODE: 配置 [${def ? def.name : ""}]`;
    } else if (mode === "eraser") {
      this.toolEraser.classList.add("active");
      this.statusMode.innerText = `MODE: 消しゴム`;
    } else if (mode === "select") {
      this.toolSelect.classList.add("active");
      this.statusMode.innerText = `MODE: 範囲選択 (ドラッグして指定)`;
    } else if (mode === "stamp") {
      this.toolDuplicate.classList.add("active");
      this.statusMode.innerText = `MODE: 複製スタンプ (クリックして配置)`;
    }
  }

  initTools() {
    this.toolPen.addEventListener("click", () => this.setMode("pen"));
    this.toolEraser.addEventListener("click", () => this.setMode("eraser"));
    this.toolSelect.addEventListener("click", () => this.setMode("select"));
    this.toolDuplicate.addEventListener("click", () => this.triggerDuplicate());
  }

  triggerDuplicate() {
    if (!this.editorCanvas.hasSelection) {
      alert("複製する範囲を先に [S: 範囲選択] ツールで選択してください。");
      this.setMode("select");
      return;
    }
    const ok = this.editorCanvas.copySelection();
    if (ok) {
      this.setMode("stamp");
    }
  }

  /**
   * ショートカットキー制御（Q: 鉛筆, E: 消しゴム, S: 選択, D: 複製, Esc: 解除）
   */
  initShortcuts() {
    window.addEventListener("keydown", (e) => {
      // モーダル内のテキスト入力中は何もしない
      if (document.activeElement === this.ioTextarea || document.activeElement.tagName === "INPUT") {
        return;
      }

      if (e.code === "KeyQ") {
        this.setMode("pen");
      } else if (e.code === "KeyE") {
        this.setMode("eraser");
      } else if (e.code === "KeyS") {
        this.setMode("select");
      } else if (e.code === "KeyD") {
        this.triggerDuplicate();
      } else if (e.code === "Escape") {
        this.editorCanvas.clearSelection();
        this.setMode("pen");
      }
    });
  }

  initEventListeners() {
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
      this.ioTextarea.value = JSON.stringify(this.tileMap.toJSON(), null, 2);
      this.modalIO.classList.add("open");
    });

    this.btnModalClose.addEventListener("click", () => {
      this.modalIO.classList.remove("open");
    });

    this.btnCopyJson.addEventListener("click", async () => {
      await navigator.clipboard.writeText(this.ioTextarea.value);
      alert("JSONデータをコピーしました！");
    });

    this.btnDownloadJson.addEventListener("click", () => {
      const blob = new Blob([this.ioTextarea.value], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `custom_stage.json`;
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
        alert("ステージデータを正常に反映しました！");
      } catch (e) {
        alert("JSON読み込み失敗:\n" + e.message);
      }
    });

    // テストプレイは別ウィンドウとして開き、URLパラメータで editor_test モードを通知
    this.btnTestPlay.addEventListener("click", () => {
      const stageData = JSON.stringify(this.tileMap.toJSON());
      localStorage.setItem(STORAGE_KEY_STAGE, stageData);
      const width = 1024;
      const height = 640;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);

      window.open(
        "game.html?mode=editor_test",
        "PlatformerTestPlayWindow",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );
    });
  }

  updateDimensionInputs() {
    this.inputWidth.value = this.tileMap.width;
    this.inputHeight.value = this.tileMap.height;
  }

  updateCoordStatus(x, y) {
    if (x < 0 || y < 0) {
      this.statusCoords.innerText = "COORD: (--)";
    } else {
      this.statusCoords.innerText = `COORD: (X: ${x}, Y: ${y})`;
    }
  }
}

window.EditorUI = EditorUI;