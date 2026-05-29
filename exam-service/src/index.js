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
  async deleteOne(query) {
    const data = this.load();
    const index = data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return { deletedCount: 0 };
    data.splice(index, 1);
    this.save(data);
    return { deletedCount: 1 };
  }
  async insertMany(docs) {
    const data = this.load();
    const newDocs = docs.map(doc => {
      const newDoc = { ...doc };
      if (!newDoc.id && !newDoc._id) {
        newDoc.id = 'id_' + Math.random().toString(36).substring(2, 9);
      }
      return newDoc;
    });
    data.push(...newDocs);
    this.save(data);
    return newDocs;
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
      },
      deleteOne: async (query) => {
        const res = await col.deleteOne(query);
        return { deletedCount: res.deletedCount };
      },
      insertMany: async (docs) => {
        const newDocs = docs.map(doc => {
          const newDoc = { ...doc };
          if (!newDoc.id && !newDoc._id) {
            newDoc.id = 'id_' + Math.random().toString(36).substring(2, 9);
          }
          return newDoc;
        });
        await col.insertMany(newDocs);
        return newDocs;
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

// ==========================================
// QUESTION BANK ENDPOINTS
// ==========================================

// Get all questions
app.get('/api/exams/questions', authenticate, authorize(['management']), async (req, res) => {
  const questions = getCollection('questions');
  const list = await questions.find({ collegeId: req.user.collegeId });
  return res.json(list);
});

// Create question
app.post('/api/exams/questions', authenticate, authorize(['management']), async (req, res) => {
  const { questionText, options, correctAnswer, difficulty, subject, topic, branch, marks, tags } = req.body;

  if (!questionText || !options || options.length !== 4 || !correctAnswer || !difficulty || !subject || !topic) {
    return res.status(400).json({ message: 'Validation Error: Missing required fields or options count is not 4.' });
  }

  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    return res.status(400).json({ message: 'Validation Error: Correct answer must be A, B, C, or D.' });
  }

  const numericMarks = parseFloat(marks);
  if (isNaN(numericMarks) || numericMarks <= 0) {
    return res.status(400).json({ message: 'Validation Error: Question marks must be greater than 0.' });
  }

  const questions = getCollection('questions');

  // Check for duplicate questions in same subject
  const existing = await questions.findOne({
    collegeId: req.user.collegeId,
    subject,
    questionText: questionText.trim()
  });
  if (existing) {
    return res.status(400).json({ message: 'Validation Error: A question with this text already exists in this subject.' });
  }

  const newQuestion = {
    questionText: questionText.trim(),
    options,
    correctAnswer,
    difficulty,
    subject,
    topic,
    branch: branch || 'CSE',
    marks: numericMarks,
    tags: tags || [],
    collegeId: req.user.collegeId,
    createdAt: new Date().toISOString()
  };

  const saved = await questions.insertOne(newQuestion);
  return res.status(201).json(saved);
});

// Edit question
app.put('/api/exams/questions/:id', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const { questionText, options, correctAnswer, difficulty, subject, topic, branch, marks, tags } = req.body;

  if (!questionText || !options || options.length !== 4 || !correctAnswer || !difficulty || !subject || !topic) {
    return res.status(400).json({ message: 'Validation Error: Missing required fields or options count is not 4.' });
  }

  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    return res.status(400).json({ message: 'Validation Error: Correct answer must be A, B, C, or D.' });
  }

  const numericMarks = parseFloat(marks);
  if (isNaN(numericMarks) || numericMarks <= 0) {
    return res.status(400).json({ message: 'Validation Error: Question marks must be greater than 0.' });
  }

  const questions = getCollection('questions');
  const question = await questions.findOne({ id, collegeId: req.user.collegeId });
  if (!question) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  // Check if updating to duplicate text
  const duplicate = await questions.findOne({
    collegeId: req.user.collegeId,
    subject,
    questionText: questionText.trim()
  });
  if (duplicate && duplicate.id !== id) {
    return res.status(400).json({ message: 'Validation Error: Another question with this text already exists in this subject.' });
  }

  const updatedFields = {
    questionText: questionText.trim(),
    options,
    correctAnswer,
    difficulty,
    subject,
    topic,
    branch: branch || 'CSE',
    marks: numericMarks,
    tags: tags || []
  };

  await questions.updateOne({ id, collegeId: req.user.collegeId }, updatedFields);
  return res.json({ id, ...question, ...updatedFields });
});

