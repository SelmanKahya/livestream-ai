# Number Recognition AI - Product Requirements Document

## Overview
A web application that allows users to train and test an AI model for handwritten digit recognition (0-9).

## Core Features

### 1. Main Interface
- Two primary buttons: "TRAIN" and "TEST"
- Clean, minimalist design
- Canvas size: 280x280 pixels (standard for digit recognition)

### 2. Training Flow
- Sequential drawing interface for digits 0-9
- Progress indicator showing current digit (e.g., "Draw digit: 3")
- Canvas with drawing capabilities
- Submit button for each digit
- Auto-advance to next digit
- Return to main screen after completing all digits

### 3. Testing Flow
- Single drawing interface
- Canvas with drawing capabilities
- Submit button
- Display prediction result
- Option to return to main screen

## Technical Specifications

### Frontend (React)
- Components:
  - `MainScreen`
  - `DrawingCanvas`
  - `TrainingFlow`
  - `TestingFlow`
  - `PredictionResult`
- Libraries:
  - `react-canvas-draw` for drawing functionality
  - `axios` for API calls

### Backend (Node.js/Express)
- Endpoints:
  1. `POST /train`
     - Input: `{ digit: number, imageData: string }`
     - Response: `{ success: boolean }`
  
  2. `POST /guess`
     - Input: `{ imageData: string }`
     - Response: `{ prediction: number, confidence: number }`

### Image Data Format
- Canvas drawing will be converted to a 28x28 grayscale image
- Image data will be represented as a base64 encoded string:
  1. Get canvas pixel data using `getImageData()`
  2. Convert to grayscale (0-255 values)
  3. Resize to 28x28 pixels (MNIST standard size)
  4. Normalize pixel values to 0-1 range
  5. Convert to base64 string for API transmission
- Example format: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`

### AI Model
- TensorFlow.js for digit recognition
- Convolutional Neural Network (CNN) architecture
- Training data stored in server memory

## User Experience Requirements
- Immediate feedback on drawing
- Clear instructions
- Smooth transitions between screens
- Error handling for invalid drawings
- Loading states during API calls

## Success Metrics
- Training completion rate
- Prediction accuracy
- User engagement (number of test attempts)
