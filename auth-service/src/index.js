import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_4821';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super_secret_refresh_key_4821';

// Setup DB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-exam-platform';
let mongooseConnected = false;
try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
  mongooseConnected = true;
  console.log('[Auth] MongoDB connected successfully');
} catch (err) {
  console.log('[Auth] MongoDB connection failed. Falling back to persistent JSON storage.');
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
  console.log(`[Auth Mail Queue] Queued verification email for ${recipient}`);
  
  // Instant send
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
    console.error('[Auth Mail Queue] Dispatch error:', err.message);
    await emailLogs.updateOne({ id: emailId }, { status: 'failed', lastError: err.message, timestamp: new Date().toISOString() });
  }
};

const generateTokens = (user) => {
  const payload = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    collegeId: user.collegeId || null,
    collegeName: user.collegeName || null,
    branch: user.branch || null,
    year: user.year || null,
    rollNumber: user.rollNumber || null
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id || user._id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const SUPER_ADMIN_EMAIL = 'superadmin@platform.com';
const SUPER_ADMIN_PASS_HASH = bcrypt.hashSync('admin123', 8);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email/username, password and role are required' });
  }

  if (role === 'super_admin') {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && bcrypt.compareSync(password, SUPER_ADMIN_PASS_HASH)) {
      const user = { id: 'sa1', name: 'System Architect', email: SUPER_ADMIN_EMAIL, role: 'super_admin' };
      return res.json({ user, ...generateTokens(user) });
    }
    return res.status(401).json({ message: 'Invalid super admin credentials' });
  }

  if (role === 'management') {
    const adminCols = getCollection('managementAdmins');
    const adminUser = await adminCols.findOne({ email: email.toLowerCase() });
    if (adminUser) {
      if (adminUser.status === 'inactive') {
        return res.status(403).json({ message: 'Your administrator account has been deactivated.' });
      }
      if (bcrypt.compareSync(password, adminUser.password)) {
        const user = {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'management',
          collegeId: adminUser.collegeId,
          collegeName: adminUser.collegeName,
          mustResetPassword: adminUser.mustResetPassword
        };
        return res.json({ user, ...generateTokens(user) });
      }
    }
    return res.status(401).json({ message: 'Invalid college administrator credentials' });
  }

  if (role === 'student') {
    const studentCols = getCollection('students');
    const student = await studentCols.findOne({
      $or: [
        { email: email.toLowerCase() },
        { rollNumber: email }
      ]
    });
    if (student) {
      if (student.status === 'inactive') {
        return res.status(403).json({ message: 'Your student account has been deactivated. Please contact your college administrator.' });
      }
      if (!student.verified) {
        return res.status(403).json({ message: 'Email address not verified.', unverified: true, email: student.email });
      }
      if (bcrypt.compareSync(password, student.password)) {
        const user = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'student',
          rollNumber: student.rollNumber,
          branch: student.branch,
          year: student.year,
          collegeId: student.collegeId,
          collegeName: student.collegeName,
          mustResetPassword: student.mustResetPassword
        };
        return res.json({ user, ...generateTokens(user) });
      }
    }
    return res.status(401).json({ message: 'Invalid student credentials or roll number' });
  }
  return res.status(400).json({ message: 'Invalid login role specified' });
});

