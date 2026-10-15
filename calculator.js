// Calculation functions are kept separate from page and DOM behavior.
const defaultSettings = Object.freeze({
  homeX: -15.746,
  homeY: 1.346
});

window.PressBrakeCalculator = Object.freeze({
  defaultSettings,

  calculateMoveBack(dieSize) {
    return dieSize / 2;
  },

  calculateXPosition(pieceLength, bendLength, moveBack) {
    return pieceLength - bendLength - moveBack - 1;
  },

  calculate(dieSize, pieceLength, bendLength) {
    const moveBack = this.calculateMoveBack(dieSize);
    return {
      moveBack,
      xPosition: this.calculateXPosition(pieceLength, bendLength, moveBack)
    };
  }
});
