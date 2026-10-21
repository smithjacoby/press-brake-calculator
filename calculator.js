// Calculation functions are kept separate from page and DOM behavior.
const defaultSettings = Object.freeze({
  homeX: -15.746,
  homeY: 1.346
});

window.PressBrakeCalculator = Object.freeze({
  defaultSettings,
  minimumXPosition: defaultSettings.homeX,

  calculateMoveBack(dieSize) {
    return dieSize / 2;
  },

  calculateXPosition(pieceLength, bendLength, moveBack, homeX = defaultSettings.homeX) {
    return homeX + pieceLength - bendLength - moveBack - 1;
  },

  calculate(dieSize, pieceLength, bendLength, homeX = defaultSettings.homeX) {
    const moveBack = this.calculateMoveBack(dieSize);
    return {
      moveBack,
      xPosition: this.calculateXPosition(pieceLength, bendLength, moveBack, homeX)
    };
  }
});
