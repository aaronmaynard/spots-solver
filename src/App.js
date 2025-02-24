import { useState, useEffect } from "react";
import SpotsSolverLogic from "./SpotsSolverLogic";

function App() {
  const [solver] = useState(() => new SpotsSolverLogic());
  const [guess, setGuess] = useState(["r", "b", "w", "p"]); // Initial guess (red, blue, white, purple)
  const [greenInput, setGreenInput] = useState("");
  const [yellowInput, setYellowInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0); // Track last submission timestamp

  // Map color IDs to emojis for display
  const colorMap = {
    r: "🔴", // Red
    b: "🔵", // Blue
    g: "🟢", // Green
    y: "🟡", // Yellow
    w: "⚪", // White
    p: "🟣", // Purple
  };

  // Convert color IDs to emojis for display
  const displayGuess = guess.map(color => colorMap[color] || color);

  // Find the best guess (highest green dots, most recent if tied)
  const findBestGuess = () => {
    if (!solver.history.length) return null;
    return solver.history.reduce((best, current) => {
      const bestGreen = best.feedback.green || 0;
      const currentGreen = current.feedback.green || 0;
      return currentGreen > bestGreen ? current : (currentGreen === bestGreen ? current : best);
    });
  };

  // No useEffect here—wait for user feedback to start the solver
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default button behavior
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;

    // Throttle submissions to 1 every 2 seconds (2000ms) to catch rapid clicks
    if (timeSinceLastSubmission < 2000) {
      alert("Please wait 2 seconds before submitting again.");
      return;
    }

    if (isSubmitting) {
      console.warn("Submission already in progress—ignoring duplicate click.");
      return; // Prevent multiple submissions while processing
    }

    console.log("Starting submission at:", new Date().toISOString(), "with guess:", guess, "and inputs:", { green: greenInput, yellow: yellowInput });
    setIsSubmitting(true); // Set submitting state to prevent duplicate submissions
    setLastSubmissionTime(now); // Update last submission timestamp

    if (!greenInput || !yellowInput || isNaN(parseInt(greenInput)) || isNaN(parseInt(yellowInput))) {
      alert("Please enter valid numbers (0–4) for both Green Dots and Yellow Dots before submitting feedback.");
      setIsSubmitting(false); // Reset submitting state
      console.log("Submission failed: Invalid input.");
      return;
    }

    const green = Math.max(0, Math.min(parseInt(greenInput), 4));
    const yellow = Math.max(0, Math.min(parseInt(yellowInput), 4));

    if (green + yellow > 4) {
      alert("The sum of Green and Yellow dots cannot exceed 4.");
      setIsSubmitting(false); // Reset submitting state
      console.log("Submission failed: Invalid feedback sum.");
      return;
    }

    if (green === 4) {
      alert("You’ve solved it! The code is: " + displayGuess.join(" "));
      setIsSubmitting(false); // Reset submitting state
      console.log("Submission succeeded: Puzzle solved.");
      return;
    }

    try {
      console.log("Processing guess:", guess, "with feedback:", { green, yellow });
      solver.updateState(guess, { green, yellow });
      const newGuess = solver.generateNextGuess(guess, { green, yellow });
      console.log("New guess generated:", newGuess);
      setGuess(newGuess);
      setGreenInput("");
      setYellowInput("");
      console.log("Submission succeeded: New guess applied.");
    } catch (err) {
      alert(err.message);
      console.error("Submission failed:", err.message);
    } finally {
      setIsSubmitting(false); // Reset submitting state regardless of success or failure
      console.log("Submission process completed at:", new Date().toISOString());
    }
  };

  const arrayEquals = (a, b) => a.length === b.length && a.every((val, idx) => val === b[idx]);

  return (
    <div style={{ padding: "20px", backgroundColor: "#171717", color: "white", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Spots Solver</h1>
      
      <div style={{ marginTop: "20px" }}>
        <p style={{ fontSize: "18px" }}>
          Current Guess: <strong>{displayGuess.join(" ")}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "15px" }}>
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
        <button
          type="submit"
          disabled={isSubmitting} // Disable button during submission
          style={{
            marginTop: "15px",
            backgroundColor: isSubmitting ? "#666" : "#28a745", // Gray out button when disabled
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      <div style={{ marginTop: "15px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Best Guess So Far</h2>
        {findBestGuess() ? (
          <p>{findBestGuess().guess.map(c => colorMap[c]).join(" ")} - {findBestGuess().feedback.green} 🟢, {findBestGuess().feedback.yellow} 🟡</p>
        ) : (
          <p>No guesses yet.</p>
        )}
      </div>

      <div style={{ marginTop: "25px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Guess History</h2>
        {solver.history.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          solver.history.map((entry, index) => (
            <p key={index} style={{ margin: "5px 0" }}>
              Guess {solver.history.length - index}: {entry.guess.map(c => colorMap[c]).join(" ")} - {entry.feedback.green} 🟢, {entry.feedback.yellow} 🟡
            </p>
          ))
        )}
      </div>

      <div style={{ marginTop: "15px" }}>
        <p>Eliminated Colors: {Array.from(solver.eliminatedColors).map(c => colorMap[c]).join(" ") || "None"}</p>
      </div>
    </div>
  );
}

export default App;