const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const tf = require("@tensorflow/tfjs");
const { createCanvas, Image } = require("canvas");
const rateLimit = require("express-rate-limit");
const mnist = require("mnist");

// Rate limiting configuration
const predictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 prediction requests per minute
  message:
    "Too many prediction requests from this IP, please try again after a minute",
});

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

  // Simple but effective CNN architecture
  model.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      filters: 16,
      kernelSize: 3,
      activation: "relu",
    })
  );

  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 4, activation: "softmax" }));

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.001), // Explicit learning rate
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// Train model with MNIST data
async function trainWithMNIST() {
  console.log("Loading MNIST dataset...");
  const set = mnist.set(8000, 1000); // Increased dataset size

  // Group samples by digit
  const digitGroups = [[], [], [], []];
  set.training.forEach((sample) => {
    const digit = sample.output.indexOf(1);
    if (digit >= 0 && digit <= 3) {
      digitGroups[digit].push(sample);
    }
  });

  // Take equal samples from each digit (500 samples per digit)
  const samplesPerDigit = 500;
  const balancedTraining = [];
  digitGroups.forEach((group, digit) => {
    const samples = group.slice(0, samplesPerDigit);
    balancedTraining.push(...samples);
    console.log(`Using ${samples.length} samples for digit ${digit}`);
  });

  // Shuffle the balanced dataset
  for (let i = balancedTraining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balancedTraining[i], balancedTraining[j]] = [
      balancedTraining[j],
      balancedTraining[i],
    ];
  }

  console.log(
    `Training with ${balancedTraining.length} total samples (balanced across digits 0-3)...`
  );

  // Reshape the input data into proper 4D format [samples][width][height][channels]
  const reshapedInputs = [];
  balancedTraining.forEach((sample) => {
    const imageArray = [];
    for (let i = 0; i < 28; i++) {
      const row = [];
      for (let j = 0; j < 28; j++) {
        row.push([sample.input[i * 28 + j]]);
      }
      imageArray.push(row);
    }
    reshapedInputs.push(imageArray);
  });

  // Convert training data to tensors
  const trainImages = tf.tensor4d(reshapedInputs);
  const trainLabels = tf.tensor2d(
    balancedTraining.map((sample) => sample.output.slice(0, 4)),
    [balancedTraining.length, 4]
  );

  console.log("Training model with MNIST data (digits 0-3 only)...");
  await model.fit(trainImages, trainLabels, {
    epochs: 12,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochBegin: (epoch) => {
        console.log(`\nStarting Epoch ${epoch + 1} of 12...`);
      },
      onBatchEnd: (batch, logs) => {
        if (batch % 5 === 0) {
          // Reduced logging frequency
          process.stdout.write(
            `Batch ${batch}: loss = ${logs.loss.toFixed(4)} `
          );
        }
      },
      onEpochEnd: (epoch, logs) => {
        console.log(`\nEpoch ${epoch + 1} Complete:`);
        console.log(`  Loss: ${logs.loss.toFixed(4)}`);
        console.log(`  Accuracy: ${logs.acc.toFixed(4)}`);
        console.log(`  Validation Loss: ${logs.val_loss.toFixed(4)}`);
        console.log(`  Validation Accuracy: ${logs.val_acc.toFixed(4)}`);
      },
    },
  });

  // Clean up tensors
  trainImages.dispose();
  trainLabels.dispose();

  console.log("MNIST training completed!");
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

      // Clear the canvas to white first
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 28, 28);

      // Draw and resize the image
      ctx.drawImage(img, 0, 0, 28, 28);

      // Get the pixel data
      const imageData = ctx.getImageData(0, 0, 28, 28);

      // Convert to grayscale and normalize
      const grayscale = new Float32Array(28 * 28);

      // Find the min and max values for better thresholding
      let min = 255;
      let max = 0;
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          const i = (y * 28 + x) * 4;
          const avg =
            (imageData.data[i] +
              imageData.data[i + 1] +
              imageData.data[i + 2]) /
            3;
          min = Math.min(min, avg);
          max = Math.max(max, avg);
        }
      }

      // Calculate adaptive threshold
      const threshold = (min + max) / 2;
      console.log(
        `Image stats - Min: ${min}, Max: ${max}, Threshold: ${threshold}`
      );

      // Debug visualization string
      let visualizationStr = "\nInput Image (28x28):\n";
      let rawValuesStr = "\nRaw Values (28x28):\n";

      for (let y = 0; y < 28; y++) {
        let row = "";
        let rawRow = "";
        for (let x = 0; x < 28; x++) {
          const i = (y * 28 + x) * 4;
          const avg =
            (imageData.data[i] +
              imageData.data[i + 1] +
              imageData.data[i + 2]) /
            3;

          // Normalize for the model (invert the values since MNIST expects white on black)
          grayscale[y * 28 + x] = 1.0 - avg / 255.0;

          // Add to visualization (1 for dark pixels, 0 for light)
          row += avg < threshold ? "1" : "0";
          // Add raw value visualization
          rawRow += avg < 50 ? "#" : avg < 128 ? "+" : avg < 200 ? "." : " ";
        }
        visualizationStr += row + "\n";
        rawValuesStr += rawRow + "\n";
      }

      // Log both visualizations
      console.log(visualizationStr);
      console.log(rawValuesStr);

      // Create tensor and reshape
      const tensor = tf.tensor(grayscale, [1, 28, 28, 1]);
      resolve(tensor);
    };

    img.onerror = (err) => reject(err);

    // Load the image from base64
    img.src = "data:image/png;base64," + base64Data;
  });
}

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
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  try {
    model = await createModel();
    console.log("TensorFlow model initialized");
    await trainWithMNIST();
    console.log("Model is ready for predictions!");
  } catch (error) {
    console.error("Error initializing model:", error);
  }
});
