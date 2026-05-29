import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import multer from 'multer';
import * as XLSX from 'xlsx';

dotenv.config();

const PORT = process.env.PORT || 5003;
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_4821';
const upload = multer({ storage: multer.memoryStorage() });

// Setup DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-exam-platform';
let mongooseConnected = false;
try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
  mongooseConnected = true;
  console.log('[Students] MongoDB connected successfully');
} catch (err) {
  console.log('[Students] MongoDB connection failed. Falling back to persistent JSON storage.');
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
  async insertMany(docs) {
    const data = this.load();
    const newDocs = docs.map(d => {
      const doc = { ...d };
      if (!doc.id && !doc._id) {
        doc.id = 'id_' + Math.random().toString(36).substring(2, 9);
      }
      return doc;
    });
    data.push(...newDocs);
    this.save(data);
    return newDocs;
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
      insertMany: async (docs) => {
        const newDocs = docs.map(d => {
          const doc = { ...d };
          if (!doc.id && !doc._id) {
            doc.id = 'id_' + Math.random().toString(36).substring(2, 9);
          }
          return doc;
        });
        await col.insertMany(newDocs);
        return newDocs;
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
    console.error('[Students Mail Queue] Dispatch error:', err.message);
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

// List students
app.get('/api/students', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const studentCols = getCollection('students');
  let filter = {};

  if (req.user.role === 'management') {
    filter.collegeId = req.user.collegeId;
  }

  const list = await studentCols.find(filter);
  return res.json(list.map(s => {
    const { password, otp, ...safeStudent } = s;
    return safeStudent;
  }));
});

// Toggle Student Status
app.patch('/api/students/:id/status', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const { id } = req.params;
  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ id });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (req.user.role === 'management' && student.collegeId !== req.user.collegeId) {
    return res.status(403).json({ message: 'Unauthorized access to college roster.' });
  }

  const nextStatus = student.status === 'active' ? 'inactive' : 'active';
  await studentCols.updateOne({ id }, { status: nextStatus });

  // audit log event
  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'student_status_toggled',
    performedBy: req.user.name,
    target: student.name,
    details: `Changed status of student ${student.name} to ${nextStatus}.`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: `Student status updated to ${nextStatus}.` });
});

// Force Password Reset
app.post('/api/students/:id/force-reset', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const { id } = req.params;
  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ id });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (req.user.role === 'management' && student.collegeId !== req.user.collegeId) {
    return res.status(403).json({ message: 'Unauthorized.' });
  }

  const cleanName = student.name.replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  const tempPassword = `${prefix}@${num}`;

  await studentCols.updateOne({ id }, { 
    password: bcrypt.hashSync(tempPassword, 8),
    mustResetPassword: true 
  });

  await queueEmail(
    student.email,
    'Your Credentials Have Been Reset by Administrator',
    'password_force_reset',
    `Dear ${student.name},\n\nYour exam portal account password has been reset by your college administrator.\n\n=== YOUR NEW TEMPORARY PASSWORD ===\nRoll Number: ${student.rollNumber}\nTemporary Password: ${tempPassword}\n\nYou must reset this password upon signing in.\n\nBest regards,\nOmniProctor Support Team`
  );

  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'student_password_reset',
    performedBy: req.user.name,
    target: student.name,
    details: `Password force reset for student ${student.name}.`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    message: `Password successfully reset. New credentials emailed to student.`,
    tempPassword
  });
});

// Resend Credentials
app.post('/api/students/:id/resend-credentials', authenticate, authorize(['management', 'super_admin']), async (req, res) => {
  const { id } = req.params;
  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ id });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (req.user.role === 'management' && student.collegeId !== req.user.collegeId) {
    return res.status(403).json({ message: 'Unauthorized.' });
  }

  if (student.status === 'pending') {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await studentCols.updateOne({ id: student.id }, {
      otp: newOtp,
      otpExpires: newOtpExpires,
      otpRetries: 0
    });

    await queueEmail(
      student.email,
      'Invitation to OmniProctor Exam Platform',
      'student_invitation',
      `Dear ${student.name},\n\nYou have been invited by your college administration to join the OmniProctor Online Examination Platform.\n\nPlease click the link below to set your password, verify your email, and activate your student account:\nhttp://localhost:5173/activate?email=${student.email}&otp=${newOtp}\n\nAlternatively, you can go to http://localhost:5173/activate and enter the following details:\nEmail: ${student.email}\nVerification OTP: ${newOtp}\n\nThis invitation link and verification code is valid for 24 hours.\n\nBest regards,\nOmniProctor Team`
    );

    return res.json({ message: 'Invitation email containing activation link resent successfully.' });
  }

  await queueEmail(
    student.email,
    'OmniProctor Account Credentials - Reminder',
    'student_registration_reminder',
    `Dear ${student.name},\n\nThis is a reminder of your student account credentials for the OmniProctor platform.\n\nUsername/Roll Number: ${student.rollNumber}\nEmail: ${student.email}\nCollege: ${student.collegeName}\n\nIf you forgot your password, please request a password reset or ask your administrator.\n\nBest regards,\nOmniProctor Team`
  );

  return res.json({ message: 'Welcome credential reminder email queued successfully.' });
});

