# Pixel Game - Collaborative Canvas

A real-time multiplayer pixel art game where users collaborate to create artwork, one pixel at a time.

## Core Features
- Real-time collaborative pixel placement
- 12-color palette selection
- 30-second cooldown between pixel placements per user
- Live canvas updates across all connected users

## Technical Stack

### Frontend (`/web`)
- React
- TypeScript
- Canvas for pixel rendering
- Color picker component
- fetch the map every 5 seconds and re-render

### Backend (`/backend`)
- Node.js
- Express.js
- In-memory canvas state management
- rate limit based on IP

## Data Structure
- Canvas: 2D array representing pixel colors
- Pixel: {x, y, color, timestamp, userId}

## API Endpoints
- `GET /api/canvas` - Get current canvas state
- `POST /api/pixel` - Place a pixel

## Limitations
- One pixel per user every 30 seconds
- Fixed canvas size
- 12 predefined colors
