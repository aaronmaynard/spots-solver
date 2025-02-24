
# Spots Solver

## Overview

Spots Solver is a React-based web application designed to solve the Spots.wtf puzzle game, a color-based guessing game similar to Mastermind. The solver uses a constraint-based algorithm to generate optimal guesses, process feedback (green dots for correct positions, yellow dots for correct colors in wrong positions), and eliminate invalid colors until it identifies the hidden sequence of 4 colored dots. The project is built with React for the user interface and includes a modular JavaScript solver logic for efficient game-solving.

This repository contains the source code for the Spots Solver, allowing users to interact with the solver, input feedback, and track guess history in real-time.

## Features

- **Interactive UI**: A clean, dark-themed interface for entering feedback and viewing guesses.
- **Constraint-Based Solving**: Uses a deterministic algorithm to minimize guesses and maximize information gain.
- **Feedback Processing**: Handles green and yellow dot feedback to refine guesses dynamically.
- **History Tracking**: Displays the current guess, best guess so far, guess history, and eliminated colors.
- **Error Handling**: Validates user input and provides alerts for errors or invalid feedback.
- **Rate Limiting**: Prevents duplicate submissions with a 2-second throttle to ensure reliable operation.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager, typically included with Node.js)
- **Git** (optional, for cloning the repository)

## Installation

Follow these steps to set up and run the Spots Solver locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/spots-solver.git
   cd spots-solver
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Application**:
   ```bash
   npm start
   ```

   This will launch the application in development mode. Open your browser to `http://localhost:3000` to use the solver.

## Usage

1. **Start the Solver**:
   - Upon loading, the solver displays an initial guess (e.g., 🔴 🔵 ⚪ 🟣).
   
2. **Enter Feedback**:
   - Use the input fields to enter the number of green dots (correct color in correct position) and yellow dots (correct color in wrong position) for the current guess.
   - Click "Submit Feedback" to process the feedback and generate the next guess.

3. **Track Progress**:
   - View the "Current Guess," "Best Guess So Far," "Guess History," and "Eliminated Colors" sections to monitor the solver’s progress.
   - The solver eliminates colors and refines guesses based on your feedback until it solves the puzzle (4 green dots, 0 yellow dots).

4. **Example**:
   - If the hidden sequence is ⚪ ⚪ 🟢 🟢:
     - Initial guess: 🔴 🔵 ⚪ 🟣 → Submit `0 🟢, 0 🟡` to eliminate red, blue, purple, and possibly white.
     - Next guess: 🟢 🟡 ⚪ 🟣 → Submit `0 🟢, 2 🟡` (green and yellow present but misplaced).
     - Next guess: ⚪ ⚪ 🟢 🟢 → Submit `4 🟢, 0 🟡` to solve the puzzle.

## Contributing

We welcome contributions to improve Spots Solver! Here’s how you can contribute:

1. **Fork the Repository**:
   - Create your own fork of this repository on GitHub.

2. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**:
   - Implement your changes, ensuring they align with the project’s coding style and functionality.

4. **Test Locally**:
   - Follow the installation steps above and test your changes using `npm start`.

5. **Submit a Pull Request**:
   - Push your changes to your fork and submit a pull request to the main repository.
   - Provide a clear description of your changes and any related issues.

6. **Code Standards**:
   - Use consistent indentation (2 spaces), follow JavaScript and React best practices, and include comments for complex logic.

## License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE). See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the Spots.wtf game, a color-based puzzle challenge.
- Built using React, a JavaScript library for building user interfaces.
- Thanks to the open-source community for tools like Node.js, npm, and Git.
