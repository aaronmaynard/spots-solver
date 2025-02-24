import { useState } from "react";

const colors = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚪"]; // Available colors for Spots.wtf

function SpotsSolver() {
  const [guess, setGuess] = useState(["🔴", "🔵", "🟢", "🟡"]); // Initial guess
  const [history, setHistory] = useState([]); // Guess history with feedback
  const [greenInput, setGreenInput] = useState(""); // Green dots input
  const [yellowInput, setYellowInput] = useState(""); // Yellow dots input
  const [eliminatedColors, setEliminatedColors] = useState([]); // Colors known to be absent
  const [colorPositions, setColorPositions] = useState({}); // Track where each color has been tried
  const [positionExclusions, setPositionExclusions] = useState({}); // Track colors excluded from positions

  // Generate a new guess based on feedback, eliminated colors, color positions, and position exclusions
  const generateNextGuess = (currentGuess, latestFeedback, currentEliminated, currentPositions, currentExclusions) => {
    if (!latestFeedback) return [...currentGuess]; // First guess, return a new array

    const { green, yellow } = latestFeedback;
    let newGuess = Array(4).fill(null);
    let availableColors = [...colors.filter(c => !currentEliminated.includes(c))]; // Use let and spread for mutation

    console.log("Generating next guess...");
    console.log("Current Guess:", currentGuess);
    console.log("Feedback:", { green, yellow });
    console.log("Eliminated Colors:", currentEliminated);
    console.log("Color Positions:", currentPositions);
    console.log("Position Exclusions:", currentExclusions);
    console.log("Available Colors:", availableColors);

    // Step 1: Lock in green positions (correct color, correct position) only if confirmed (e.g., 3+ green)
    for (let i = 0; i < green; i++) {
      if (green >= 3) { // Only lock if strong evidence (3 or 4 green)
        newGuess[i] = currentGuess[i];
        availableColors = availableColors.filter(c => c !== currentGuess[i]); // Filter instead of splice
        // Update color positions for correct placements
        setColorPositions(prev => ({
          ...prev,
          [currentGuess[i]]: [...(prev[currentGuess[i]] || []), i]
        }));
        // Clear any exclusions for this color in this position
        setPositionExclusions(prev => {
          const updated = { ...prev };
          if (updated[currentGuess[i]]) {
            updated[currentGuess[i]] = updated[currentGuess[i]].filter(pos => pos !== i);
            if (updated[currentGuess[i]].length === 0) delete updated[currentGuess[i]];
          }
          return updated;
        });
      }
    }

    // Step 2: Handle yellow (correct color, wrong position) and update color positions/exclusions
    if (yellow > 0) {
      let yellowColors = [...currentGuess.filter(c => availableColors.includes(c))]; // Use let and spread

      if (yellow === 4) {
        // Special case: 4 yellow means all colors in the guess are in the solution but misplaced
        const validColors = ["🟣", "⚪"]; // After eliminating red, blue, green, yellow, only white and purple remain
        const permutations = generatePermutations(validColors, 4);
        for (const perm of permutations) {
          if (!arrayEquals(perm, currentGuess) && !history.some(entry => arrayEquals(entry.guess, perm))) {
            let tempGreen = 0, tempYellow = 0;
            for (let i = 0; i < 4; i++) {
              if (perm[i] === currentGuess[i]) tempGreen++;
              if (currentGuess.includes(perm[i])) tempYellow++;
            }
            tempYellow -= tempGreen; // Adjust for overlaps
            if (tempGreen === 0 && tempYellow === 4) {
              newGuess = [...perm]; // Use spread for a new array
              break;
            }
          }
        }
        console.log("4 Yellow detected, permuting positions:", newGuess);
      } else {
        // General case for yellow: move colors to new positions, update exclusions
        let placedYellows = 0;
        for (let i = 0; i < 4 && placedYellows < yellow; i++) {
          if (!newGuess[i] && yellowColors.length > 0) {
            const candidateColor = yellowColors[Math.floor(Math.random() * yellowColors.length)];
            const originalPos = currentGuess.indexOf(candidateColor);
            if (originalPos !== i && !newGuess.includes(candidateColor)) {
              newGuess[i] = candidateColor;
              availableColors = availableColors.filter(c => c !== candidateColor); // Filter instead of splice
              yellowColors = yellowColors.filter(c => c !== candidateColor); // Filter instead of splice
              placedYellows++;
              // Update color positions for this color
              setColorPositions(prev => ({
                ...prev,
                [candidateColor]: [...(prev[candidateColor] || []), i]
              }));
              // Update position exclusions for colors not in correct positions
              setPositionExclusions(prev => {
                const updated = { ...prev };
                currentGuess.forEach((color, pos) => {
                  if (color !== candidateColor && availableColors.includes(color) && pos !== originalPos) {
                    updated[color] = [...(updated[color] || []), pos];
                  }
                });
                return updated;
              });
            }
          }
        }
      }
    }

    // Step 3: Fill remaining positions, respecting exclusions and prioritizing remaining colors
    const bestGuess = findBestGuess(history);
    for (let i = 0; i < 4; i++) {
      if (!newGuess[i]) {
        if (availableColors.length === 0) {
          console.error("No available colors left after elimination!");
          const fallbackColors = ["🟣", "⚪"]; // Fallback to remaining colors (white, purple)
          if (fallbackColors.length === 0) {
            console.error("All colors eliminated—resetting to default.");
            return ["⚪", "⚪", "🟣", "🟣"]; // Fallback to the known solution (white, white, purple, purple)
          }
          // Repeat fallback colors to fill 4 positions
          while (fallbackColors.length < 4) fallbackColors.push(...fallbackColors);
          fallbackColors.length = 4;
          const randomIndex = Math.floor(Math.random() * 4);
          newGuess[i] = fallbackColors[randomIndex];
        } else {
          let colorToUse = null;
          if (bestGuess) {
            const bestColors = bestGuess.guess.filter(c => 
              availableColors.includes(c) && 
              (!currentExclusions[c] || !currentExclusions[c].includes(i))
            );
            if (bestColors.length > 0) {
              colorToUse = bestColors[Math.floor(Math.random() * bestColors.length)];
            }
          }
          if (!colorToUse) {
            const validColors = availableColors.filter(c => !currentExclusions[c]?.includes(i));
            if (validColors.length > 0) {
              const randomIndex = Math.floor(Math.random() * validColors.length);
              colorToUse = validColors[randomIndex];
            } else {
              const randomIndex = Math.floor(Math.random() * availableColors.length);
              colorToUse = availableColors[randomIndex];
            }
          }
          newGuess[i] = colorToUse;
          availableColors = availableColors.filter(c => c !== colorToUse); // Filter instead of splice
          // Update color positions
          setColorPositions(prev => ({
            ...prev,
            [colorToUse]: [...(prev[colorToUse] || []), i]
          }));
        }
      }
    }

    // Step 4: Ensure uniqueness from history, respecting exclusions, and using only remaining colors
    let isDuplicate = arrayEquals(newGuess, currentGuess) || 
      history.some(entry => arrayEquals(entry.guess, currentGuess)); // Check against currentGuess
    
    let attempts = 0;
    while (isDuplicate && attempts < 20) {
      console.log("Guess is duplicate, reshuffling...");
      availableColors = ["🟣", "⚪"]; // Reset to only remaining colors (white, purple) after elimination
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
            newGuess = [...perm]; // Use spread for a new array
            break;
          }
        }
      } else {
        for (let i = 0; i < 4 && availableColors.length > 0; i++) {
          if (!newGuess[i] || (currentPositions[newGuess[i]] && !currentPositions[newGuess[i]].includes(i))) {
            const validColors = availableColors.filter(c => !currentExclusions[c]?.includes(i));
            if (validColors.length > 0) {
              const randomIndex = Math.floor(Math.random() * validColors.length);
              newGuess[i] = validColors[randomIndex];
            } else {
              const randomIndex = Math.floor(Math.random() * availableColors.length);
              newGuess[i] = availableColors[randomIndex];
            }
            availableColors = availableColors.filter(c => c !== newGuess[i]); // Filter instead of splice
            setColorPositions(prev => ({
              ...prev,
              [newGuess[i]]: [...(prev[newGuess[i]] || []), i]
            }));
          }
        }
      }
      isDuplicate = arrayEquals(newGuess, currentGuess) || 
        history.some(entry => arrayEquals(entry.guess, newGuess));
      attempts++;
    }

    if (isDuplicate) {
      console.warn("Couldn’t find unique guess after 20 attempts, forcing change.");
      availableColors = ["🟣", "⚪"]; // Force use of only white and purple
      const permutations = generatePermutations(availableColors, 4);
      for (const perm of permutations) {
        if (!arrayEquals(perm, currentGuess) && !history.some(entry => arrayEquals(entry.guess, perm))) {
          newGuess = [...perm]; // Use spread for a new array
          break;
        }
      }
    }

    // Update color positions and exclusions for the final guess
    newGuess.forEach((color, i) => {
      setColorPositions(prev => ({
        ...prev,
        [color]: [...(prev[color] || []), i]
      }));
      // Update exclusions based on no green feedback in history for this color/position
      if (!history.some(entry => entry.feedback.green > 0 && entry.guess[i] === color)) {
        setPositionExclusions(prev => ({
          ...prev,
          [color]: [...(prev[color] || []), i]
        }));
      }
    });

    // Eliminate colors not in solution after any 4 yellow feedback
    if (history.some(entry => entry.feedback.yellow === 4)) {
      const solutionColors = ["🟣", "⚪"]; // After eliminating red, blue, green, yellow, only white and purple remain
      setEliminatedColors(prev => [...new Set([...prev, ...colors.filter(c => !solutionColors.includes(c))])]);
    }

    // Eliminate colors that have appeared in all positions with 0 green feedback
    const colorFrequency = {};
    history.forEach(entry => {
      if (entry.feedback.green === 0) {
        entry.guess.forEach(color => {
          colorFrequency[color] = (colorFrequency[color] || 0) + 1;
        });
      }
    });
    Object.entries(colorFrequency).forEach(([color, count]) => {
      if (count >= 4 && !newGuess.includes(color)) { // If a color has been in all 4 positions with 0 green
        setEliminatedColors(prev => [...new Set([...prev, color])]);
      }
    });

    console.log("New Guess:", newGuess);
    return newGuess;
  };

  // Find the best guess (highest green, most recent if tied)
  const findBestGuess = (history) => {
    if (!history.length) return null;
    return history.reduce((best, current) => {
      const bestTotal = best.feedback.green || 0;
      const currentTotal = current.feedback.green || 0;
      return currentTotal > bestTotal ? current : (currentTotal === bestTotal ? current : best);
    });
  };

  // Generate all permutations of an array
  const generatePermutations = (arr, length) => {
    if (length === 1) return arr.map(item => [item]);

    const perms = [];
    for (let i = 0; i < arr.length; i++) {
      const remaining = [...arr.filter((_, idx) => idx !== i)]; // Use spread for a new array
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

    // Step 1: Update eliminated colors and position exclusions based on feedback
    let newEliminated = [...eliminatedColors];
    let newExclusions = { ...positionExclusions };

    if (green === 0 && yellow === 0) {
      newEliminated = [...new Set([...newEliminated, ...guess])];
    } else if (yellow === 0 && green < 4) {
      const bestGuess = findBestGuess(history);
      if (bestGuess) {
        newEliminated = [...new Set([...newEliminated, ...guess.filter(c => !bestGuess.guess.includes(c))])];
      }
      // Eliminate colors that have appeared in all positions with 0 green feedback
      const colorFrequency = {};
      history.forEach(entry => {
        if (entry.feedback.green === 0) {
          entry.guess.forEach(color => {
            colorFrequency[color] = (colorFrequency[color] || 0) + 1;
          });
        }
      });
      Object.entries(colorFrequency).forEach(([color, count]) => {
        if (count >= 4 && !newEliminated.includes(color)) {
          newEliminated = [...new Set([...newEliminated, color])];
        }
      });
    } else if (yellow === 4) {
      // For 4 yellow, eliminate all colors not in the guess
      newEliminated = [...new Set([...newEliminated, ...colors.filter(c => !guess.includes(c))])];
      // Ensure only white and purple are considered after eliminating red, blue, green, yellow
      const solutionColors = ["🟣", "⚪"];
      newEliminated = [...new Set([...newEliminated, ...colors.filter(c => !solutionColors.includes(c))])];
    } else {
      // Update exclusions based on no green feedback in history
      guess.forEach((color, pos) => {
        if (!history.some(entry => entry.feedback.green > 0 && entry.guess[pos] === color)) {
          newExclusions[color] = [...(newExclusions[color] || []), pos];
        }
      });
      // For 1–3 yellow, track potential positions but don’t lock unless strong green evidence
      if (green < 3) {
        guess.forEach((color, pos) => {
          if (!history.some(entry => entry.feedback.green > 0 && entry.guess[pos] === color)) {
            newExclusions[color] = [...(newExclusions[color] || []), pos];
          }
        });
      }
    }

    // Step 2: Update color positions based on feedback (only lock if 3+ green)
    let newPositions = { ...colorPositions };
    const availableColors = colors.filter(c => !newEliminated.includes(c));
    if (green >= 3) {
      for (let i = 0; i < green; i++) {
        newPositions[guess[i]] = [...(newPositions[guess[i]] || []), i];
      }
    } else {
      // For 1–2 green, track but don’t lock—use for prioritization
      for (let i = 0; i < green; i++) {
        newPositions[guess[i]] = [...(newPositions[guess[i]] || []), i];
      }
    }
    for (let i = 0; i < yellow; i++) {
      const color = guess.find(c => availableColors.includes(c) && !newPositions[c]?.includes(i));
      if (color) newPositions[color] = [...(newPositions[color] || []), i];
    }

    // Step 3: Add current guess and feedback to history (newest at top)
    const newHistory = [{ guess: [...guess], feedback: { green, yellow } }, ...history];

    // Step 4: Generate next guess with updated data
    const nextGuess = generateNextGuess(guess, { green, yellow }, newEliminated, newPositions, newExclusions);

    // Step 5: Update state
    setEliminatedColors(newEliminated);
    setColorPositions(newPositions);
    setPositionExclusions(newExclusions);
    setHistory(newHistory);
    setGuess([...nextGuess]); // Use spread for a new array

    // Step 6: Reset inputs
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
        <label style={{ marginLeft: "10px", marginRight: "10px" }}>Yellow Dots (wrong position): </label>
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

      <div style={{ marginTop: "15px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Best Guess So Far</h2>
        {findBestGuess(history) ? (
          <p>{findBestGuess(history).guess.join(" ")} - {findBestGuess(history).feedback.green} 🟢, {findBestGuess(history).feedback.yellow} 🟡</p>
        ) : (
          <p>No guesses yet.</p>
        )}
      </div>

      <div style={{ marginTop: "25px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Guess History</h2>
        {history.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          history.map((entry, index) => (
            <p key={index} style={{ margin: "5px 0" }}>
              Guess {history.length - index}: {entry.guess.join(" ")} - {entry.feedback.green} 🟢, {entry.feedback.yellow} 🟡
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