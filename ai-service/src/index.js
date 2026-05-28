import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'active', 
    services: {
      yolov8: 'running',
      insightface: 'running',
      tesseract: 'running',
      ollama: 'running'
    }
  });
});

// YOLOv8 & InsightFace frame processing route
app.post('/analyze-frame', (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ message: 'Frame image data is required' });
  }

  // Simulate processing time
  const randomValue = Math.random();
  let objectsDetected = ['person'];
  let faceDetected = true;
  let multipleFaces = false;
  let textDetected = '';

  // Simulate random proctoring anomalies
  if (randomValue > 0.95) {
    objectsDetected.push('cell phone');
  } else if (randomValue > 0.90) {
    objectsDetected.push('book');
    textDetected = 'Artificial Intelligence Reference Guide';
  } else if (randomValue > 0.85) {
    multipleFaces = true;
  }

  return res.json({
    timestamp: new Date().toISOString(),
    faceDetection: {
      faceMatched: true,
      confidence: 0.98,
      multipleFaces
    },
    objectDetection: {
      objects: objectsDetected,
      phoneDetected: objectsDetected.includes('cell phone'),
      bookDetected: objectsDetected.includes('book')
    },
    ocr: {
      text: textDetected
    }
  });
});

// Ollama / Mistral MCQ Generation route
app.post('/generate-questions', (req, res) => {
  const { subject, topic, count, difficulty } = req.body;
  if (!subject || !topic) {
    return res.status(400).json({ message: 'Subject and topic are required' });
  }

  const qCount = parseInt(count) || 3;
  const questionsList = [];

  for (let i = 1; i <= qCount; i++) {
    questionsList.push({
      id: `q_ai_${Date.now()}_${i}`,
      subject,
      topic,
      type: 'mcq',
      difficulty: difficulty || 'Medium',
      questionText: `Generated Question #${i} about ${topic} in ${subject}?`,
      options: [
        { key: 'A', text: `Option A for generated topic ${topic}` },
        { key: 'B', text: `Option B for generated topic ${topic}` },
        { key: 'C', text: `Option C for generated topic ${topic}` },
        { key: 'D', text: `Option D for generated topic ${topic}` }
      ],
      correctAnswer: 'A'
    });
  }

  return res.json({
    model: 'mistral-7b',
    questions: questionsList
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Independent AI Services Active   `);
  console.log(`  Running on http://localhost:${PORT}          `);
  console.log(`===============================================`);
});
