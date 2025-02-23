import { useState } from "react";

const colors = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚪"]; // Available colors

function SpotsSolver() {
  const [guess, setGuess] = useState(["🔴", "🔵", "🟢", "🟡"]); // Current guess
  const [history, setHistory] = useState([]); // Guess history with feedback
  const [greenInput, setGreenInput] = useState(""); // Green feedback input
  const [yellowInput, setYellowInput] = useState(""); // Yellow feedback input
  const [eliminatedColors, setEliminatedColors] = useState([]); // Colors known to be absent

  // Generate a new guess based on the latest feedback and eliminated colors
  const generateNextGuess = (currentGuess, latestFeedback, currentEliminated) => {
    if (!latestFeedback) return currentGuess; // First guess stays as is

    const { green, yellow } = latestFeedback;
    let newGuess = Array(4).fill(null);
    let availableColors = colors.filter(c => !currentEliminated.includes(c));

    console.log("Generating next guess...");
    console.log("Current Guess:", currentGuess);
    console.log("Feedback:", { green, yellow });
    console.log("Eliminated Colors:", currentEliminated);
    console.log("Available Colors:", availableColors);

    // Step 1: Lock in green positions (correct color, correct position)
    for (let i = 0; i < green; i++) {
      newGuess[i] = currentGuess[i];
      availableColors = availableColors.filter(c => c !== currentGuess[i]);
    }

    // Step 2: Handle yellow (correct color, wrong position)
    if (yellow > 0) {
      const yellowColors = currentGuess.filter(c => availableColors.includes(c));

      if (yellow === 4) {
        // Special case: 4 yellow means all colors are correct but misplaced
        newGuess = [
          currentGuess[2], // Third position to first
          currentGuess[3], // Fourth to second
          currentGuess[0], // First to third
          currentGuess[1]  // Second to fourth
        ];
        console.log("4 Yellow detected, swapping positions:", newGuess);
      } else {
        // General case for yellow: move colors to new positions
        let placedYellows = 0;
        for (let i = green; i < 4 && placedYellows < yellow; i++) {
          if (!newGuess[i] && yellowColors[placedYellows]) {
            const candidateColor = yellowColors[placedYellows];
            const originalPos = currentGuess.indexOf(candidateColor);
            if (originalPos !== i && !newGuess.includes(candidateColor)) {
              newGuess[i] = candidateColor;
              availableColors = availableColors.filter(c => c !== candidateColor);
              placedYellows++;
            } else {
              yellowColors.splice(placedYellows, 1);
            }
          }
        }
      }
    }

    // Step 3: Fill remaining positions with random available colors or repeat if needed
    for (let i = 0; i < 4; i++) {
      if (!newGuess[i]) {
        if (availableColors.length === 0) {
          console.error("Unexpected: No available colors left after elimination!");
          // Repeat available colors to fill 4 positions
          const fallbackColors = colors.filter(c => !currentEliminated.includes(c));
          if (fallbackColors.length === 0) {
            console.error("All colors eliminated unexpectedly—resetting to default.");
            return ["🟣", "⚪", "🟣", "⚪"]; // Hard fallback to purple and white
          }
          // Repeat the available colors to fill 4 positions
          while (fallbackColors.length < 4) {
            fallbackColors.push(...fallbackColors);
          }
          const randomIndex = Math.floor(Math.random() * 4);
          newGuess[i] = fallbackColors[randomIndex];
        } else {
          const randomIndex = Math.floor(Math.random() * availableColors.length);
          newGuess[i] = availableColors[randomIndex];
          availableColors.splice(randomIndex, 1);
        }
      }
    }

    // Step 4: Ensure uniqueness from history and current guess
    let isDuplicate = arrayEquals(newGuess, currentGuess) || 
      history.some(entry => arrayEquals(entry.guess, newGuess));
    
    let attempts = 0;
    while (isDuplicate && attempts < 20) { // Increased attempts for tighter spaces
      console.log("Guess is duplicate, reshuffling...");
      // Reset availableColors to ensure we have options
      availableColors = colors.filter(c => !currentEliminated.includes(c));
      // Try all possible permutations if only 2 colors remain
      if (availableColors.length === 2) {
        const [color1, color2] = availableColors;
        const permutations = [
          [color1, color1, color2, color2],
          [color1, color2, color1, color2],
          [color1, color2, color2, color1],
          [color2, color1, color1, color2],
          [color2, color1, color2, color1],
          [color2, color2, color1, color1]
        ];
        for (const perm of permutations) {
          if (!arrayEquals(perm, currentGuess) && !history.some(entry => arrayEquals(entry.guess, perm))) {
            newGuess = perm;
            break;
          }
        }
      } else {
        // General case: reshuffle non-green positions
        for (let i = green; i < 4 && availableColors.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableColors.length);
          newGuess[i] = availableColors[randomIndex];
          availableColors.splice(randomIndex, 1);
        }
      }
      isDuplicate = arrayEquals(newGuess, currentGuess) || 
        history.some(entry => arrayEquals(entry.guess, newGuess));
      attempts++;
    }

    if (isDuplicate) {
      console.warn("Couldn’t find a unique guess after 20 attempts, forcing a change.");
      // Force a unique guess by using all permutations of available colors
      availableColors = colors.filter(c => !currentEliminated.includes(c));
      const permutations = generatePermutations(availableColors, 4);
      for (const perm of permutations) {
        if (!arrayEquals(perm, currentGuess) && !history.some(entry => arrayEquals(entry.guess, perm))) {
          newGuess = perm;
          break;
        }
      }
    }

    console.log("New Guess:", newGuess);
    return newGuess;
  };

  // Utility to generate all permutations of an array
  const generatePermutations = (arr, length) => {
    if (length === 1) return arr.map(item => [item]);

    const perms = [];
    for (let i = 0; i < arr.length; i++) {
      const remaining = arr.filter((_, idx) => idx !== i);
      const subPerms = generatePermutations(remaining, length - 1);
      for (const subPerm of subPerms) {
        perms.push([arr[i], ...subPerm]);
      }
    }
    return perms;
  };

  // Handle feedback submission
  const handleSubmit = () => {
    const green = Math.max(0, Math.min(parseInt(greenInput) || 0, 4));
    const yellow = Math.max(0, Math.min(parseInt(yellowInput) || 0, 4 - green));

    if (green === 4) {
      alert("You’ve solved it! The code is: " + guess.join(" "));
      return;
    }

    // Step 1: Update eliminated colors if feedback is 0 green, 0 yellow
    let newEliminated = [...eliminatedColors];
    if (green === 0 && yellow === 0) {
      newEliminated = [...new Set([...newEliminated, ...guess])];
    }

    // Step 2: Add current guess and feedback to history
    const newHistory = [{ guess: [...guess], feedback: { green, yellow } }, ...history];

    // Step 3: Generate next guess with updated eliminated colors
    const nextGuess = generateNextGuess(guess, { green, yellow }, newEliminated);

    // Step 4: Update state
    setEliminatedColors(newEliminated);
    setHistory(newHistory);
    setGuess(nextGuess);

    // Step 5: Reset inputs
    setGreenInput("");
    setYellowInput("");
  };

  // Utility to compare arrays
  const arrayEquals = (a, b) => a.length === b.length && a.every((val, idx) => val === b[idx]);

  return (
    <div style={{ padding: "20px", backgroundColor: "#171717", color: "white", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Spots Solver</h1>
      
      <div style={{ marginTop: "20px" }}>
        <p style={{ fontSize: "18px" }}>
          Current Guess: <strong>{guess.join(" ")}</strong>
        </p>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label style={{ marginRight: "10px" }}>Green Dots (correct position): </label>
        <input
          type="number"
          min="0"
          max="4"
          value={greenInput}
          onChange={(e) => setGreenInput(e.target.value.replace(/[^0-4]/g, ""))}
          style={{
            backgroundColor: "#262626",
            color: "white",
            border: "1px solid #555",
            padding: "5px",
            width: "50px",
          }}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <label style={{ marginRight: "10px" }}>Yellow Dots (wrong position): </label>
        <input
          type="number"
          min="0"
          max="4"
          value={yellowInput}
          onChange={(e) => setYellowInput(e.target.value.replace(/[^0-4]/g, ""))}
          style={{
            backgroundColor: "#262626",
            color: "white",
            border: "1px solid #555",
            padding: "5px",
            width: "50px",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "15px",
          backgroundColor: "#28a745",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Submit Feedback
      </button>

      <div style={{ marginTop: "25px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Guess History</h2>
        {history.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          history.map((entry, index) => (
            <p key={index} style={{ margin: "5px 0" }}>
              Guess {index + 1}: {entry.guess.join(" ")} - {entry.feedback.green} 🟢, {entry.feedback.yellow} 🟡
            </p>
          ))
        )}
      </div>

      <div style={{ marginTop: "15px" }}>
        <p>Eliminated Colors: {eliminatedColors.length > 0 ? eliminatedColors.join(" ") : "None"}</p>
      </div>
    </div>
  );
}

export default SpotsSolver;