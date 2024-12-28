const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const tf = require("@tensorflow/tfjs");
const { createCanvas, Image } = require("canvas");
const rateLimit = require("express-rate-limit");

// Rate limiting configuration
const trainLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 10 training requests per minute
  message:
    "Too many training requests from this IP, please try again after a minute",
});

const predictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 prediction requests per minute
  message:
    "Too many prediction requests from this IP, please try again after a minute",
});

// Training data storage
const trainingData = Array.from({ length: 10 }, () => []);
const SAMPLES_PER_DIGIT = 30;
const MAX_TRAINING_PER_DIGIT = 200;

// Task queue implementation
class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async addTask(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

const taskQueue = new TaskQueue();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["https://livestream-ai-web.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));

// Initialize the model
let model;

async function createModel() {
  model = tf.sequential();

  // Add layers (CNN architecture for MNIST-style digit recognition)
  model.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      filters: 32,
      kernelSize: 3,
      activation: "relu",
    })
  );

  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
    })
  );

  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 10, activation: "softmax" }));

  // Compile the model
  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// Helper function to process image data
async function processImageData(base64Image) {
  // Remove the data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = createCanvas(28, 28);
      const ctx = canvas.getContext("2d");

      // Draw and resize the image
      ctx.drawImage(img, 0, 0, 28, 28);

      // Get the pixel data
      const imageData = ctx.getImageData(0, 0, 28, 28);

      // Convert to grayscale and normalize
      const grayscale = new Float32Array(28 * 28);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const avg =
          (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) /
          3;
        grayscale[i / 4] = avg / 255.0;
      }

      // Create tensor and reshape
      const tensor = tf.tensor(grayscale, [1, 28, 28, 1]);
      resolve(tensor);
    };

    img.onerror = (err) => reject(err);

    // Load the image from base64
    img.src = "data:image/png;base64," + base64Data;
  });
}

// Helper function to check if we have enough samples
function hasEnoughSamples() {
  return trainingData.every((samples) => samples.length >= SAMPLES_PER_DIGIT);
}

// Training endpoint
app.post("/train", trainLimiter, async (req, res) => {
  try {
    const { digit, imageData } = req.body;

    // Check if we've reached the training limit for this digit
    if (trainingData[digit].length >= MAX_TRAINING_PER_DIGIT) {
      return res.status(429).json({
        success: false,
        message: `Training limit reached for digit ${digit}. Maximum ${MAX_TRAINING_PER_DIGIT} samples allowed.`,
      });
    }

    // Process and store the image data
    const tensor = await processImageData(imageData);
    trainingData[digit].push(tensor);

    const currentCount = trainingData[digit].length;
    const remainingSamples = SAMPLES_PER_DIGIT - currentCount;

    res.json({
      success: true,
      message: `Sample stored for digit ${digit}. Need ${remainingSamples} more samples for this digit.`,
      currentCount,
      remainingSamples,
    });
  } catch (error) {
    console.error("Error storing training data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get training status endpoint
app.get("/training-status", async (req, res) => {
  const status = trainingData.map((samples, digit) => ({
    digit,
    currentCount: samples.length,
    remainingSamples: SAMPLES_PER_DIGIT - samples.length,
  }));

  res.json({
    status,
    readyForTraining: hasEnoughSamples(),
  });
});

// Batch training endpoint
app.post("/train-batch", async (req, res) => {
  try {
    if (!hasEnoughSamples()) {
      return res.status(400).json({
        success: false,
        message: "Not enough samples collected for all digits",
      });
    }

    await taskQueue.addTask(async () => {
      if (!model) {
        model = await createModel();
      }

      // Prepare batch training data
      const batchX = [];
      const batchY = [];

      trainingData.forEach((samples, digit) => {
        samples.slice(0, SAMPLES_PER_DIGIT).forEach((tensor) => {
          batchX.push(tensor.arraySync()[0]); // Convert tensor to array
        });

        // Create one-hot encoded labels
        const labels = new Array(SAMPLES_PER_DIGIT).fill(0);
        labels.forEach((_, i) => {
          const label = new Array(10).fill(0);
          label[digit] = 1;
          batchY.push(label);
        });
      });

      // Convert to tensors
      const xTensor = tf.tensor4d(batchX, [batchX.length, 28, 28, 1]);
      const yTensor = tf.tensor2d(batchY);

      // Train the model
      await model.fit(xTensor, yTensor, {
        epochs: 10,
        batchSize: 32,
        shuffle: true,
      });

      // Cleanup
      xTensor.dispose();
      yTensor.dispose();
      trainingData.forEach((samples) => {
        samples.forEach((tensor) => tensor.dispose());
      });

      // Clear training data
      trainingData.forEach((_, i) => (trainingData[i] = []));

      console.log("Batch training completed");
    });

    res.json({ success: true, message: "Batch training started" });
  } catch (error) {
    console.error("Batch training error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prediction endpoint
app.post("/guess", predictLimiter, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!model) {
      throw new Error("Model not trained yet");
    }

    // Process image data
    const tensor = await processImageData(imageData);

    // Make prediction
    const prediction = await model.predict(tensor).data();

    // Get the digit with highest confidence
    const digit = prediction.indexOf(Math.max(...prediction));
    const confidence = prediction[digit];

    console.log("Prediction:", digit, "Confidence:", confidence);

    // Cleanup
    tensor.dispose();

    res.json({ prediction: digit, confidence });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  createModel().then(() => {
    console.log("TensorFlow model initialized");
  });
});