// Delete question
app.delete('/api/exams/questions/:id', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const questions = getCollection('questions');

  const question = await questions.findOne({ id, collegeId: req.user.collegeId });
  if (!question) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  await questions.deleteOne({ id, collegeId: req.user.collegeId });
  return res.json({ message: 'Question deleted successfully.' });
});

// Bulk import questions
app.post('/api/exams/questions/bulk', authenticate, authorize(['management']), async (req, res) => {
  const { questions: bulkQuestions } = req.body;
  if (!bulkQuestions || !Array.isArray(bulkQuestions) || bulkQuestions.length === 0) {
    return res.status(400).json({ message: 'No questions provided for import.' });
  }

  const questions = getCollection('questions');
  const errors = [];
  const validQuestions = [];
  const existingTexts = new Set();

  const allCurrent = await questions.find({ collegeId: req.user.collegeId });
  allCurrent.forEach(q => existingTexts.add(q.subject + '::' + q.questionText.trim().toLowerCase()));

  for (let i = 0; i < bulkQuestions.length; i++) {
    const q = bulkQuestions[i];
    const rowNum = i + 1;

    if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer || !q.difficulty || !q.subject) {
      errors.push({ row: rowNum, error: 'Missing required columns. Required: Question, Option A, Option B, Option C, Option D, Correct Answer, Difficulty, Subject' });
      continue;
    }

    const cleanAnswer = q.correct_answer.toString().trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(cleanAnswer)) {
      errors.push({ row: rowNum, error: `Invalid Correct Answer: "${cleanAnswer}". Must be one of: A, B, C, D.` });
      continue;
    }

    const marksVal = parseFloat(q.marks) || 1;
    if (marksVal <= 0) {
      errors.push({ row: rowNum, error: `Invalid Marks: ${q.marks}. Must be greater than 0.` });
      continue;
    }

    const textKey = q.subject.trim().toLowerCase() + '::' + q.question.trim().toLowerCase();
    if (existingTexts.has(textKey)) {
      errors.push({ row: rowNum, error: `Duplicate Question: Question text already exists in this subject.` });
      continue;
    }

    existingTexts.add(textKey);

    validQuestions.push({
      questionText: q.question.trim(),
      options: [
        { key: 'A', text: q.option_a.toString().trim() },
        { key: 'B', text: q.option_b.toString().trim() },
        { key: 'C', text: q.option_c.toString().trim() },
        { key: 'D', text: q.option_d.toString().trim() }
      ],
      correctAnswer: cleanAnswer,
      difficulty: q.difficulty.trim(),
      subject: q.subject.trim(),
      topic: (q.topic || 'General').toString().trim(),
      branch: (q.branch || 'CSE').toString().trim(),
      marks: marksVal,
      tags: q.tags ? q.tags.toString().split(',').map(t => t.trim()) : [],
      collegeId: req.user.collegeId,
      createdAt: new Date().toISOString()
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: `Excel/CSV validation failed with ${errors.length} errors.`,
      errors
    });
  }

  const inserted = await questions.insertMany(validQuestions);
  return res.status(201).json({
    message: `Successfully imported ${inserted.length} questions.`,
    count: inserted.length,
    questions: inserted
  });
});

// ==========================================
// QUESTION PAPER ENDPOINTS
// ==========================================

// Get all question papers
app.get('/api/exams/question-papers', authenticate, authorize(['management']), async (req, res) => {
  const papers = getCollection('question_papers');
  const list = await papers.find({ collegeId: req.user.collegeId });
  return res.json(list);
});

// Get single question paper
app.get('/api/exams/question-papers/:id', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const papers = getCollection('question_papers');
  const paper = await papers.findOne({ id, collegeId: req.user.collegeId });
  if (!paper) {
    return res.status(404).json({ message: 'Question paper not found.' });
  }
  return res.json(paper);
});

// Create question paper
app.post('/api/exams/question-papers', authenticate, authorize(['management']), async (req, res) => {
  try {
    const { title, subject, questions: questionIds, questionMarks, marks, totalMarks, status } = req.body;

    if (!title || !subject || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'Missing required question paper parameters.' });
    }

    if (questionIds.length === 0) {
      return res.status(400).json({ message: 'Validation Error: A question paper must contain at least one question.' });
    }

    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== questionIds.length) {
      return res.status(400).json({ message: 'Validation Error: A question paper cannot contain duplicate questions.' });
    }

    const actualMarks = questionMarks || marks || {};

    for (const qId of questionIds) {
      const m = parseFloat(actualMarks[qId]);
      if (isNaN(m) || m <= 0) {
        return res.status(400).json({ message: 'Validation Error: Question marks must be greater than 0.' });
      }
    }

    const papers = getCollection('question_papers');
    const newPaper = {
      title,
      subject,
      questions: questionIds,
      questionMarks: actualMarks,
      totalMarks: totalMarks || questionIds.reduce((sum, qId) => sum + (parseFloat(actualMarks[qId]) || 0), 0),
      status: status || 'draft',
      collegeId: req.user.collegeId,
      createdAt: new Date().toISOString()
    };

    const saved = await papers.insertOne(newPaper);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating question paper:', error);
    return res.status(500).json({ message: 'Internal Server Error: Failed to create question paper.', error: error.message });
  }
});

