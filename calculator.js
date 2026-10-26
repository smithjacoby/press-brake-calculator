// Press-brake math is kept here so the page code only has to collect inputs and show results.
const defaultSettings = Object.freeze({
  homeX: -15.816
});
// These are the two fixed R-axis values used by the current tooling setup.
const REGULAR_Y_OFFSET = 1.28;
const LIFTED_Y_OFFSET = 1.6555;

// Normal mode measures from the rear of the paddle, which is one inch behind its front.
const normalPaddleOffset = 1;
// This threshold selects the existing lifted-paddle path for the current 1.18-inch test die.
const clearanceThreshold = -15.746;

// New paddle/home-X reference retained for display and future configuration work.
// It is the current default home X value above; the clearance threshold remains separate.
const NEW_PADDLE_CONFIGURATION_X = -15.816;

window.PressBrakeCalculator = Object.freeze({
  defaultSettings,
  REGULAR_Y_OFFSET,
  LIFTED_Y_OFFSET,
  NEW_PADDLE_CONFIGURATION_X,
  normalPaddleOffset,
  clearanceThreshold,

  // The selected die family supplies its width. Half of that width is the move-back distance.
  calculateMoveBack(dieWidth) {
    return dieWidth / 2;
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

  // Return every value the UI needs, using one mode decision for both X and Y/R.
  calculate(dieWidth, pieceLength, bendLength, homeX = defaultSettings.homeX) {
    const moveBack = this.calculateMoveBack(dieWidth);
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
     * const generalizedThreshold = referenceMaximumPaddlePosition + dieWidth;
     * const dieCenterReference = referenceMaximumPaddlePosition + (dieWidth / 2);
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
    // Use fixed tooling values. Do not derive the lifted value from the regular value.
    const yPosition = isLifted ? this.LIFTED_Y_OFFSET : this.REGULAR_Y_OFFSET;

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
