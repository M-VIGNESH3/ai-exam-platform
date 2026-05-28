import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5004;
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
  console.log('[Exams] MongoDB connected successfully');
} catch (err) {
  console.log('[Exams] MongoDB connection failed. Falling back to persistent JSON storage.');
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
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.sendMail({
      from: `"OmniProctor.ai" <${smtpUser}>`,
      to: recipient,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br/>')
    });
    await emailLogs.updateOne({ id: emailId }, { status: 'delivered', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Exams Mail Queue] Dispatch error:', err.message);
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

// Schedule Exam
app.post('/api/exams', authenticate, authorize(['management']), async (req, res) => {
  const {
    title,
    subject,
    department,
    duration,
    questions,
    scheduledDate,
    scheduledTime,
    negativeMarking,
    randomized,
    attemptLimit,
    passCutoff,
    branchFilter,
    yearFilter,
    windowStart,
    windowEnd
  } = req.body;

  if (!title || !subject || !duration || !questions || !questions.length) {
    return res.status(400).json({ message: 'Missing required exam config parameters.' });
  }

  const exams = getCollection('exams');
  const studentCols = getCollection('students');
  const notifCols = getCollection('notifications');

  const examId = 'e_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const newExam = {
    id: examId,
    title,
    subject,
    department: department || 'General',
    duration: parseInt(duration) || 60,
    questions,
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: scheduledTime || '12:00 PM',
    negativeMarking: parseFloat(negativeMarking) || 0,
    randomized: randomized ?? true,
    attemptLimit: parseInt(attemptLimit) || 1,
    passCutoff: parseInt(passCutoff) || 40,
    branchFilter: branchFilter || 'CSE',
    yearFilter: yearFilter || '1st Year',
    windowStart: windowStart || new Date().toISOString().slice(0, 16),
    windowEnd: windowEnd || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    collegeId: req.user.collegeId,
    status: 'published',
    creator: req.user.name,
    publishedResults: false,
    createdAt: new Date().toISOString()
  };

  await exams.insertOne(newExam);

  const studentsList = await studentCols.find({ 
    collegeId: req.user.collegeId, 
    branch: branchFilter, 
    year: yearFilter,
    status: 'active'
  });

  for (const stud of studentsList) {
    const notifId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
    await notifCols.insertOne({
      id: notifId,
      recipientRole: 'student',
      recipientId: stud.id,
      title: 'New Exam Assigned',
      message: `Exam "${title}" is scheduled for your branch (${branchFilter}) and year (${yearFilter}).`,
      timestamp: new Date().toISOString(),
      read: false
    });

    await queueEmail(
      stud.email,
      `Assigned Examination Notification: ${title}`,
      'exam_assigned',
      `Dear ${stud.name},\n\nYou have been assigned the online assessment: ${title}.\nSubject: ${subject}\nDuration: ${duration} Minutes\nPass Threshold: ${passCutoff}%\nAttempt Limit: ${attemptLimit}\nAvailability Window: ${newExam.windowStart} to ${newExam.windowEnd}\n\nPlease verify your hardware checks prior to starting.\n\nBest regards,\nOmniProctor Academy`
    );
  }

  // audit log event
  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'exam_scheduled',
    performedBy: req.user.name,
    target: title,
    details: `Exam ${title} scheduled for branch ${branchFilter} and year ${yearFilter}.`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({ message: 'Exam scheduled and assigned successfully.', exam: newExam });
});

// List all exams
app.get('/api/exams', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const exams = getCollection('exams');
  let filter = {};

  if (req.user.role === 'management') {
    filter.collegeId = req.user.collegeId;
  }

  const list = await exams.find(filter);
  return res.json(list);
});

// List student-specific exams
app.get('/api/exams/student', authenticate, authorize(['student']), async (req, res) => {
  const exams = getCollection('exams');
  const attempts = getCollection('attempts');

  const allExams = await exams.find({ 
    collegeId: req.user.collegeId,
    status: 'published'
  });

  const now = new Date();
  const studentExams = [];

  for (const exam of allExams) {
    if (exam.branchFilter && exam.branchFilter !== req.user.branch) continue;
    if (exam.yearFilter && exam.yearFilter !== req.user.year) continue;

    const start = exam.windowStart ? new Date(exam.windowStart) : null;
    const end = exam.windowEnd ? new Date(exam.windowEnd) : null;
    if (start && now < start) continue;
    if (end && now > end) continue;

    const pastAttempts = await attempts.find({ 
      studentId: req.user.id, 
      examId: exam.id 
    });
    
    if (pastAttempts.length >= (exam.attemptLimit || 1)) continue;

    studentExams.push(exam);
  }

  return res.json(studentExams);
});

