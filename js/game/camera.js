class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.smoothFactor = 0.12;

    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
  }

  setBounds(tileMap) {
    const mapPixelWidth = tileMap.width * TILE_SIZE;
    const mapPixelHeight = tileMap.height * TILE_SIZE;

    this.minX = 0;
    this.minY = 0;
    this.maxX = Math.max(0, mapPixelWidth - this.width);
    this.maxY = Math.max(0, mapPixelHeight - this.height);
  }

  follow(target) {
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    const desiredX = targetCenterX - this.width / 2;
    const desiredY = targetCenterY - this.height / 2;

    this.x += (desiredX - this.x) * this.smoothFactor;
    this.y += (desiredY - this.y) * this.smoothFactor;

    this.clamp();
  }

  focusImmediately(target) {
    this.x = target.x + target.width / 2 - this.width / 2;
    this.y = target.y + target.height / 2 - this.height / 2;
    this.clamp();
  }

  clamp() {
    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;
    if (this.y < this.minY) this.y = this.minY;
    if (this.y > this.maxY) this.y = this.maxY;
  }
}

window.Camera = Camera;