// Delete question paper
app.delete('/api/exams/question-papers/:id', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const papers = getCollection('question_papers');
  const paper = await papers.findOne({ id, collegeId: req.user.collegeId });
  if (!paper) {
    return res.status(404).json({ message: 'Question paper not found.' });
  }
  await papers.deleteOne({ id, collegeId: req.user.collegeId });
  return res.json({ message: 'Question paper deleted successfully.' });
});

// ==========================================
// EXAM NOTIFICATION HELPER
// ==========================================
const sendExamPublishNotifications = async (exam, creatorUser) => {
  const studentCols = getCollection('students');
  const notifCols = getCollection('notifications');

  const allStudents = await studentCols.find({ collegeId: exam.collegeId, status: 'active' });
  const studentsList = allStudents.filter(stud => {
    if (exam.assignedStudents && exam.assignedStudents.length > 0) {
      return exam.assignedStudents.includes(stud.id) || exam.assignedStudents.includes(stud.rollNumber);
    }
    const branchMatch = !exam.branchFilter || exam.branchFilter === stud.branch;
    const yearMatch = !exam.yearFilter || exam.yearFilter === stud.year;
    return branchMatch && yearMatch;
  });

  for (const stud of studentsList) {
    const notifId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
    await notifCols.insertOne({
      id: notifId,
      recipientRole: 'student',
      recipientId: stud.id,
      title: 'New Exam Assigned',
      message: `Exam "${exam.title}" is published for your branch (${exam.branchFilter || 'All'}) and year (${exam.yearFilter || 'All'}).`,
      timestamp: new Date().toISOString(),
      read: false
    });

    await queueEmail(
      stud.email,
      `Assigned Examination Notification: ${exam.title}`,
      'exam_assigned',
      `Dear ${stud.name},\n\nYou have been assigned the online assessment: ${exam.title}.\nSubject: ${exam.subject}\nDuration: ${exam.duration} Minutes\nPass Threshold: ${exam.passCutoff}%\nAttempt Limit: ${exam.attemptLimit}\nAvailability Window: ${exam.windowStart} to ${exam.windowEnd}\n\nPlease verify your hardware checks prior to starting.\n\nBest regards,\nOmniProctor Academy`
    );
  }
};

// ==========================================
// EXAM ENDPOINTS
// ==========================================

