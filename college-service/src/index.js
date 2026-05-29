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

const PORT = process.env.PORT || 5002;
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
  console.log('[Colleges] MongoDB connected successfully');
} catch (err) {
  console.log('[Colleges] MongoDB connection failed. Falling back to persistent JSON storage.');
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
  async updateMany(query, update) {
    const data = this.load();
    let modifiedCount = 0;
    const setValues = update.$set ? update.$set : update;
    data.forEach((item, index) => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        data[index] = { ...item, ...setValues };
        modifiedCount++;
      }
    });
    if (modifiedCount > 0) {
      this.save(data);
    }
    return { matchedCount: modifiedCount, modifiedCount };
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
      updateMany: async (query, update) => {
        const setVal = update.$set ? update : { $set: update };
        const res = await col.updateMany(query, setVal);
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
    console.error('[Colleges Mail Queue] Dispatch error:', err.message);
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

// Onboard College
app.post('/api/colleges', authenticate, authorize(['super_admin']), async (req, res) => {
  const {
    college_name,
    college_code,
    college_email,
    college_phone,
    address,
    admin_name,
    admin_email
  } = req.body;

  if (!college_name || !college_code || !college_email || !admin_name || !admin_email) {
    return res.status(400).json({ message: 'Missing mandatory onboarding fields.' });
  }

  const colleges = getCollection('colleges');
  const adminCols = getCollection('managementAdmins');

  const existingCol = await colleges.findOne({ code: college_code.toUpperCase() });
  if (existingCol) {
    return res.status(400).json({ message: 'College code is already registered.' });
  }

  const existingAdmin = await adminCols.findOne({ email: admin_email.toLowerCase() });
  if (existingAdmin) {
    return res.status(400).json({ message: 'Admin email is already registered.' });
  }

  const collegeId = 'c_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const newCollege = {
    id: collegeId,
    name: college_name,
    code: college_code.toUpperCase(),
    email: college_email,
    phone: college_phone || '',
    address: address || '',
    status: 'active',
    departmentCount: 0,
    examCount: 0,
    createdAt: new Date().toISOString()
  };

  const cleanName = admin_name.replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
  const specialChars = '@#$';
  const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const num = Math.floor(1000 + Math.random() * 9000);
  const tempPassword = `${prefix}${special}${num}`;

  const adminId = 'm_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const newAdmin = {
    id: adminId,
    collegeId,
    collegeName: college_name,
    name: admin_name,
    email: admin_email.toLowerCase(),
    role: 'management',
    department: 'All',
    password: bcrypt.hashSync(tempPassword, 8),
    mustResetPassword: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    tempPasswordDisplay: tempPassword
  };

  await colleges.insertOne(newCollege);
  await adminCols.insertOne(newAdmin);

  await queueEmail(
    newAdmin.email,
    `Your Institution Administrator Credentials - ${college_name}`,
    'college_admin_creation',
    `Dear ${admin_name},\n\nYour college admin account has been successfully provisioned for ${college_name}.\n\n=== LOGIN CREDENTIALS ===\nWeb Console: ${req.headers.origin || 'http://localhost:5173'}\nUsername/Email: ${newAdmin.email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT NOTE: You are required to reset your temporary password on your very first login.\n\nBest regards,\nOmniProctor Support Services`
  );

  // audit log event
  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'college_onboarded',
    performedBy: req.user.name,
    target: college_name,
    details: `College ${college_name} (${college_code}) onboarded.`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    message: 'College and Administrator onboarded successfully.',
    college: newCollege,
    admin: {
      ...newAdmin,
      tempPassword
    }
  });
});

// Add College Sub-Admin (Management Admin level)
app.post('/api/colleges/admins', authenticate, authorize(['management']), async (req, res) => {
  const { name, email, department } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const adminCols = getCollection('managementAdmins');
  const existingAdmin = await adminCols.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return res.status(400).json({ message: 'Admin email is already registered.' });
  }

  const cleanName = name.replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
  const specialChars = '@#$';
  const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const num = Math.floor(1000 + Math.random() * 9000);
  const tempPassword = `${prefix}${special}${num}`;

  const adminId = 'm_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const newAdmin = {
    id: adminId,
    collegeId: req.user.collegeId,
    collegeName: req.user.collegeName,
    name,
    email: email.toLowerCase(),
    role: 'management',
    department: department || 'All',
    password: bcrypt.hashSync(tempPassword, 8),
    mustResetPassword: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    tempPasswordDisplay: tempPassword
  };

  await adminCols.insertOne(newAdmin);

  await queueEmail(
    newAdmin.email,
    `Your Institution Administrator Credentials - ${req.user.collegeName}`,
    'college_admin_creation',
    `Dear ${name},\n\nYour management dashboard account has been created for ${req.user.collegeName}.\n\n=== YOUR LOGIN CREDENTIALS ===\nWeb Console: ${req.headers.origin || 'http://localhost'}\nUsername/Email: ${newAdmin.email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT: You MUST reset your password on first login.\n\nBest regards,\nOmniProctor Support Team`
  );

  return res.status(201).json({
    message: 'Sub-admin created successfully.',
    admin: newAdmin
  });
});

