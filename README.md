# Fwoggy Flick

## Project Overview

Fwoggy Flick is a 2D arcade-style puzzle game built entirely from scratch using vanilla JavaScript and HTML5 Canvas. The primary objective of this project is to serve as an educational implementation of core game development concepts without reliance on third-party game engines (such as Unity, Phaser, or Godot).

The project focuses heavily on the implementation of custom systems, specifically rigid body physics, collision detection algorithms, and 2D rendering pipelines.

## Technical Goals

The architecture of this application demonstrates the following computer graphics and game development principles:

*   **Game Loop Implementation:** A manual requestAnimationFrame loop handling variable interactions and fixed-step physics updates.
*   **Collision Detection:**
    *   **AABB (Axis-Aligned Bounding Box):** Used for broad-phase detection of standard grid tiles.
    *   **SAT (Separating Axis Theorem):** Implemented for precise detection between rotated geometry (such as the player's rotating tongue mechanism and angled projectiles).
*   **State Management:** A finite state machine pattern managing complex player states (Idle, Extending, Retracting, Loaded).
*   **Sprite Animation:** Custom spritesheet handling and JSON atlas parsing for frame-by-frame animation rendering.
*   **Object Pooling & Grid Systems:** Efficient management of tile entities within a coordinate-based play area.

## Gameplay Mechanics

The user controls a frog positioned at the bottom of the screen. The mechanics revolve around a physics-based "tongue" hookshot:

1.  **Grapple:** The player extends a tongue to grab "Solid" tiles from the grid.
2.  **Retract:** Upon collision, the tongue retracts, pulling the tile to the player's mouth.
3.  **Projectile:** The held tile can be launched back into the grid.
4.  **Destruction:** Projectiles collide with other tiles, clearing the grid.
    *   **Solid Tiles:** Destroyed immediately on impact.
    *   **Hardened Tiles:** require multiple hits and reflect projectiles.

## Installation and Setup

This project requires no build tools or package managers. It runs natively in modern web browsers.

1.  Clone the repository to your local machine.
2.  Navigate to the project directory.
3.  Launch a local development server to handle asset loading (necessary to avoid CORS errors with JSON and Image assets).

    *   **Using Python 3:**
        ```bash
        python -m http.server
        ```
    *   **Using VS Code:**
        Install the "Live Server" extension and click "Go Live".

4.  Navigate to `localhost:8000` (or the port specified by your server) in your browser.

## Controls

*   **Spacebar:** Extend tongue / Shoot projectile / Retract tongue manually.
// Can also add arrow keys for rotation if implemented

## Project Structure

*   `index.html`: Entry point and Canvas container.
*   `src/main.js`: Core game loop, input handling, and initialization.
*   `src/GameObjects.js`: Class definitions for Entities (Frog, Tongue, Tiles).
*   `src/Collision.js`: Static utility class containing the SAT and AABB math libraries.
*   `Sprites/`: Directory containing image assets and texture atlases.

## Credits
https://www.sevenson.com.au/programming/sat/ - A great learning resource for SAT collision logic and math.
https://opengameart.org/content/fwoggy#:~:text=rzabba11.gif%202%20Kb%20%5B110%20download(s)%5D - Placeholder Frog Sprite 

## License

This project is open source and available for educational use.