// Create Exam (Draft default)
app.post('/api/exams', authenticate, authorize(['management']), async (req, res) => {
  const {
    title,
    subject,
    questionPaperId,
    duration,
    negativeMarking,
    randomized,
    attemptLimit,
    passCutoff,
    branchFilter,
    yearFilter,
    assignedStudents,
    windowStart,
    windowEnd,
    fullscreenRequired,
    aiProctoringEnabled,
    status
  } = req.body;

  if (!questionPaperId) {
    return res.status(400).json({ message: 'Validation Error: You must select a Question Paper for this exam.' });
  }

  const parsedDuration = parseInt(duration);
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
    return res.status(400).json({ message: 'Validation Error: Exam duration must be greater than 0.' });
  }

  const papers = getCollection('question_papers');
  const paper = await papers.findOne({ id: questionPaperId, collegeId: req.user.collegeId });
  if (!paper) {
    return res.status(404).json({ message: 'Validation Error: Selected Question Paper not found.' });
  }

  const exams = getCollection('exams');
  const examId = 'e_' + Date.now() + Math.random().toString(36).substring(2, 6);

  const newExam = {
    id: examId,
    title: title || paper.title,
    subject: subject || paper.subject,
    questionPaperId,
    questions: paper.questions,
    duration: parsedDuration,
    total_marks: paper.totalMarks,
    negativeMarking: parseFloat(negativeMarking) || 0,
    randomized: randomized ?? true,
    attemptLimit: parseInt(attemptLimit) || 1,
    passCutoff: parseInt(passCutoff) || 40,
    branchFilter: branchFilter || '',
    yearFilter: yearFilter || '',
    assignedStudents: assignedStudents || [],
    windowStart: windowStart || new Date().toISOString().slice(0, 16),
    windowEnd: windowEnd || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    fullscreenRequired: fullscreenRequired ?? true,
    aiProctoringEnabled: aiProctoringEnabled ?? true,
    collegeId: req.user.collegeId,
    status: status || 'draft',
    creator: req.user.name,
    publishedResults: false,
    createdAt: new Date().toISOString()
  };

  if (newExam.status === 'published') {
    const isAssigned = newExam.branchFilter || newExam.yearFilter || (newExam.assignedStudents && newExam.assignedStudents.length > 0);
    if (!isAssigned) {
      return res.status(400).json({ message: 'Validation Error: Cannot publish an unassigned exam. Please assign to branches, years, or individual students first.' });
    }
  }

  await exams.insertOne(newExam);

  if (newExam.status === 'published') {
    await sendExamPublishNotifications(newExam, req.user);
  }

  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'exam_created',
    performedBy: req.user.name,
    target: newExam.title,
    details: `Exam "${newExam.title}" created with status "${newExam.status}".`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({ message: 'Exam created successfully.', exam: newExam });
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

// Publish Exam to Students
app.patch('/api/exams/:id/publish-exam', authenticate, authorize(['management']), async (req, res) => {
  const { id } = req.params;
  const exams = getCollection('exams');

  const exam = await exams.findOne({ id, collegeId: req.user.collegeId });
  if (!exam) {
    return res.status(404).json({ message: 'Exam sheet not found.' });
  }

  const isAssigned = exam.branchFilter || exam.yearFilter || (exam.assignedStudents && exam.assignedStudents.length > 0);
  if (!isAssigned) {
    return res.status(400).json({ message: 'Validation Error: Cannot publish an unassigned exam. Please assign to branches, years, or individual students first.' });
  }

  await exams.updateOne({ id }, { status: 'published' });
  const updatedExam = { ...exam, status: 'published' };

  await sendExamPublishNotifications(updatedExam, req.user);

  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'exam_published',
    performedBy: req.user.name,
    target: exam.title,
    details: `Exam "${exam.title}" published to students.`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Exam published successfully.', exam: updatedExam });
});

// List student-specific assigned and published exams
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
    const assignedToStudent = exam.assignedStudents && (exam.assignedStudents.includes(req.user.id) || exam.assignedStudents.includes(req.user.rollNumber));
    const branchMatch = !exam.branchFilter || exam.branchFilter === req.user.branch;
    const yearMatch = !exam.yearFilter || exam.yearFilter === req.user.year;
    
    if (!assignedToStudent && (exam.branchFilter || exam.yearFilter)) {
      if (exam.branchFilter && exam.branchFilter !== req.user.branch) continue;
      if (exam.yearFilter && exam.yearFilter !== req.user.year) continue;
    }

    const start = exam.windowStart ? new Date(exam.windowStart) : null;
    const end = exam.windowEnd ? new Date(exam.windowEnd) : null;
    
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

// Fetch detailed exam for student (with secure stripped questions)
app.get('/api/exams/student/:id', authenticate, authorize(['student']), async (req, res) => {
  const { id } = req.params;
  const exams = getCollection('exams');
  const questions = getCollection('questions');

  const exam = await exams.findOne({ id, collegeId: req.user.collegeId, status: 'published' });
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found or not published.' });
  }

  const assignedToStudent = exam.assignedStudents && (exam.assignedStudents.includes(req.user.id) || exam.assignedStudents.includes(req.user.rollNumber));
  if (!assignedToStudent) {
    if (exam.branchFilter && exam.branchFilter !== req.user.branch) {
      return res.status(403).json({ message: 'Unauthorized: Branch mismatch.' });
    }
    if (exam.yearFilter && exam.yearFilter !== req.user.year) {
      return res.status(403).json({ message: 'Unauthorized: Year mismatch.' });
    }
  }

  const now = new Date();
  const end = exam.windowEnd ? new Date(exam.windowEnd) : null;
  if (end && now > end) {
    return res.status(403).json({ message: 'Unauthorized: Exam window has expired.' });
  }

  const populatedQuestions = [];
  for (const qId of exam.questions) {
    const q = await questions.findOne({ id: qId });
    if (q) {
      const secureQ = { ...q };
      delete secureQ.correctAnswer;
      populatedQuestions.push(secureQ);
    }
  }

  return res.json({ ...exam, questionsList: populatedQuestions });
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
