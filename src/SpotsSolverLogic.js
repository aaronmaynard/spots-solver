// SpotsSolverLogic.js
class SpotsSolver {
  constructor() {
    this.colorIds = ["r", "b", "g", "y", "w", "p"]; // Abstract color identifiers (red, blue, green, yellow, white, purple)
    this.sequenceLength = 4; // Fixed length for Spots.wtf
    this.possibleSequences = this.generateAllSequences(); // Precompute all possible sequences
    this.history = []; // Store guesses and feedback
    this.eliminatedColors = new Set(); // Colors known to be absent
    this.colorPositions = {}; // Track where colors have appeared (position => color)
    this.positionExclusions = {}; // Track colors excluded from positions
    this.isFirstGuess = true; // Track if this is the first guess to prevent premature elimination
  }

  // Generate all possible sequences (4-position combinations of available colors)
  generateAllSequences() {
    const sequences = [];
    const generatePermutations = (current, remainingLength) => {
      if (remainingLength === 0) {
        sequences.push([...current]);
        return;
      }
      for (const color of this.colorIds) {
        current.push(color);
        generatePermutations(current, remainingLength - 1);
        current.pop();
      }
    };
    generatePermutations([], this.sequenceLength);
    return sequences;
  }

  // Evaluate a guess against the hidden sequence (for internal use)
  evaluateGuess(guess, target) {
    let green = 0, yellow = 0;
    const guessCount = {};
    const targetCount = {};

    // Count greens (correct position and color)
    for (let i = 0; i < this.sequenceLength; i++) {
      if (guess[i] === target[i]) {
        green++;
      } else {
        guessCount[guess[i]] = (guessCount[guess[i]] || 0) + 1;
        targetCount[target[i]] = (targetCount[target[i]] || 0) + 1;
      }
    }

    // Count yellows (correct color, wrong position)
    for (const color in guessCount) {
      if (targetCount[color]) {
        yellow += Math.min(guessCount[color], targetCount[color]);
      }
    }

    return { green, yellow };
  }

  // Generate the next guess based on current state and required feedback
  generateNextGuess(currentGuess, feedback) {
    if (!feedback || feedback.green === undefined || feedback.yellow === undefined) {
      throw new Error("Feedback is required to generate the next guess. Please provide green and yellow dot counts.");
    }

    const { green, yellow } = feedback;
    if (green < 0 || yellow < 0 || green + yellow > this.sequenceLength) {
      throw new Error("Invalid feedback: Green and Yellow dots must be non-negative and their sum cannot exceed 4.");
    }

    // Use currentGuess if provided, otherwise use a default initial guess
    const effectiveGuess = currentGuess || ["r", "b", "w", "p"]; // Default initial guess (red, blue, white, purple)

    console.log("Generating next guess with feedback:", { green, yellow }, "using guess:", effectiveGuess);
    this.updateState(effectiveGuess, feedback);

    // Filter possible sequences based on feedback, ensuring at least one candidate remains
    let candidates = [...this.possibleSequences];
    for (const entry of this.history) {
      candidates = candidates.filter(seq => {
        const { green: evalGreen, yellow: evalYellow } = this.evaluateGuess(entry.guess, seq);
        return evalGreen === entry.feedback.green && evalYellow === entry.feedback.yellow;
      });
    }

    if (candidates.length === 0) {
      // Before throwing an error, check if the feedback could indicate a valid sequence
      const availableColors = this.colorIds.filter(color => !this.eliminatedColors.has(color));
      if (availableColors.length === 0) {
        throw new Error("All colors have been eliminated—there may be an error in the feedback or logic. Please verify inputs.");
      }
      // Try to recover by resetting eliminations if feedback suggests a valid sequence
      this.eliminatedColors.clear();
      candidates = [...this.possibleSequences]; // Reset candidates to all possible sequences
      console.warn("Recovered from no valid sequences by resetting eliminated colors.");
    }

    // Find the guess that maximizes information gain (minimizes remaining possibilities)
    let bestGuess = null;
    let minRemaining = Infinity;
    for (const candidate of candidates) {
      let remaining = 0;
      for (const seq of this.possibleSequences) {
        const { green: g, yellow: y } = this.evaluateGuess(candidate, seq);
        if (this.history.every(entry => {
          const { green: eg, yellow: ey } = this.evaluateGuess(entry.guess, seq);
          return eg === entry.feedback.green && ey === entry.feedback.yellow;
        }) && (g !== this.sequenceLength || y !== 0)) {
          remaining++;
        }
      }
      if (remaining < minRemaining) {
        minRemaining = remaining;
        bestGuess = candidate;
      }
    }

    if (!bestGuess) {
      throw new Error("Could not determine an optimal next guess—please verify feedback and history.");
    }

    console.log("Generated new guess:", bestGuess);
    return bestGuess;
  }

