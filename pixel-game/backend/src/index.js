const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: "*", // Allow any origin
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

// Apply middleware once
app.use(cors(corsOptions));
app.use(express.json());

// Canvas configuration
const CANVAS_WIDTH = 50;
const CANVAS_HEIGHT = 50;
const COOLDOWN_PERIOD = 30 * 1000; // 30 seconds in milliseconds

// Initialize empty canvas
const canvas = Array(CANVAS_HEIGHT)
  .fill()
  .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"));

// Store last pixel placement time for each IP
const userLastPixel = new Map();

// Get current canvas state
app.get("/api/canvas", (req, res) => {
  // Transform 2D array into array of pixels
  const pixels = [];
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      if (canvas[y][x] !== "#FFFFFF") {
        // Only include non-white pixels
        pixels.push({
          x,
          y,
          color: canvas[y][x],
          timestamp: Date.now(), // We don't track timestamps per pixel, so use current time
        });
      }
    }
  }
  res.json({
    pixels,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });
});

// Place a pixel
app.post("/api/pixel", (req, res) => {
  const { x, y, color } = req.body;
  const ip = req.ip;

  console.log(
    `Received pixel placement request: x=${x}, y=${y}, color=${color}`
  );

  // Validate coordinates
  if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
    console.log("Invalid coordinates");
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  // Validate color (should be a valid hex color)
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    console.log("Invalid color format");
    return res.status(400).json({ error: "Invalid color format" });
  }

  // Check cooldown
  const lastPlacement = userLastPixel.get(ip);
  const now = Date.now();
  if (lastPlacement && now - lastPlacement < COOLDOWN_PERIOD) {
    const remainingTime = Math.ceil(
      (COOLDOWN_PERIOD - (now - lastPlacement)) / 1000
    );
    console.log(`Cooldown active, ${remainingTime} seconds remaining`);
    return res.status(429).json({
      error: `Please wait ${remainingTime} seconds before placing another pixel`,
    });
  }

  // Update canvas
  canvas[y][x] = color;
  userLastPixel.set(ip, now);
  console.log(`Pixel placed successfully at (${x}, ${y}) with color ${color}`);
  console.log(`Canvas state at position: ${canvas[y][x]}`);

  res.json({ success: true });
});

// Start server
app.listen(port, () => {
  console.log(`Pixel game server running on port ${port}`);
});
