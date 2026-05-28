import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5005;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_4821';

// Setup DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-exam-platform';
let mongooseConnected = false;
try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
  mongooseConnected = true;
  console.log('[Proctoring] MongoDB connected successfully');
} catch (err) {
  console.log('[Proctoring] MongoDB connection failed. Falling back to persistent JSON storage.');
}

const DATA_DIR = process.env.DATA_DIR || path.resolve('../database/data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve('../uploads/evidence');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class LocalDB {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
  }
  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (err) {}
    return [];
  }
  save(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {}
  }
  async find(query = {}) {
    const data = this.load();
    return data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }
  async findOne(query = {}) {
    const res = await this.find(query);
    return res[0] || null;
  }
  async insertOne(doc) {
    const data = this.load();
    const newDoc = { ...doc };
    if (!newDoc.id && !newDoc._id) {
      newDoc.id = 'id_' + Math.random().toString(36).substring(2, 9);
    }
    data.push(newDoc);
    this.save(data);
    return newDoc;
  }
  async updateOne(query, update) {
    const data = this.load();
    const doc = data.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    const index = data.indexOf(doc);
    const setValues = update.$set ? update.$set : update;
    data[index] = { ...doc, ...setValues };
    this.save(data);
    return { matchedCount: 1, modifiedCount: 1 };
  }
}

const getCollection = (name) => {
  if (mongooseConnected && mongoose.connection.db) {
    const col = mongoose.connection.db.collection(name);
    return {
      find: async (query = {}) => {
        return await col.find(query).toArray();
      },
      findOne: async (query = {}) => {
        return await col.findOne(query);
      },
      insertOne: async (doc) => {
        const newDoc = { ...doc };
        if (!newDoc.id && !newDoc._id) {
          newDoc.id = 'id_' + Math.random().toString(36).substring(2, 9);
        }
        await col.insertOne(newDoc);
        return newDoc;
      },
      updateOne: async (query, update) => {
        const setVal = update.$set ? update : { $set: update };
        const res = await col.updateOne(query, setVal);
        return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
      }
    };
  }
  return new LocalDB(name);
};

// Mail service queue helper
const queueEmail = async (recipient, subject, eventType, content) => {
  const emailLogs = getCollection('emailLogs');
  const emailId = 'mail_' + Date.now() + Math.random().toString(36).substring(2, 7);
  const emailDoc = {
    id: emailId,
    recipient,
    subject,
    eventType,
    content,
    status: 'pending',
    retries: 0,
    lastError: null,
    timestamp: new Date().toISOString()
  };
  await emailLogs.insertOne(emailDoc);
  
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || 'aiexamplatform123@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD || 'zmso iaml jdkh wpxn';
  const smtpFrom = process.env.SMTP_FROM || 'aiexamplatform123@gmail.com';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  try {
    await transporter.sendMail({
      from: `"${smtpFrom}" <${smtpUser}>`,
      to: recipient,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br/>')
    });
    await emailLogs.updateOne({ id: emailId }, { status: 'delivered', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Proctoring Mail Queue] Dispatch error:', err.message);
    await emailLogs.updateOne({ id: emailId }, { status: 'failed', lastError: err.message, timestamp: new Date().toISOString() });
  }
};

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// Log Anomaly Event
app.post('/api/proctoring/event', authenticate, authorize(['student']), async (req, res) => {
  const { examId, eventType, details, severity } = req.body;
  if (!examId || !eventType) {
    return res.status(400).json({ message: 'Exam ID and Anomaly Event Type are required.' });
  }

  const fraudCols = getCollection('fraudEvents');
  const studentId = req.user.id;
  const studentName = req.user.name;

  const eventId = 'fraud_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const newEvent = {
    id: eventId,
    examId,
    studentId,
    studentName,
    eventType,
    details: details || '',
    severity: severity || 'warning',
    timestamp: new Date().toISOString()
  };

  await fraudCols.insertOne(newEvent);

  if (severity === 'danger') {
    const adminCols = getCollection('managementAdmins');
    const admins = await adminCols.find({ collegeId: req.user.collegeId });
    const exams = getCollection('exams');
    const exam = await exams.findOne({ id: examId });
    
    for (const admin of admins) {
      await queueEmail(
        admin.email,
        `SECURITY ALERT: Anomaly Detected in Exam Room`,
        'proctoring_anomaly_alert',
        `Dear Administrator,\n\nA critical proctoring violation was detected for student "${studentName}" (Roll Number: ${studentId}) during assessment "${exam ? exam.title : 'Assessment'}".\n\nViolation Type: ${eventType}\nDetails: ${details}\nSeverity: CRITICAL DANGER\nTime: ${newEvent.timestamp}\n\nPlease review candidate logs in the Management Console.\n\nBest regards,\nOmniProctor Security Engine`
      );
    }
  }

  return res.status(201).json(newEvent);
});

// Upload Snapshot Evidence
app.post('/api/proctoring/evidence', authenticate, authorize(['student']), async (req, res) => {
  const { examId, imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ message: 'Base64 image stream is required.' });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fileName = `ev_${Date.now()}_${req.user.id}.webp`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/evidence/${fileName}`;
    return res.json({ message: 'Evidence snapshot uploaded successfully.', path: relativePath });
  } catch (err) {
    console.error('Error saving evidence photo:', err);
    return res.status(500).json({ message: 'Failed to process candidate evidence file upload.' });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Proctoring Service running on port ${PORT}`);
  console.log(`===============================================`);
});