  // Update state based on feedback, handling the first guess differently and preventing duplicates
  updateState(guess, feedback) {
    if (!guess || !Array.isArray(guess)) {
      throw new Error("Invalid guess provided—guess must be a non-empty array of colors.");
    }

    const { green, yellow } = feedback;

    // Check for duplicate guesses in history before adding
    const isDuplicate = this.history.some(entry => this.arrayEquals(entry.guess, guess) && 
      entry.feedback.green === green && entry.feedback.yellow === yellow);
    if (isDuplicate) {
      console.warn("Attempted to add duplicate guess to history:", guess, "with feedback:", feedback);
      return; // Prevent adding duplicates
    }

    // Update eliminated colors dynamically based on feedback and history, but skip elimination for the first guess
    if (this.isFirstGuess) {
      this.isFirstGuess = false; // Mark as no longer the first guess
    } else if (green === 0 && yellow === 0) {
      // If no green or yellow, eliminate all colors in the guess, but only if they haven't appeared as yellow elsewhere
      const hasYellowHistory = this.history.some(entry => entry.feedback.yellow > 0 && entry.guess.includes(guess[0]));
      if (!hasYellowHistory) {
        guess.forEach(color => this.eliminatedColors.add(color));
      } else {
        console.warn("Not eliminating colors due to prior yellow feedback:", guess);
      }
    } else if (yellow === 4) {
      // For 4 yellow, eliminate all colors not in the guess (all colors must be present but misplaced)
      const guessColors = new Set(guess);
      this.colorIds.forEach(color => {
        if (!guessColors.has(color)) this.eliminatedColors.add(color);
      });
    } else if (green === 0) {
      // Eliminate colors that have appeared in all positions with 0 green feedback, but check history for yellow
      const colorFrequency = {};
      this.history.forEach(entry => {
        if (entry.feedback.green === 0 && entry.feedback.yellow === 0) {
          entry.guess.forEach(color => {
            colorFrequency[color] = (colorFrequency[color] || 0) + 1;
          });
        }
      });
      Object.entries(colorFrequency).forEach(([color, count]) => {
        if (count >= this.sequenceLength) this.eliminatedColors.add(color);
      });
    }

    console.log("Updating state with guess:", guess, "and feedback:", feedback);

    // Update color positions and exclusions
    guess.forEach((color, pos) => {
      if (!this.history.some(entry => entry.feedback.green > 0 && entry.guess[pos] === color)) {
        this.positionExclusions[color] = [...(this.positionExclusions[color] || []), pos];
      }
      if (green >= 3 && pos < green) {
        this.colorPositions[color] = [...(this.colorPositions[color] || []), pos];
      }
    });

    // Store the guess and feedback in history
    this.history.unshift({ guess: [...guess], feedback });
    console.log("History updated:", this.history);
  }

  // Utility to compare arrays (moved here for internal use)
  arrayEquals(a, b) {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  // Reset the solver state
  reset() {
    this.history = [];
    this.eliminatedColors.clear();
    this.colorPositions = {};
    this.positionExclusions = {};
    this.isFirstGuess = true; // Reset the first guess flag
  }

  // Getter for color IDs (for UI mapping if needed)
  getColorIds() {
    return this.colorIds;
  }
}

export default SpotsSolver;