// Get College Sub-Admins
app.get('/api/colleges/admins', authenticate, authorize(['management']), async (req, res) => {
  const adminCols = getCollection('managementAdmins');
  const list = await adminCols.find({ collegeId: req.user.collegeId });
  return res.json(list);
});

// List Colleges (Public endpoint for student registration)
app.get('/api/colleges/public', async (req, res) => {
  const colleges = getCollection('colleges');
  const list = await colleges.find({ status: 'active' });
  return res.json(list.map(c => ({ id: c.id, name: c.name, code: c.code, status: c.status })));
});

// List Colleges
app.get('/api/colleges', authenticate, authorize(['super_admin']), async (req, res) => {
  const colleges = getCollection('colleges');
  const list = await colleges.find();
  return res.json(list);
});

// Toggle College Status
app.patch('/api/colleges/:id/status', authenticate, authorize(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const colleges = getCollection('colleges');
  const college = await colleges.findOne({ id });
  
  if (!college) {
    return res.status(404).json({ message: 'College not found.' });
  }

  const nextStatus = college.status === 'active' ? 'inactive' : 'active';
  await colleges.updateOne({ id }, { status: nextStatus });
  
  const adminCols = getCollection('managementAdmins');
  await adminCols.updateMany({ collegeId: id }, { status: nextStatus });

  // audit log event
  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'college_status_toggled',
    performedBy: req.user.name,
    target: college.name,
    details: `College ${college.name} status updated to ${nextStatus}.`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: `College status updated to ${nextStatus}.` });
});

// Force Reset Management Admin Password
app.post('/api/colleges/admins/:id/force-reset', authenticate, authorize(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const adminCols = getCollection('managementAdmins');
  const admin = await adminCols.findOne({ id });

  if (!admin) {
    return res.status(404).json({ message: 'Management Admin not found.' });
  }

  const cleanName = admin.name.replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
  const specialChars = '@#$';
  const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const num = Math.floor(1000 + Math.random() * 9000);
  const tempPassword = `${prefix}${special}${num}`;

  await adminCols.updateOne({ id }, {
    password: bcrypt.hashSync(tempPassword, 8),
    mustResetPassword: true,
    tempPasswordDisplay: tempPassword
  });

  await queueEmail(
    admin.email,
    'Your Credentials Have Been Reset by Super Administrator',
    'password_force_reset',
    `Dear ${admin.name},\n\nYour management admin account password has been reset by the Super Administrator.\n\n=== YOUR NEW TEMPORARY PASSWORD ===\nEmail: ${admin.email}\nTemporary Password: ${tempPassword}\n\nYou must reset this password upon signing in.\n\nBest regards,\nOmniProctor Support Team`
  );

  const auditLogs = getCollection('auditLogs');
  await auditLogs.insertOne({
    id: 'aud_' + Date.now(),
    action: 'admin_password_reset',
    performedBy: req.user.name,
    target: admin.name,
    details: `Password force reset for admin ${admin.name}.`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    message: `Password successfully reset. New credentials emailed to administrator.`,
    tempPassword
  });
});

// Resend Management Admin Credentials
app.post('/api/colleges/admins/:id/resend-credentials', authenticate, authorize(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const adminCols = getCollection('managementAdmins');
  const admin = await adminCols.findOne({ id });

  if (!admin) {
    return res.status(404).json({ message: 'Management Admin not found.' });
  }

  await queueEmail(
    admin.email,
    'OmniProctor Institution Admin Credentials - Reminder',
    'college_admin_reminder',
    `Dear ${admin.name},\n\nThis is a reminder of your administrator credentials for college: ${admin.collegeName}.\nUsername: ${admin.email}\nTemporary Password: ${admin.tempPasswordDisplay || 'Previously configured'}\n\nBest regards,\nOmniProctor Support Team`
  );

  return res.json({ message: 'Admin welcome email reminder queued successfully.' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OmniProctor College Service running on port ${PORT}`);
  console.log(`===============================================`);
});
