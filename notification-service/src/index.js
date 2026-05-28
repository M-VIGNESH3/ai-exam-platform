import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5006;
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_4821';

// Setup DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-exam-platform';
let mongooseConnected = false;
try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
  mongooseConnected = true;
  console.log('[Notifications] MongoDB connected successfully');
} catch (err) {
  console.log('[Notifications] MongoDB connection failed. Falling back to persistent JSON storage.');
}

const DATA_DIR = process.env.DATA_DIR || path.resolve('../database/data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      // Custom notifications $or logic
      if (query.$or && Array.isArray(query.$or)) {
        const matchesOr = query.$or.some(subQuery => {
          for (const key in subQuery) {
            if (item[key] !== subQuery[key]) return false;
          }
          return true;
        });
        if (!matchesOr) return false;
      }
      for (const key in query) {
        if (key === '$or') continue;
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

// Get Notifications inbox
app.get('/api/notifications', authenticate, async (req, res) => {
  const notifCols = getCollection('notifications');
  const userRole = req.user.role;
  const userId = req.user.id;

  const list = await notifCols.find({
    recipientRole: userRole,
    $or: [
      { recipientId: userId },
      { recipientId: 'global' }
    ]
  });

  return res.json(list);
});

// Mark Notification read
app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  const { id } = req.params;
  const notifCols = getCollection('notifications');
  await notifCols.updateOne({ id }, { read: true });
  return res.json({ message: 'Notification marked as read.' });
});

// Get Admin Analytics
app.get('/api/analytics', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const exams = getCollection('exams');
  const students = getCollection('students');
  const attempts = getCollection('attempts');
  const fraudEvents = getCollection('fraudEvents');

  const collegeId = req.user.collegeId;

  const collegeExams = await exams.find({ collegeId });
  const examIds = collegeExams.map(e => e.id);

  const collegeStudents = await students.find({ collegeId });
  
  const allAttempts = await attempts.find();
  const collegeAttempts = allAttempts.filter(att => examIds.includes(att.examId));

  const allFrauds = await fraudEvents.find();
  const collegeFrauds = allFrauds.filter(f => examIds.includes(f.examId));

  const totalExams = collegeExams.length;
  const totalStudents = collegeStudents.length;
  const totalAttempts = collegeAttempts.length;
  const totalFrauds = collegeFrauds.length;

  const scoresSum = collegeAttempts.reduce((sum, att) => sum + att.score, 0);
  const averageScore = totalAttempts > 0 ? parseFloat((scoresSum / totalAttempts).toFixed(2)) : 0;

  return res.json({
    totalExams,
    totalStudents,
    totalAttempts,
    totalFrauds,
    averageScore
  });
});

// Get Outbox Email Logs
app.get('/api/analytics/emails', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const emailLogs = getCollection('emailLogs');
  const list = await emailLogs.find();
  return res.json(list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// Resend Email Log
app.post('/api/analytics/emails/:id/resend', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const { id } = req.params;
  const emailLogs = getCollection('emailLogs');
  const email = await emailLogs.findOne({ id });
  if (!email) return res.status(404).json({ message: 'Email log not found.' });

  await emailLogs.updateOne({ id }, { status: 'pending', retries: 0, lastError: null });

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
      to: email.recipient,
      subject: email.subject,
      text: email.content,
      html: email.content.replace(/\n/g, '<br/>')
    });
    await emailLogs.updateOne({ id }, { status: 'delivered', timestamp: new Date().toISOString() });
    return res.json({ message: 'Email sent successfully on retry.' });
  } catch (err) {
    await emailLogs.updateOne({ id }, { status: 'failed', lastError: err.message, timestamp: new Date().toISOString() });
    return res.status(500).json({ message: `Resend failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Notification Service running on port ${PORT}`);
  console.log(`===============================================`);
});