// Self-Register Student
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, rollNumber, branch, year, mobileNumber, gender, collegeId, password } = req.body;
  if (!fullName || !email || !rollNumber || !branch || !year || !collegeId || !password) {
    return res.status(400).json({ message: 'Missing mandatory fields for student registration' });
  }

  const studentCols = getCollection('students');
  const existingRoll = await studentCols.findOne({ rollNumber });
  if (existingRoll) {
    return res.status(400).json({ message: 'Roll number is already registered' });
  }

  const existingEmail = await studentCols.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(400).json({ message: 'Email is already registered' });
  }

  const colleges = getCollection('colleges');
  const college = await colleges.findOne({ id: collegeId });
  if (!college) {
    return res.status(400).json({ message: 'Selected college does not exist in our systems' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const newStudent = {
    id: rollNumber,
    name: fullName,
    email: email.toLowerCase(),
    rollNumber,
    branch,
    year,
    mobileNumber: mobileNumber || '',
    gender: gender || 'Not Specified',
    collegeId,
    collegeName: college.name,
    password: bcrypt.hashSync(password, 8),
    mustResetPassword: false,
    verified: false,
    otp,
    otpExpires,
    otpRetries: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  await studentCols.insertOne(newStudent);

  await queueEmail(
    newStudent.email,
    'Verify Your Account - OmniProctor.ai OTP Code',
    'student_registration_otp',
    `Dear ${newStudent.name},\n\nThank you for registering. Please verify your account using the 6-digit verification code below.\n\nOTP CODE: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nBest regards,\nOmniProctor.ai Team`
  );

  return res.status(201).json({ 
    message: 'Registration successful! Verification OTP code has been sent to your email.', 
    email: newStudent.email,
    otp
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification OTP are required' });
  }

  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ email: email.toLowerCase() });
  if (!student) {
    return res.status(404).json({ message: 'Student account not found' });
  }

  if (student.verified) {
    return res.json({ message: 'Account is already verified and active' });
  }

  if ((student.otpRetries || 0) >= 5) {
    return res.status(403).json({ message: 'Too many invalid attempts. Please request a new OTP.' });
  }

  if (new Date() > new Date(student.otpExpires)) {
    return res.status(400).json({ message: 'Verification OTP has expired. Please request a new code.' });
  }

  if (String(student.otp) !== String(otp)) {
    await studentCols.updateOne({ rollNumber: student.rollNumber }, { otpRetries: (student.otpRetries || 0) + 1 });
    return res.status(400).json({ message: 'Invalid verification OTP code' });
  }

  await studentCols.updateOne({ rollNumber: student.rollNumber }, { 
    verified: true, 
    otp: null, 
    otpExpires: null, 
    otpRetries: 0 
  });

  return res.json({ message: 'Account activated successfully! You can now log in.' });
});

// Activate Student from Invitation
app.post('/api/auth/activate-student', async (req, res) => {
  const { email, password, otp } = req.body;
  if (!email || !password || !otp) {
    return res.status(400).json({ message: 'Email, password and verification OTP are required' });
  }

  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ email: email.toLowerCase() });
  if (!student) {
    return res.status(404).json({ message: 'Student account not found' });
  }

  if (student.verified && student.status === 'active') {
    return res.status(400).json({ message: 'Account is already activated. Please login directly.' });
  }

  if (new Date() > new Date(student.otpExpires)) {
    return res.status(400).json({ message: 'Activation code has expired. Please contact your administrator or request a new code.' });
  }

  if (String(student.otp) !== String(otp)) {
    return res.status(400).json({ message: 'Invalid activation code/OTP.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  await studentCols.updateOne({ rollNumber: student.rollNumber }, {
    password: hashedPassword,
    verified: true,
    status: 'active',
    otp: null,
    otpExpires: null,
    otpRetries: 0
  });

  return res.json({ message: 'Your account has been activated successfully! You can now log in.' });
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const studentCols = getCollection('students');
  const student = await studentCols.findOne({ email: email.toLowerCase() });
  if (!student) {
    return res.status(404).json({ message: 'Student account not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await studentCols.updateOne({ rollNumber: student.rollNumber }, { 
    otp, 
    otpExpires, 
    otpRetries: 0 
  });

  await queueEmail(
    student.email,
    'Your New Account Verification OTP - OmniProctor.ai',
    'student_registration_otp',
    `Dear ${student.name},\n\nHere is your new 6-digit verification code.\n\nOTP CODE: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nBest regards,\nOmniProctor.ai Team`
  );

  return res.json({ message: 'A new verification code has been dispatched to your inbox.' });
});

// Refresh Token
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    let user = null;

    if (decoded.id === 'sa1') {
      user = { id: 'sa1', name: 'System Architect', email: SUPER_ADMIN_EMAIL, role: 'super_admin' };
    } else {
      const adminCols = getCollection('managementAdmins');
      let dbUser = await adminCols.findOne({ id: decoded.id });
      if (dbUser) {
        user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: 'management', collegeId: dbUser.collegeId, collegeName: dbUser.collegeName };
      } else {
        const studentCols = getCollection('students');
        dbUser = await studentCols.findOne({ id: decoded.id });
        if (dbUser) {
          user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: 'student', rollNumber: dbUser.rollNumber, branch: dbUser.branch, year: dbUser.year, collegeId: dbUser.collegeId, collegeName: dbUser.collegeName };
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User matching token session not found' });
    }

    return res.json(generateTokens(user));
  } catch (err) {
    return res.status(401).json({ message: 'Expired or invalid refresh token' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, role, newPassword } = req.body;
  if (!email || !role || !newPassword) {
    return res.status(400).json({ message: 'Email, role and new password are required' });
  }

  const hashed = bcrypt.hashSync(newPassword, 8);
  let updated = false;

  if (role === 'management') {
    const adminCols = getCollection('managementAdmins');
    const user = await adminCols.findOne({ email: email.toLowerCase() });
    if (user) {
      await adminCols.updateOne({ id: user.id }, { password: hashed, mustResetPassword: false });
      updated = true;
    }
  } else if (role === 'student') {
    const studentCols = getCollection('students');
    const user = await studentCols.findOne({ email: email.toLowerCase() });
    if (user) {
      await studentCols.updateOne({ id: user.id }, { password: hashed, mustResetPassword: false });
      updated = true;
    }
  }

  if (updated) {
    await queueEmail(
      email.toLowerCase(),
      'Security Notification - Password Updated Successfully',
      'password_reset_confirmation',
      `Hello,\n\nYour account password has been updated successfully. If you did not initiate this change, contact system administrators immediately.\n\nBest regards,\nOmniProctor Security Team`
    );
    return res.json({ message: 'Password updated successfully.' });
  }

  return res.status(404).json({ message: 'Account not found in registered rosters' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor Auth Service running on port ${PORT}`);
  console.log(`===============================================`);
});
