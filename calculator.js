// Calculation functions are kept separate from page and DOM behavior.
const defaultSettings = Object.freeze({
  homeX: -15.746,
  homeY: 1.346
});
const normalPaddleOffset = 1;
const paddleLiftAmount = 0.3755;
const clearanceThreshold = -15.746;

window.PressBrakeCalculator = Object.freeze({
  defaultSettings,
  normalPaddleOffset,
  paddleLiftAmount,
  clearanceThreshold,

  calculateMoveBack(dieSize) {
    return dieSize / 2;
  },

  calculateBaseXPosition(pieceLength, bendLength, moveBack, homeX = defaultSettings.homeX) {
    return homeX + pieceLength - bendLength - moveBack;
  },

  calculateXPosition(
    pieceLength,
    bendLength,
    moveBack,
    homeX = defaultSettings.homeX,
    paddleOffset = normalPaddleOffset
  ) {
    return this.calculateBaseXPosition(pieceLength, bendLength, moveBack, homeX) - paddleOffset;
  },

  calculate(
    dieSize,
    pieceLength,
    bendLength,
    homeX = defaultSettings.homeX,
    homeY = defaultSettings.homeY
  ) {
    const moveBack = this.calculateMoveBack(dieSize);
    const normalXPosition = this.calculateXPosition(pieceLength, bendLength, moveBack, homeX);

    /*
     * FUTURE DIE-LENGTH-DEPENDENT CLEARANCE LOGIC — INTENTIONALLY DISABLED FOR INITIAL TESTING.
     *
     * The active clearanceThreshold below is fixed at -15.746 for the current 1.18-inch die.
     * When validating other dies, replace or extend that fixed threshold calculation here with:
     *
     * const referenceDieLength = 1.18;
     * const referenceThreshold = -15.746;
     * const referenceMaximumPaddlePosition = referenceThreshold - referenceDieLength; // -16.926
     * const generalizedThreshold = referenceMaximumPaddlePosition + dieSize;
     * const dieCenterReference = referenceMaximumPaddlePosition + (dieSize / 2);
     *
     * This proposed geometry would replace the -15.746 X constant used below, which only
     * applies to the current die. Verify signs and real tooling geometry before enabling it.
     * Lifted mode must still use the front paddle reference (paddleOffset = 0), while normal
     * mode uses the rear reference (paddleOffset = 1). Do not base either mode on a rounded X.
     */

    // Select clearance mode from the unrounded normal-path X value. This avoids a circular
    // decision: lifted mode changes the paddle reference and therefore the final X value.
    // For the current 1.18-inch testing die, values below -15.746 require the paddle lift.
    const clearanceMode = normalXPosition < this.clearanceThreshold ? 'lifted' : 'normal';
    const isLifted = clearanceMode === 'lifted';
    const paddleOffset = isLifted ? 0 : this.normalPaddleOffset;
    const xPosition = this.calculateXPosition(pieceLength, bendLength, moveBack, homeX, paddleOffset);
    const yPosition = homeY + (isLifted ? this.paddleLiftAmount : 0);

    return {
      moveBack,
      normalXPosition,
      xPosition,
      yPosition,
      clearanceMode,
      paddleOffset
    };
  }
});