// Import CSV Roster
app.post('/api/students/import', authenticate, authorize(['management']), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV/Excel data file uploaded.' });
  }

  const collegeId = req.user.collegeId;
  const collegeName = req.user.collegeName;
  if (!collegeId) {
    return res.status(400).json({ message: 'College Admin context required to import roster.' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const dataAOA = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    if (dataAOA.length <= 1) {
      return res.status(400).json({ message: 'Uploaded file is empty or missing data rows.' });
    }

    const headers = dataAOA[0].map(h => String(h || '').toLowerCase().trim());
    const reqHeaders = ['full_name', 'email', 'roll_number', 'branch', 'year'];
    const missingHeaders = reqHeaders.filter(rh => !headers.includes(rh));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        message: `Missing mandatory spreadsheet columns: ${missingHeaders.join(', ')}`,
        expectedHeaders: reqHeaders
      });
    }

    const nameIdx = headers.indexOf('full_name');
    const emailIdx = headers.indexOf('email');
    const rollIdx = headers.indexOf('roll_number');
    const branchIdx = headers.indexOf('branch');
    const yearIdx = headers.indexOf('year');
    const mobileIdx = headers.indexOf('mobile_number');
    const genderIdx = headers.indexOf('gender');

    const imported = [];
    const errors = [];
    const studentCols = getCollection('students');

    const validBranches = ['CSE', 'ECE', 'IT', 'ME', 'EE', 'Civil'];
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    for (let i = 1; i < dataAOA.length; i++) {
      const cols = dataAOA[i];
      if (!cols || cols.length === 0 || cols.every(cell => String(cell || '').trim() === '')) {
        continue;
      }

      const fullName = String(cols[nameIdx] || '').trim();
      const email = String(cols[emailIdx] || '').trim().toLowerCase();
      const rollNumber = String(cols[rollIdx] || '').trim();
      const branch = String(cols[branchIdx] || '').trim();
      const year = String(cols[yearIdx] || '').trim();
      const mobileNumber = mobileIdx !== -1 ? String(cols[mobileIdx] || '').trim() : '';
      const gender = genderIdx !== -1 ? String(cols[genderIdx] || '').trim() : 'Not Specified';

      if (!fullName || !email || !rollNumber || !branch || !year) {
        errors.push({ row: i + 1, error: 'Missing values for required parameters.' });
        continue;
      }

      if (!validBranches.includes(branch)) {
        errors.push({ row: i + 1, rollNumber, error: `Invalid Branch "${branch}". Allowed: ${validBranches.join(', ')}` });
        continue;
      }

      if (!validYears.includes(year)) {
        errors.push({ row: i + 1, rollNumber, error: `Invalid Year "${year}". Allowed: ${validYears.join(', ')}` });
        continue;
      }

      const dupRoll = await studentCols.findOne({ rollNumber });
      if (dupRoll) {
        errors.push({ row: i + 1, rollNumber, error: `Roll number ${rollNumber} already exists in database.` });
        continue;
      }

      const dupEmail = await studentCols.findOne({ email });
      if (dupEmail) {
        errors.push({ row: i + 1, rollNumber, error: `Email ${email} already exists in database.` });
        continue;
      }

      const csvDupRoll = imported.some(item => item.rollNumber === rollNumber);
      if (csvDupRoll) {
        errors.push({ row: i + 1, rollNumber, error: `Duplicate roll number ${rollNumber} within the same file.` });
        continue;
      }

      const csvDupEmail = imported.some(item => item.email === email);
      if (csvDupEmail) {
        errors.push({ row: i + 1, rollNumber, error: `Duplicate email ${email} within the same file.` });
        continue;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const departmentMap = {
        'CSE': 'Computer Science & Engineering',
        'ECE': 'Electronics & Communication',
        'EEE': 'Electrical & Electronics',
        'EE': 'Electrical & Electronics',
        'ME': 'Mechanical Engineering',
        'CE': 'Civil Engineering',
        'Civil': 'Civil Engineering',
        'IT': 'Information Technology'
      };

      imported.push({
        id: rollNumber,
        name: fullName,
        email,
        rollNumber,
        branch,
        department: departmentMap[branch] || branch || 'General',
        year,
        mobileNumber,
        gender,
        collegeId,
        collegeName,
        password: '',
        mustResetPassword: false,
        verified: false,
        status: 'pending',
        otp,
        otpExpires,
        otpRetries: 0,
        createdAt: new Date().toISOString()
      });
    }

    if (imported.length > 0) {
      await studentCols.insertMany(imported);
      
      for (const stud of imported) {
        await queueEmail(
          stud.email,
          'Invitation to OmniProctor Exam Platform',
          'student_invitation',
          `Dear ${stud.name},\n\nYou have been invited by your college administration to join the OmniProctor Online Examination Platform.\n\nPlease click the link below to set your password, verify your email, and activate your student account:\nhttp://localhost:5173/activate?email=${stud.email}&otp=${stud.otp}\n\nAlternatively, you can go to http://localhost:5173/activate and enter the following details:\nEmail: ${stud.email}\nVerification OTP: ${stud.otp}\n\nThis invitation link and verification code is valid for 24 hours.\n\nBest regards,\nOmniProctor Team`
        );
      }
    }

    return res.json({
      summary: {
        totalRowsProcessed: dataAOA.length - 1,
        successCount: imported.length,
        errorCount: errors.length
      },
      errors,
      preview: imported.slice(0, 10).map(s => ({
        fullName: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        branch: s.branch,
        year: s.year,
        activationOtp: s.otp
      }))
    });
  } catch (err) {
    console.error('Import parse error:', err);
    return res.status(500).json({ message: 'Error parsing upload data sheet. Ensure valid formatting.' });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Student Service running on port ${PORT}`);
  console.log(`===============================================`);
});
