# Chess Zoo Web Application

[![Deploy to GitHub Pages](https://github.com/fresh-milkshake/chess-zoo/actions/workflows/deploy.yml/badge.svg)](https://github.com/fresh-milkshake/chess-zoo/actions/workflows/deploy.yml)

A web simulation of the "Chess Zoo" concept, where various chess pieces move around in their enclosures separated by walls, fully inspired by the [xkcd "Chess Zoo"](https://imgs.xkcd.com/comics/chess_zoo.png) comic.

Link to running gh-pages: https://fresh-milkshake.github.io/chess-zoo/

The application includes:

- Movement of chess pieces according to the rules
- Walls and enclosures loaded from a customizable PGN-like format
- Interactive chess board and tools for customizing the zoo
- Visitors who can observe the chess pieces and comment on what they see

## Installation and Running

```bash
npm install
npm start
```

> The simulation will automatically open in your browser at:
> http://localhost:3000

## Technical Details

The application is built using:

- React for the user interface
- Canvas API for rendering the board and pieces
- Custom hooks for state management
- Modular project structure for logic separation

### Main Components

- `ChessZooApp` - Root application component
- `ChessZooBoard` - Chess board component with Canvas
- `ControlPanel` - Control panel with tools
- `useBoardInteractions` - Hook for handling board interactions
- `useChessZooState` - Hook for managing application state

### License

This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.

