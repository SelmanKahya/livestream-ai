const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const tf = require("@tensorflow/tfjs");
const { createCanvas, Image } = require("canvas");

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
app.use(cors());
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

// Training endpoint
app.post("/train", async (req, res) => {
  try {
    const { digit, imageData } = req.body;

    // Add task to queue without waiting for completion
    taskQueue.addTask(async () => {
      try {
        console.log("Training digit:", digit);

        if (!model) {
          model = await createModel();
        }

        // Process image data
        const tensor = await processImageData(imageData);
        const label = tf.oneHot(tf.tensor1d([digit], "int32"), 10);

        // Train the model
        await model.fit(tensor, label, {
          epochs: 1,
          batchSize: 1,
        });

        // Cleanup
        tensor.dispose();
        label.dispose();

        console.log("Training completed for digit:", digit);
      } catch (error) {
        console.error("Training error for digit", digit, ":", error);
      }
    });

    // Return success response after task is queued
    res.json({ success: true, message: "Training task queued" });
  } catch (error) {
    console.error("Error queueing training task:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prediction endpoint
app.post("/guess", async (req, res) => {
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