// Submit Attempt
app.post('/api/exams/attempt', authenticate, authorize(['student']), async (req, res) => {
  const { examId, answers, violationsCount, isTerminated, terminationReason } = req.body;
  if (!examId) {
    return res.status(400).json({ message: 'Exam ID is required.' });
  }

  const exams = getCollection('exams');
  const questions = getCollection('questions');
  const attempts = getCollection('attempts');

  const exam = await exams.findOne({ id: examId });
  if (!exam) {
    return res.status(404).json({ message: 'Exam sheet not found.' });
  }

  let correctAnswers = 0;
  let wrongAnswers = 0;
  let skippedAnswers = 0;

  for (const qId of exam.questions) {
    const q = await questions.findOne({ id: qId });
    if (!q) continue;

    const studentAns = answers[qId];
    if (!studentAns) {
      skippedAnswers++;
    } else if (studentAns === q.correctAnswer) {
      correctAnswers++;
    } else {
      wrongAnswers++;
    }
  }

  const rawScore = correctAnswers - (wrongAnswers * (exam.negativeMarking || 0));
  const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));

  const attemptId = 'att_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const attemptDoc = {
    id: attemptId,
    examId,
    studentId: req.user.id,
    studentName: req.user.name,
    score: finalScore,
    totalQuestions: exam.questions.length,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    status: isTerminated ? 'terminated' : 'completed',
    startTime: new Date(Date.now() - (exam.duration * 60 * 1000)).toISOString(),
    endTime: new Date().toISOString(),
    violationsCount: parseInt(violationsCount) || 0,
    terminationReason: terminationReason || null
  };

  await attempts.insertOne(attemptDoc);

  if (isTerminated) {
    await queueEmail(
      req.user.email,
      `URGENT: Exam Session Terminated - Anomaly Detected`,
      'exam_terminated_anomaly',
      `Dear ${req.user.name},\n\nYour session for "${exam.title}" has been terminated due to a proctoring security violation: ${terminationReason}.\n\nYour logged flags are submitted for management review.\n\nBest regards,\nOmniProctor Security Team`
    );
  }

  return res.status(201).json(attemptDoc);
});

// Toggle Results Publication
app.patch('/api/exams/:id/publish', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const exams = getCollection('exams');
  const attempts = getCollection('attempts');
  const studentCols = getCollection('students');
  const notifCols = getCollection('notifications');

  const exam = await exams.findOne({ id });
  if (!exam) {
    return res.status(404).json({ message: 'Exam sheet not found.' });
  }

  const nextPublished = !exam.publishedResults;
  await exams.updateOne({ id }, { publishedResults: nextPublished });

  if (nextPublished) {
    const examAttempts = await attempts.find({ examId: id });
    for (const att of examAttempts) {
      const student = await studentCols.findOne({ id: att.studentId });
      if (!student) continue;

      const scorePercent = Math.round((att.correctAnswers / att.totalQuestions) * 100);
      const isPassed = scorePercent >= (exam.passCutoff || 40);

      const notifId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
      await notifCols.insertOne({
        id: notifId,
        recipientRole: 'student',
        recipientId: student.id,
        title: 'Exam Results Published',
        message: `Your results for "${exam.title}" have been released. Outcome: ${isPassed ? 'PASSED' : 'FAILED'}.`,
        timestamp: new Date().toISOString(),
        read: false
      });

      await queueEmail(
        student.email,
        `Assessment Outcomes Released: ${exam.title}`,
        'results_published',
        `Dear ${student.name},\n\nThe results for your examination "${exam.title}" are published.\n\n=== GRADE DETAILS ===\nFinal Score: ${att.score} / ${att.totalQuestions}\nCorrect Answers: ${att.correctAnswers}\nWrong Answers: ${att.wrongAnswers}\nResult Status: ${isPassed ? 'PASSED (PASS)' : 'FAILED (FAIL)'}\n\nLog in to your student portal dashboard to review your detailed statistics report sheet.\n\nBest regards,\nOmniProctor Academy`
      );
    }
  }

  return res.json({ message: `Exam results publication set to ${nextPublished}.` });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Exam Service running on port ${PORT}`);
  console.log(`===============================================`);
});
