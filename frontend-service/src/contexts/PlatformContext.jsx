import React, { createContext, useContext, useState, useEffect } from 'react';

const PlatformContext = createContext();

export const usePlatform = () => useContext(PlatformContext);

// Password utility helpers
const hashPassword = (password) => {
  if (!password) return '';
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(16);
};

const generateTempPassword = (name) => {
  const cleanName = (name || 'User').replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
  const chars = '@#$';
  const special = chars.charAt(Math.floor(Math.random() * chars.length));
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${special}${num}`;
};

// Initial Pre-populated Data
const INITIAL_COLLEGES = [
  { id: 'c1', name: 'Imperial College of Science', code: 'ICS', status: 'active', departmentCount: 4, examCount: 3 },
  { id: 'c2', name: 'Stanford Technical Institute', code: 'STI', status: 'active', departmentCount: 3, examCount: 2 },
  { id: 'c3', name: 'MIT Applied Research Lab', code: 'MIT-A', status: 'inactive', departmentCount: 5, examCount: 0 }
];

const INITIAL_DEPARTMENTS = [
  { id: 'dept1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'dept2', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'dept3', name: 'Information Technology', code: 'IT' },
  { id: 'dept4', name: 'Mechanical Engineering', code: 'ME' }
];

const INITIAL_TEACHERS = [
  { id: 't1', name: 'Dr. Sarah Connor', email: 'sarah.c@ics.edu', department: 'Computer Science & Engineering', subject: 'Artificial Intelligence', status: 'active', password: hashPassword('admin123'), mustResetPassword: false },
  { id: 't2', name: 'Prof. Charles Xavier', email: 'charles.x@ics.edu', department: 'Electronics & Communication', subject: 'Signal Processing', status: 'active', password: hashPassword('admin123'), mustResetPassword: false },
  { id: 't3', name: 'Dr. Bruce Banner', email: 'bruce.b@ics.edu', department: 'Information Technology', subject: 'Data Science', status: 'inactive', password: hashPassword('admin123'), mustResetPassword: false }
];

const INITIAL_STUDENTS = [
  { id: 's1', name: 'John Doe', email: 'john.doe@student.edu', rollNumber: 'ICS-2024-001', department: 'Computer Science & Engineering', branch: 'CSE', year: '3rd Year', semester: '6th Semester', status: 'active', batchId: 'b1', collegeId: 'c1', collegeName: 'Imperial College of Science', password: hashPassword('admin123'), mustResetPassword: false },
  { id: 's2', name: 'Jane Smith', email: 'jane.smith@student.edu', rollNumber: 'ICS-2024-002', department: 'Computer Science & Engineering', branch: 'CSE', year: '3rd Year', semester: '6th Semester', status: 'active', batchId: 'b1', collegeId: 'c1', collegeName: 'Imperial College of Science', password: hashPassword('admin123'), mustResetPassword: false },
  { id: 's3', name: 'Alex Mercer', email: 'alex.m@student.edu', rollNumber: 'ICS-2024-045', department: 'Information Technology', branch: 'IT', year: '4th Year', semester: '8th Semester', status: 'active', batchId: 'b3', collegeId: 'c1', collegeName: 'Imperial College of Science', password: hashPassword('admin123'), mustResetPassword: false }
];

const INITIAL_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Artificial Intelligence',
    topic: 'Machine Learning',
    type: 'mcq',
    difficulty: 'Medium',
    questionText: 'Which of the following is an ensemble learning method that builds multiple decision trees and merges them together?',
    options: [
      { key: 'A', text: 'Support Vector Machine' },
      { key: 'B', text: 'Random Forest' },
      { key: 'C', text: 'Linear Regression' },
      { key: 'D', text: 'K-Means Clustering' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 'q2',
    subject: 'Artificial Intelligence',
    topic: 'Neural Networks',
    type: 'mcq',
    difficulty: 'Easy',
    questionText: 'What activation function is commonly used in the output layer of a binary classification neural network?',
    options: [
      { key: 'A', text: 'ReLU' },
      { key: 'B', text: 'Tanh' },
      { key: 'C', text: 'Sigmoid' },
      { key: 'D', text: 'Softmax' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 'q3',
    subject: 'Artificial Intelligence',
    topic: 'Search Algorithms',
    type: 'mcq',
    difficulty: 'Hard',
    questionText: 'Which search algorithm is guaranteed to find the shortest path in a graph if all edge costs are non-negative and the heuristic function is admissible?',
    options: [
      { key: 'A', text: 'Depth First Search (DFS)' },
      { key: 'B', text: 'Greedy Best-First Search' },
      { key: 'C', text: 'A* Search' },
      { key: 'D', text: 'Breadth First Search (BFS)' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 'q4',
    subject: 'Data Science',
    topic: 'Statistics',
    type: 'mcq',
    difficulty: 'Medium',
    questionText: 'What statistical measure describes the asymmetry of a probability distribution around its mean?',
    options: [
      { key: 'A', text: 'Kurtosis' },
      { key: 'B', text: 'Variance' },
      { key: 'C', text: 'Skewness' },
      { key: 'D', text: 'Standard Deviation' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 'q5',
    subject: 'Data Science',
    topic: 'Big Data',
    type: 'mcq',
    difficulty: 'Easy',
    questionText: 'In the Hadoop ecosystem, what component is responsible for resource management and job scheduling?',
    options: [
      { key: 'A', text: 'HDFS' },
      { key: 'B', text: 'YARN' },
      { key: 'C', text: 'MapReduce' },
      { key: 'D', text: 'Hive' }
    ],
    correctAnswer: 'B'
  }
];

const INITIAL_EXAMS = [
  {
    id: 'e1',
    title: 'Mid-Term Artificial Intelligence Examination',
    subject: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    duration: 10,
    questions: ['q1', 'q2', 'q3'],
    scheduledDate: '2026-05-30',
    scheduledTime: '10:00 AM',
    negativeMarking: 0.25,
    randomized: true,
    attemptLimit: 1,
    status: 'published',
    creator: 'Dr. Sarah Connor',
    batches: ['b1'],
    publishedResults: false
  },
  {
    id: 'e2',
    title: 'Data Science Foundations Quiz',
    subject: 'Data Science',
    department: 'Information Technology',
    duration: 15,
    questions: ['q4', 'q5'],
    scheduledDate: '2026-06-02',
    scheduledTime: '02:00 PM',
    negativeMarking: 0,
    randomized: false,
    attemptLimit: 2,
    status: 'published',
    creator: 'Dr. Bruce Banner',
    batches: ['b3'],
    publishedResults: false
  }
];

const INITIAL_ATTEMPTS = [
  {
    id: 'att1',
    examId: 'e1',
    studentId: 's3',
    studentName: 'Alex Mercer',
    score: 2.0,
    totalQuestions: 3,
    correctAnswers: 2,
    wrongAnswers: 0,
    skippedAnswers: 1,
    status: 'completed',
    startTime: '2026-05-26T14:00:00Z',
    endTime: '2026-05-26T14:08:12Z',
    violationsCount: 0,
    terminationReason: null
  }
];

const INITIAL_FRAUD_EVENTS = [];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', recipientRole: 'student', recipientId: 's1', title: 'Exam Scheduled', message: 'Mid-Term Artificial Intelligence Examination is scheduled for May 30, 2026, at 10:00 AM.', timestamp: '2026-05-26T09:00:00Z', read: false },
  { id: 'n2', recipientRole: 'student', recipientId: 's2', title: 'Exam Scheduled', message: 'Mid-Term Artificial Intelligence Examination is scheduled for May 30, 2026, at 10:00 AM.', timestamp: '2026-05-26T09:00:00Z', read: false },
  { id: 'n3', recipientRole: 'management', recipientId: 'global', title: 'System Setup Active', message: 'Imperial College of Science and Stanford Technical Institute have been successfully verified.', timestamp: '2026-05-26T08:00:00Z', read: false }
];

const INITIAL_BATCHES = [
  { id: 'b1', name: 'CSE-A', department: 'Computer Science & Engineering', students: ['s1', 's2'] },
  { id: 'b2', name: 'CSE-B', department: 'Computer Science & Engineering', students: [] },
  { id: 'b3', name: 'ECE-A', department: 'Electronics & Communication', students: ['s3'] }
];

const INITIAL_MANAGEMENT_ADMINS = [
  { id: 'm1', name: 'Admin Manager', email: 'admin@ics.edu', department: 'All', collegeId: 'c1', collegeName: 'Imperial College of Science', password: hashPassword('admin123'), mustResetPassword: false }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'audit_init', action: 'system_boot', actor: 'System', target: 'Platform', details: 'Platform initialized with seed data.', timestamp: '2026-05-26T08:00:00Z' }
];

// Unique ID generator utility
const uid = (prefix) => prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

export const PlatformProvider = ({ children }) => {
  const [apiActive, setApiActive] = useState(false);

  const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    const activeToken = token || localStorage.getItem('access_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    let res = await fetch(`/api${endpoint}`, config);
    
    if (res.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh })
          });
          if (refreshRes.ok) {
            const tokens = await refreshRes.json();
            localStorage.setItem('access_token', tokens.accessToken);
            localStorage.setItem('refresh_token', tokens.refreshToken);
            
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
            res = await fetch(`/api${endpoint}`, { ...config, headers });
          }
        } catch (e) {
          console.error('Error refreshing token:', e);
        }
      }
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setApiActive(true);
          console.log('[PlatformContext] Connected to Express Core Backend.');
        } else {
          setApiActive(false);
        }
      } catch (e) {
        setApiActive(false);
      }
    };
    checkHealth();
  }, []);

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('platform_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [emailQueue, setEmailQueue] = useState(() => {
    const saved = localStorage.getItem('platform_email_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [smtpHealthy, setSmtpHealthy] = useState(true);

  // Global Lists States
  const [colleges, setColleges] = useState(() => {
    const saved = localStorage.getItem('platform_colleges');
    return saved ? JSON.parse(saved) : INITIAL_COLLEGES;
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('platform_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('platform_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [managementAdmins, setManagementAdmins] = useState(() => {
    const saved = localStorage.getItem('platform_management_admins');
    return saved ? JSON.parse(saved) : INITIAL_MANAGEMENT_ADMINS;
  });

  const [teachers, setTeachers] = useState(() => {
    const saved = localStorage.getItem('platform_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('platform_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('platform_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [questionPapers, setQuestionPapers] = useState(() => {
    const saved = localStorage.getItem('platform_question_papers');
    return saved ? JSON.parse(saved) : [];
  });

  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('platform_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('platform_attempts');
    return saved ? JSON.parse(saved) : INITIAL_ATTEMPTS;
  });

  const [fraudEvents, setFraudEvents] = useState(() => {
    const saved = localStorage.getItem('platform_fraud_events');
    return saved ? JSON.parse(saved) : INITIAL_FRAUD_EVENTS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('platform_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [emailLogs, setEmailLogs] = useState(() => {
    const saved = localStorage.getItem('platform_email_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('platform_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    if (!apiActive || !currentUser) return;

    const token = localStorage.getItem('access_token');

    const fetchData = async () => {
      try {
        if (currentUser.role === 'super_admin') {
          const colData = await apiRequest('/colleges', 'GET', null, token);
          setColleges(colData);
          const studentData = await apiRequest('/students', 'GET', null, token);
          setStudents(studentData);
          const examData = await apiRequest('/exams', 'GET', null, token);
          setExams(examData);
        } else if (currentUser.role === 'management') {
          const studentData = await apiRequest('/students', 'GET', null, token);
          setStudents(studentData);
          const examData = await apiRequest('/exams', 'GET', null, token);
          setExams(examData);
          const questionsData = await apiRequest('/exams/questions', 'GET', null, token);
          setQuestions(questionsData);
          const papersData = await apiRequest('/exams/question-papers', 'GET', null, token);
          setQuestionPapers(papersData);
        } else if (currentUser.role === 'student') {
          const studentExams = await apiRequest('/exams/student', 'GET', null, token);
          setExams(studentExams);
        }

        const notifs = await apiRequest('/notifications', 'GET', null, token);
        setNotifications(notifs);

        const logs = await apiRequest('/analytics/emails', 'GET', null, token);
        setEmailLogs(logs);
      } catch (err) {
        console.error('Error fetching data from API:', err);
      }
    };

    fetchData();
  }, [apiActive, currentUser]);

  // Theme state: light, dark, system
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('platform_theme') || 'system';
  });

  // Toast System
  const [toasts, setToasts] = useState([]);

  // Toast Trigger
  const addToast = (title, message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('platform_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('platform_colleges', JSON.stringify(colleges));
  }, [colleges]);

  useEffect(() => {
    localStorage.setItem('platform_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('platform_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('platform_management_admins', JSON.stringify(managementAdmins));
  }, [managementAdmins]);

  useEffect(() => {
    localStorage.setItem('platform_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('platform_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('platform_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('platform_question_papers', JSON.stringify(questionPapers));
  }, [questionPapers]);

  useEffect(() => {
    localStorage.setItem('platform_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('platform_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('platform_fraud_events', JSON.stringify(fraudEvents));
  }, [fraudEvents]);

  useEffect(() => {
    localStorage.setItem('platform_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('platform_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem('platform_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('platform_email_queue', JSON.stringify(emailQueue));
  }, [emailQueue]);

  useEffect(() => {
    localStorage.setItem('platform_theme', theme);
    applyTheme(theme);
  }, [theme]);

  // Apply Theme logic
  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    if (selectedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (selectedTheme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  };

  // System Theme change listener
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Queue-based email delivery & retry system
  const sendMockEmail = (to, subject, type, body) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(to);

    // Duplicate prevention: check if same recipient, subject, and type was queued in last 1 minute
    const isDuplicate = emailQueue.some(item => 
      item.to.toLowerCase() === to.toLowerCase() &&
      item.subject === subject &&
      (Date.now() - new Date(item.timestamp).getTime()) < 60000
    );

    if (isDuplicate) {
      addToast('Email Skipped', `Duplicate prevention active for ${to}.`, 'warning');
      return;
    }

    const newEmail = {
      id: 'em_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      to,
      subject,
      type,
      body,
      timestamp: new Date().toISOString(),
      status: isValid ? 'pending' : 'invalid_address',
      retryCount: 0,
      errorMessage: isValid ? '' : 'Failed SMTP recipient formatting verification checks.'
    };

    setEmailQueue(prev => [newEmail, ...prev]);
    if (!isValid) {
      addToast('SMTP Address Error', `Invalid email pattern: ${to}`, 'danger');
    } else {
      addToast('Message Queued', `Outbox delivery queued for ${to}`, 'info');
    }
  };

  // Background Outbox Runner Daemon
  useEffect(() => {
    const interval = setInterval(() => {
      setEmailQueue(prev => {
        let changed = false;
        const next = prev.map(item => {
          if (item.status === 'pending' || (item.status === 'failed' && item.retryCount < 3)) {
            changed = true;
            if (smtpHealthy) {
              // Success delivery
              const newLog = {
                id: 'emlog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                to: item.to,
                subject: item.subject,
                type: item.type,
                body: item.body,
                timestamp: new Date().toISOString()
              };
              setEmailLogs(logs => [newLog, ...logs]);
              // Trigger a browser alert-toast
              setTimeout(() => addToast('Email Dispatched', `Message successfully delivered to ${item.to}`, 'success'), 50);
              return { ...item, status: 'sent', lastAttempt: new Date().toISOString(), errorMessage: '' };
            } else {
              // SMTP failure, trigger retry
              const nextRetry = item.retryCount + 1;
              const nextStatus = 'failed';
              setTimeout(() => addToast('SMTP Error', `Delivery failed for ${item.to}. Attempt ${nextRetry}/3.`, 'danger'), 50);
              return {
                ...item,
                status: nextStatus,
                retryCount: nextRetry,
                lastAttempt: new Date().toISOString(),
                errorMessage: 'SMTP Connection Refused: Mock Gateway server down.'
              };
            }
          }
          return item;
        });
        return changed ? next : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [smtpHealthy]);

  const retryFailedEmails = () => {
    setEmailQueue(prev => prev.map(item => {
      if (item.status === 'failed') {
        return { ...item, status: 'pending', retryCount: 0, errorMessage: '' };
      }
      return item;
    }));
    addToast('Outbox Resumed', 'All failed emails have been queued for retry.', 'info');
  };

  const clearEmailLogs = () => {
    setEmailQueue([]);
    setEmailLogs([]);
    addToast('Outbox Cleared', 'Email logs and outbox queues deleted.', 'info');
  };

  // Auth Operations
  const login = async (email, password, role) => {
    if (apiActive) {
      try {
        const data = await apiRequest('/auth/login', 'POST', { email, password, role });
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        setCurrentUser(data.user);
        localStorage.setItem('platform_user', JSON.stringify(data.user));
        logAuditEvent('login_success', data.user.name, data.user.role, `Logged in via Server API.`);
        addToast('Login Successful', `Welcome, ${data.user.name}.`, 'success');
        return true;
      } catch (err) {
        logAuditEvent('login_failed', email, role, `API login failed: ${err.message}`);
        addToast('Authentication Failed', err.message, 'danger');
        return false;
      }
    }

    if (role === 'super_admin' && email === 'superadmin@platform.com') {
      if (hashPassword(password) === hashPassword('admin123')) {
        const user = { role: 'super_admin', id: 'sa1', name: 'System Architect', email, mustResetPassword: false };
        setCurrentUser(user);
        logAuditEvent('login_success', 'System Architect', 'super_admin', `Super admin logged in from ${email}.`);
        addToast('Login Successful', 'Welcome to the Super Admin Portal.', 'success');
        return true;
      }
      logAuditEvent('login_failed', email, 'super_admin', `Failed super admin login attempt.`);
      addToast('Authentication Failed', 'Invalid credentials.', 'danger');
      return false;
    }

    if (role === 'management') {
      const adminUser = managementAdmins.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (adminUser) {
        if (adminUser.status === 'inactive') {
          addToast('Access Denied', 'Your administrator account has been deactivated.', 'danger');
          return false;
        }
        if (adminUser.password !== hashPassword(password)) {
          addToast('Authentication Failed', 'Invalid credentials.', 'danger');
          return false;
        }
        const user = { role: 'management', id: adminUser.id, name: adminUser.name, email: adminUser.email, department: adminUser.department, collegeId: adminUser.collegeId, collegeName: adminUser.collegeName, mustResetPassword: adminUser.mustResetPassword };
        setCurrentUser(user);
        logAuditEvent('login_success', adminUser.name, 'management', `Management admin logged in. mustResetPassword=${adminUser.mustResetPassword}.`);
        addToast('Login Successful', `Welcome to the Institution Management Portal, ${adminUser.name}.`, 'success');
        return true;
      }
    }

    if (role === 'student') {
      const student = students.find(s => s.email.toLowerCase() === email.toLowerCase() || s.rollNumber.toLowerCase() === email.toLowerCase());
      if (student) {
        if (student.status === 'inactive') {
          addToast('Access Denied', 'Your student account is deactivated.', 'danger');
          return false;
        }
        if (student.password !== hashPassword(password)) {
          addToast('Authentication Failed', 'Invalid credentials.', 'danger');
          return false;
        }
        const user = { 
          role: 'student', 
          id: student.id, 
          name: student.name, 
          email: student.email, 
          rollNumber: student.rollNumber, 
          department: student.department, 
          year: student.year, 
          semester: student.semester,
          batchId: student.batchId || 'b1',
          mustResetPassword: student.mustResetPassword
        };
        setCurrentUser(user);
        logAuditEvent('login_success', student.name, 'student', `Student logged in. mustResetPassword=${student.mustResetPassword}.`);
        addToast('Login Successful', `Welcome ${student.name} to the Examination Portal.`, 'success');
        return true;
      }
    }

    logAuditEvent('login_failed', email, role, `Failed login attempt for role ${role}.`);
    addToast('Authentication Failed', 'Invalid credentials or inactive account.', 'danger');
    return false;
  };

  const resetInitialPassword = async (email, role, newPassword) => {
    if (apiActive) {
      try {
        await apiRequest('/auth/reset-password', 'POST', { email, role, newPassword });
        setCurrentUser(prev => ({ ...prev, mustResetPassword: false }));
        logAuditEvent('password_reset_completed', email, role, `Password updated successfully via API.`);
        addToast('Password Updated', 'Your security credentials have been initialized successfully.', 'success');
        return true;
      } catch (err) {
        addToast('Reset Failed', err.message, 'danger');
        return false;
      }
    }

    const hashed = hashPassword(newPassword);
    let updated = false;

    if (role === 'management') {
      setManagementAdmins(prev => prev.map(a => {
        if (a.email.toLowerCase() === email.toLowerCase()) {
          updated = true;
          return { ...a, password: hashed, mustResetPassword: false };
        }
        return a;
      }));
    } else if (role === 'student') {
      setStudents(prev => prev.map(s => {
        if (s.email.toLowerCase() === email.toLowerCase()) {
          updated = true;
          return { ...s, password: hashed, mustResetPassword: false };
        }
        return s;
      }));
    }

    if (updated) {
      setCurrentUser(prev => ({ ...prev, mustResetPassword: false }));
      logAuditEvent('password_reset_completed', email, role, `User completed first-login password reset. Account fully activated.`);
      addToast('Password Updated', 'Your security credentials have been initialized successfully.', 'success');
      triggerNotification(role, email, 'Password Set Successfully', 'You have successfully updated your account password.');
      return true;
    }
    addToast('Reset Failed', 'User not found in system registers.', 'danger');
    return false;
  };

  const activateStudent = async (email, password, otp) => {
    if (apiActive) {
      try {
        await apiRequest('/auth/activate-student', 'POST', { email, password, otp });
        addToast('Account Activated', 'Your student account is active! You can now log in.', 'success');
        return true;
      } catch (err) {
        addToast('Activation Failed', err.message, 'danger');
        return false;
      }
    }

    // Local Fallback Simulation
    const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!student) {
      addToast('Activation Failed', 'Student not found in offline registers.', 'danger');
      return false;
    }
    if (student.otp !== otp) {
      addToast('Activation Failed', 'Invalid verification code/OTP.', 'danger');
      return false;
    }

    setStudents(prev => prev.map(s => {
      if (s.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...s,
          password: hashPassword(password),
          verified: true,
          status: 'active',
          otp: null
        };
      }
      return s;
    }));

    addToast('Account Activated', 'Your student account is active (Offline)! You can now log in.', 'success');
    return true;
  };

  // Audit log helper
  const logAuditEvent = (action, actor, target, details) => {
    const entry = {
      id: uid('audit'),
      action,
      actor,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  const logout = () => {
    if (currentUser) logAuditEvent('logout', currentUser.name, 'session', `${currentUser.role} user logged out.`);
    setCurrentUser(null);
    addToast('Logged Out', 'You have been safely signed out.', 'info');
  };

  // Notification triggers
  const triggerNotification = (recipientRole, recipientId, title, message) => {
    const newNotif = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
      recipientRole,
      recipientId,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Global Super Admin Operations
  const onboardCollege = async (collegeData) => {
    const {
      college_name,
      college_code,
      college_email,
      college_phone,
      address,
      admin_name,
      admin_email
    } = collegeData;

    if (!college_name || !college_code || !college_email || !admin_name || !admin_email) {
      addToast('Validation Error', 'Missing required fields for college onboarding.', 'danger');
      return { success: false, error: 'Missing required fields.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(college_email) || !emailRegex.test(admin_email)) {
      addToast('Validation Error', 'Invalid email format.', 'danger');
      return { success: false, error: 'Invalid email format.' };
    }

    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest('/colleges', 'POST', collegeData, token);
        
        setColleges(prev => [...prev, res.college]);
        
        const newAdmin = {
          ...res.admin,
          tempPasswordDisplay: res.admin.tempPassword
        };
        setManagementAdmins(prev => [...prev, newAdmin]);
        
        addToast('College Onboarded', res.message, 'success');
        return {
          success: true,
          tempPassword: res.admin.tempPassword,
          adminEmail: res.admin.email
        };
      } catch (err) {
        addToast('Onboarding Failed', err.message, 'danger');
        return { success: false, error: err.message };
      }
    } else {
      if (colleges.some(c => c.code.toLowerCase() === college_code.toLowerCase())) {
        addToast('Validation Error', 'College code already exists.', 'danger');
        return { success: false, error: 'College code already exists.' };
      }

      if (managementAdmins.some(a => a.email.toLowerCase() === admin_email.toLowerCase())) {
        addToast('Validation Error', 'Admin email already registered.', 'danger');
        return { success: false, error: 'Admin email already registered.' };
      }

      const collegeId = uid('c');
      const newCollege = {
        id: collegeId,
        name: college_name,
        code: college_code,
        email: college_email,
        phone: college_phone || '',
        address: address || '',
        status: 'active',
        departmentCount: 0,
        examCount: 0,
        createdAt: new Date().toISOString()
      };

      const tempPassword = generateTempPassword(admin_name);
      const newAdmin = {
        id: uid('m'),
        collegeId: collegeId,
        collegeName: college_name,
        name: admin_name,
        email: admin_email,
        role: 'management', // College Admin role
        department: 'All',
        password: hashPassword(tempPassword),
        mustResetPassword: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'System',
        tempPasswordDisplay: tempPassword
      };

      setColleges(prev => [...prev, newCollege]);
      setManagementAdmins(prev => [...prev, newAdmin]);

      logAuditEvent('college_onboarded', currentUser?.name || 'System', college_name, `College ${college_name} (${college_code}) onboarded.`);
      logAuditEvent('management_account_created', currentUser?.name || 'System', admin_email, `Admin account for ${college_name} generated.`);

      sendMockEmail(
        admin_email,
        `Your College Admin Credentials - ${college_name}`,
        'account_created',
        `Dear ${admin_name},\n\nYour management dashboard account has been created for ${college_name}.\n\n=== YOUR LOGIN CREDENTIALS ===\nLogin URL: ${window.location.origin}\nEmail: ${admin_email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT: You MUST reset your password on first login.\n\nFor support: support@omniproctor.ai`
      );

      triggerNotification('management', 'global', 'New Admin Account Created', `College Admin account for ${admin_name} has been provisioned.`);
      addToast('College Onboarded', `${college_name} successfully registered.`, 'success');

      return {
        success: true,
        tempPassword,
        adminEmail: admin_email
      };
    }
  };

  const toggleCollegeStatus = (id) => {
    setColleges(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
    addToast('Status Changed', 'College activity state updated.', 'info');
  };

  const toggleStudentStatus = async (studentId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest(`/students/${studentId}/status`, 'PATCH', null, token);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
        addToast('Status Updated', res.message, 'success');
        return true;
      } catch (err) {
        addToast('Error', err.message, 'danger');
        return false;
      }
    } else {
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          const nextStatus = s.status === 'active' ? 'inactive' : 'active';
          logAuditEvent('student_status_changed', currentUser?.name || 'System', 'Student', `Changed status of student ${s.name} to ${nextStatus}.`);
          addToast('Status Updated', `Student status updated to ${nextStatus}.`, 'success');
          return { ...s, status: nextStatus };
        }
        return s;
      }));
      return true;
    }
  };

  const forceResetStudentPassword = async (studentId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const data = await apiRequest(`/students/${studentId}/force-reset`, 'POST', null, token);
        addToast('Password Reset Complete', `New password generated: ${data.tempPassword}`, 'success');
        return data.tempPassword;
      } catch (err) {
        addToast('Reset Failed', err.message, 'danger');
        return null;
      }
    } else {
      const student = students.find(s => s.id === studentId);
      if (!student) return null;
      const tempPass = generateTempPassword(student.name);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, password: hashPassword(tempPass), mustResetPassword: true } : s));
      
      sendMockEmail(
        student.email,
        'Your Credentials Have Been Reset by Administrator',
        'password_force_reset',
        `Dear ${student.name},\n\nYour account credentials have been reset.\nTemporary Password: ${tempPass}\n\nPlease reset it upon logging in.`
      );
      
      logAuditEvent('student_password_reset', currentUser?.name || 'System', 'Student', `Password force reset for ${student.name}.`);
      addToast('Password Reset Complete', `New credentials emailed to student. Temp Password: ${tempPass}`, 'success');
      return tempPass;
    }
  };

  const resendStudentCredentials = async (studentId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest(`/students/${studentId}/resend-credentials`, 'POST', null, token);
        addToast('Credentials Sent', res.message, 'success');
        return true;
      } catch (err) {
        addToast('Failed to Resend', err.message, 'danger');
        return false;
      }
    } else {
      const student = students.find(s => s.id === studentId);
      if (!student) return false;
      sendMockEmail(
        student.email,
        'OmniProctor Account Credentials - Reminder',
        'student_registration_reminder',
        `Dear ${student.name},\n\nThis is a reminder of your student account credentials for the OmniProctor platform.\n\nUsername/Roll Number: ${student.rollNumber}\nEmail: ${student.email}\nCollege: ${student.collegeName}`
      );
      addToast('Credentials Resent', `Welcome credential reminder email queued for ${student.name}.`, 'success');
      return true;
    }
  };

  const toggleManagementAdminStatus = async (adminId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const admin = managementAdmins.find(a => a.id === adminId);
        if (admin) {
          const res = await apiRequest(`/colleges/${admin.collegeId}/status`, 'PATCH', null, token);
          setManagementAdmins(prev => prev.map(a => a.id === adminId ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));
          addToast('Admin Status Updated', res.message, 'success');
        }
        return true;
      } catch (err) {
        addToast('Error', err.message, 'danger');
        return false;
      }
    } else {
      setManagementAdmins(prev => prev.map(a => {
        if (a.id === adminId) {
          const nextStatus = a.status === 'active' ? 'inactive' : 'active';
          logAuditEvent('admin_status_changed', currentUser?.name || 'System', 'Admin', `Changed status of college admin ${a.name} to ${nextStatus}.`);
          addToast('Status Updated', `College Admin status updated to ${nextStatus}.`, 'success');
          return { ...a, status: nextStatus };
        }
        return a;
      }));
      return true;
    }
  };

  const forceResetManagementAdminPassword = async (adminId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const data = await apiRequest(`/colleges/admins/${adminId}/force-reset`, 'POST', null, token);
        addToast('Password Reset Complete', `New password generated: ${data.tempPassword}`, 'success');
        return data.tempPassword;
      } catch (err) {
        addToast('Reset Failed', err.message, 'danger');
        return null;
      }
    } else {
      const admin = managementAdmins.find(a => a.id === adminId);
      if (!admin) return null;
      const tempPass = generateTempPassword(admin.name);
      setManagementAdmins(prev => prev.map(a => a.id === adminId ? { ...a, password: hashPassword(tempPass), mustResetPassword: true } : a));
      
      sendMockEmail(
        admin.email,
        'Your Credentials Have Been Reset by Super Administrator',
        'password_force_reset',
        `Dear ${admin.name},\n\nYour account credentials have been reset.\nTemporary Password: ${tempPass}\n\nPlease reset it upon logging in.`
      );
      
      logAuditEvent('admin_password_reset', currentUser?.name || 'System', 'Admin', `Password force reset for ${admin.name}.`);
      addToast('Password Reset Complete', `New credentials emailed to admin. Temp Password: ${tempPass}`, 'success');
      return tempPass;
    }
  };

  const resendManagementAdminCredentials = async (adminId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest(`/colleges/admins/${adminId}/resend-credentials`, 'POST', null, token);
        addToast('Credentials Resent', res.message, 'success');
        return true;
      } catch (err) {
        addToast('Resend Failed', err.message, 'danger');
        return false;
      }
    } else {
      const admin = managementAdmins.find(a => a.id === adminId);
      if (!admin) return false;
      sendMockEmail(
        admin.email,
        'OmniProctor Institution Admin Credentials - Reminder',
        'college_admin_reminder',
        `Dear ${admin.name},\n\nThis is a reminder of your administrator credentials for college: ${admin.collegeName}.\nUsername: ${admin.email}`
      );
      addToast('Credentials Resent', `Welcome credential reminder email queued for ${admin.name}.`, 'success');
      return true;
    }
  };

  // Student registration flow
  const registerStudent = async (studentData) => {
    if (apiActive) {
      try {
        const data = await apiRequest('/auth/register', 'POST', {
          fullName: studentData.fullName,
          email: studentData.email,
          rollNumber: studentData.rollNumber,
          branch: studentData.branch,
          year: studentData.year,
          mobileNumber: studentData.mobileNumber,
          gender: studentData.gender,
          collegeId: studentData.collegeId,
          password: studentData.password
        });
        addToast('Registration Initiated', 'Verification OTP sent to your email.', 'success');
        return { success: true, api: true };
      } catch (err) {
        addToast('Registration Failed', err.message, 'danger');
        return { success: false, message: err.message };
      }
    }

    // Validate duplicate roll numbers
    if (students.some(s => s.rollNumber.toLowerCase() === studentData.rollNumber.toLowerCase())) {
      addToast('Registration Error', 'Roll number already registered.', 'danger');
      return { success: false, message: 'Roll number already registered.' };
    }
    // Validate duplicate emails
    if (students.some(s => s.email.toLowerCase() === studentData.email.toLowerCase())) {
      addToast('Registration Error', 'Email already registered.', 'danger');
      return { success: false, message: 'Email already registered.' };
    }
    // Validate invalid college
    const college = colleges.find(c => c.id === studentData.collegeId);
    if (!college) {
      addToast('Registration Error', 'Selected college does not exist.', 'danger');
      return { success: false, message: 'Selected college does not exist.' };
    }

    const hashedPassword = hashPassword(studentData.password);
    
    // roll number becomes default user_id!
    const studentId = studentData.rollNumber;
    
    const newStudent = {
      id: studentId,
      name: studentData.fullName,
      email: studentData.email,
      rollNumber: studentData.rollNumber,
      collegeId: studentData.collegeId,
      collegeName: college.name,
      branch: studentData.branch,
      year: studentData.year,
      mobileNumber: studentData.mobileNumber,
      gender: studentData.gender,
      section: studentData.section,
      semester: studentData.semester,
      dateOfBirth: studentData.dateOfBirth,
      profilePhoto: studentData.profilePhoto,
      password: hashedPassword,
      mustResetPassword: false,
      githubProfile: studentData.githubProfile || '',
      linkedinProfile: studentData.linkedinProfile || '',
      status: 'active',
      verified: true,
      batchId: 'b1', // assign a default batch
      createdAt: new Date().toISOString()
    };

    setStudents(prev => [...prev, newStudent]);

    logAuditEvent('student_registered', studentData.fullName, studentId, `Student self-registered with roll number: ${studentData.rollNumber}`);

    sendMockEmail(
      newStudent.email,
      'Welcome to OmniProctor - Registration Successful',
      'student_registration',
      `Dear ${newStudent.name},\n\nYour self-registration is successful!\n\nUser ID (Roll Number): ${newStudent.id}\nEmail: ${newStudent.email}\nCollege: ${college.name}\n\nYou can now log in using your Roll Number and password.\n\nBest regards,\nOmniProctor.ai Team`
    );

    addToast('Registration Successful', 'Your account has been created. You can now log in.', 'success');
    return { success: true, api: false };
  };

  const verifyStudentOtp = async (email, otp) => {
    if (apiActive) {
      try {
        await apiRequest('/auth/verify-otp', 'POST', { email, otp });
        addToast('Verification Success', 'Your account is activated! You can now log in.', 'success');
        return { success: true };
      } catch (err) {
        addToast('Verification Failed', err.message, 'danger');
        return { success: false, message: err.message };
      }
    }

    addToast('Verification Success', 'Account activated (Offline simulation)!', 'success');
    return { success: true };
  };

  // Management Add Admin Account (Legacy manually-added sub-admins)
  const addManagementAdmin = (adminData) => {
    if (!adminData.name || !adminData.email) {
      addToast('Validation Error', 'Name and email are required.', 'danger');
      return;
    }
    if (managementAdmins.some(a => a.email.toLowerCase() === adminData.email.toLowerCase())) {
      addToast('Validation Error', 'Email already registered as administrator.', 'danger');
      return;
    }
    const tempPassword = generateTempPassword(adminData.name);
    const newAdmin = {
      id: uid('m'),
      name: adminData.name,
      email: adminData.email,
      department: adminData.department || 'All',
      password: hashPassword(tempPassword),
      mustResetPassword: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'System',
      tempPasswordDisplay: tempPassword
    };
    setManagementAdmins(prev => [...prev, newAdmin]);

    logAuditEvent('management_account_created', currentUser?.name || 'System', newAdmin.email, `Management admin "${newAdmin.name}" created with temp password. mustResetPassword=true.`);

    sendMockEmail(
      newAdmin.email,
      'Your Institution Admin Credentials',
      'account_created',
      `Dear ${newAdmin.name},\n\nYour management dashboard account has been created.\n\n=== YOUR LOGIN CREDENTIALS ===\nLogin URL: ${window.location.origin}\nEmail: ${newAdmin.email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT: You MUST reset your password on first login.\n\nFor support: support@omniproctor.ai`
    );

    triggerNotification('management', 'global', 'New Admin Account Created', `Management account for ${newAdmin.name} (${newAdmin.email}) has been provisioned.`);
    addToast('Admin Registered', `Management account generated for ${newAdmin.name}. Temp password: ${tempPassword}`, 'success');
  };

  // Management Departments
  const addDepartment = (deptName, deptCode) => {
    if (!deptName || !deptCode) {
      addToast('Validation Error', 'Department name and code are required.', 'danger');
      return;
    }
    if (departments.some(d => d.code.toUpperCase() === deptCode.toUpperCase() || d.name.toLowerCase() === deptName.toLowerCase())) {
      addToast('Validation Error', 'Department already exists.', 'danger');
      return;
    }
    const newDept = {
      id: uid('dept'),
      name: deptName,
      code: deptCode.toUpperCase()
    };
    setDepartments(prev => [...prev, newDept]);
    logAuditEvent('department_created', currentUser?.name || 'System', deptName, `Department ${deptName} (${deptCode}) created.`);
    addToast('Department Created', `Successfully created ${deptName} (${deptCode}).`, 'success');
  };

  // Management Batches
  const createBatch = (name, department) => {
    if (!name || !department) {
      addToast('Validation Error', 'Batch name and department are required.', 'danger');
      return;
    }
    if (batches.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      addToast('Validation Error', 'Batch already exists.', 'danger');
      return;
    }
    const newBatch = {
      id: uid('b'),
      name,
      department,
      students: []
    };
    setBatches(prev => [...prev, newBatch]);
    logAuditEvent('batch_created', currentUser?.name || 'System', name, `Batch "${name}" created for ${department}.`);
    addToast('Batch Created', `Batch "${name}" created for ${department}.`, 'success');
  };

  // Management Operations (Create user, Bulk Upload, Schedule Exam)
  const addStudent = (studentData) => {
    if (!studentData.name || !studentData.email || !studentData.rollNumber) {
      addToast('Validation Error', 'Missing required student fields.', 'danger');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      addToast('Validation Error', 'Invalid email format.', 'danger');
      return;
    }
    if (students.some(s => s.email.toLowerCase() === studentData.email.toLowerCase())) {
      addToast('Validation Error', 'Email already registered.', 'danger');
      return;
    }
    if (students.some(s => s.rollNumber.toLowerCase() === studentData.rollNumber.toLowerCase())) {
      addToast('Validation Error', 'Roll number already registered.', 'danger');
      return;
    }

    const tempPassword = generateTempPassword(studentData.name);
    const newStudent = {
      id: uid('s'),
      name: studentData.name,
      email: studentData.email,
      rollNumber: studentData.rollNumber,
      department: studentData.department,
      year: studentData.year || '1st Year',
      semester: '1st Semester',
      status: 'active',
      batchId: studentData.batchId || 'b1',
      password: hashPassword(tempPassword),
      mustResetPassword: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'System',
      tempPasswordDisplay: tempPassword
    };

    setStudents(prev => [...prev, newStudent]);

    // Assign to batch
    setBatches(prev => prev.map(b => b.id === newStudent.batchId ? {
      ...b,
      students: [...b.students, newStudent.id]
    } : b));

    logAuditEvent('student_account_created', currentUser?.name || 'System', newStudent.email, `Student "${newStudent.name}" (${newStudent.rollNumber}) created with temp password. mustResetPassword=true. Batch: ${newStudent.batchId}.`);

    sendMockEmail(
      newStudent.email,
      'Your OmniStudent.ai Credentials',
      'account_created',
      `Dear ${newStudent.name},\n\nYour student examination account has been created.\n\n=== YOUR LOGIN CREDENTIALS ===\nLogin URL: ${window.location.origin}\nEmail: ${newStudent.email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT: You MUST reset your password on first login.\n\nFor support: support@omniproctor.ai`
    );

    triggerNotification('management', 'global', 'Student Account Provisioned', `Student account for ${newStudent.name} (${newStudent.rollNumber}) has been created.`);
    addToast('Student Registered', `Account created for ${studentData.name}. Temp password: ${tempPassword}`, 'success');
  };

  const processBulkUpload = (fileType, dataString) => {
    try {
      const rows = dataString.split('\n')
        .map(row => row.split(',').map(cell => cell.trim()))
        .filter(row => row.length > 0 && row.some(cell => cell !== ''));

      if (rows.length < 2) throw new Error('File contains no data records.');

      const headers = rows[0].map(h => h.toLowerCase());
      const records = [];
      const rowErrors = [];
      let duplicates = 0;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (fileType === 'student') {
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('number'));
        const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department'));
        const yearIdx = headers.findIndex(h => h.includes('year'));
        const batchIdx = headers.findIndex(h => h.includes('batch'));

        if (nameIdx === -1 || emailIdx === -1 || rollIdx === -1) {
          throw new Error('Required columns: Name, Email, Roll Number are missing.');
        }

        const newBatchesToCreate = [];

        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const name = rowData[nameIdx];
          const email = rowData[emailIdx];
          const roll = rowData[rollIdx];
          const dept = deptIdx !== -1 ? rowData[deptIdx] : 'Computer Science & Engineering';
          const year = yearIdx !== -1 ? rowData[yearIdx] : '3rd Year';
          const batchName = batchIdx !== -1 ? rowData[batchIdx] : 'CSE-A';

          if (!name || !email || !roll) {
            rowErrors.push({ row: i + 1, error: 'Empty values in mandatory columns Name/Email/Roll' });
            continue;
          }

          if (!emailRegex.test(email)) {
            rowErrors.push({ row: i + 1, error: `Invalid email structure: ${email}` });
            continue;
          }

          const existingDb = students.some(s => s.email.toLowerCase() === email.toLowerCase() || s.rollNumber.toLowerCase() === roll.toLowerCase());
          const existingPending = records.some(r => r.email.toLowerCase() === email.toLowerCase() || r.rollNumber.toLowerCase() === roll.toLowerCase());

          if (existingDb || existingPending) {
            duplicates++;
            rowErrors.push({ row: i + 1, error: `Duplicate email or roll number: ${email} / ${roll}` });
            continue;
          }

          // Check if batch exists (in state or accumulated local list), otherwise schedule creation
          let batch = batches.find(b => b.name.toLowerCase() === batchName.toLowerCase()) ||
                      newBatchesToCreate.find(b => b.name.toLowerCase() === batchName.toLowerCase());
          let bId;
          if (batch) {
            bId = batch.id;
          } else {
            bId = 'b_dyn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            newBatchesToCreate.push({
              id: bId,
              name: batchName,
              department: dept,
              students: []
            });
            // Automate department creation if it doesn't exist
            const deptLower = dept.toLowerCase();
            const deptExists = departments.some(d => d.name.toLowerCase() === deptLower || d.code.toLowerCase() === deptLower);
            if (!deptExists) {
              const code = dept.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
              const newDept = {
                id: 'dept_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                name: dept,
                code
              };
              setDepartments(prev => [...prev, newDept]);
            }
          }

          const tempPass = generateTempPassword(name);

          records.push({
            id: 's' + (students.length + records.length + 1),
            name,
            email,
            rollNumber: roll,
            department: dept,
            year,
            semester: '1st Semester',
            status: 'active',
            batchId: bId,
            password: hashPassword(tempPass),
            tempPasswordCleartext: tempPass,
            mustResetPassword: true
          });
        }

        if (records.length > 0) {
          if (newBatchesToCreate.length > 0) {
            newBatchesToCreate.forEach(nb => {
              nb.students = records.filter(r => r.batchId === nb.id).map(r => r.id);
            });
            setBatches(prev => [...prev, ...newBatchesToCreate]);
          }
          setStudents(prev => [...prev, ...records.map(({ tempPasswordCleartext, ...r }) => r)]);
          setBatches(prev => prev.map(b => {
            const addedStuds = records.filter(r => r.batchId === b.id).map(r => r.id);
            return addedStuds.length > 0 ? { ...b, students: [...b.students, ...addedStuds] } : b;
          }));

          records.forEach(r => {
            sendMockEmail(
              r.email,
              'Your Assessment Portal Credentials',
              'account_created',
              `Dear ${r.name},\n\nYour account has been setup via bulk import.\nEmail: ${r.email}\nTemporary Password: ${r.tempPasswordCleartext}\nLogin URL: http://localhost:5173/\n\nPlease log in and update your password on first entry.`
            );
          });
        }

      } else if (fileType === 'question') {
        const qIdx = headers.findIndex(h => h.includes('question'));
        const optAIdx = headers.findIndex(h => h.includes('option a') || h.includes('opt a'));
        const optBIdx = headers.findIndex(h => h.includes('option b') || h.includes('opt b'));
        const optCIdx = headers.findIndex(h => h.includes('option c') || h.includes('opt c'));
        const optDIdx = headers.findIndex(h => h.includes('option d') || h.includes('opt d'));
        const ansIdx = headers.findIndex(h => h.includes('answer') || h.includes('correct'));
        const diffIdx = headers.findIndex(h => h.includes('diff') || h.includes('difficulty'));
        const subjIdx = headers.findIndex(h => h.includes('subject'));

        if (qIdx === -1 || optAIdx === -1 || ansIdx === -1) {
          throw new Error('Required columns: Question, Option A, Correct Answer are missing.');
        }

        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const qText = rowData[qIdx];
          const optA = rowData[optAIdx];
          const optB = optBIdx !== -1 ? rowData[optBIdx] : '';
          const optC = optCIdx !== -1 ? rowData[optCIdx] : '';
          const optD = optDIdx !== -1 ? rowData[optDIdx] : '';
          const ans = rowData[ansIdx] ? rowData[ansIdx].toUpperCase() : 'A';
          const difficulty = diffIdx !== -1 ? rowData[diffIdx] : 'Medium';
          const subject = subjIdx !== -1 ? rowData[subjIdx] : 'General';

          if (!qText || !optA) {
            rowErrors.push({ row: i + 1, error: 'Empty Question Text or Option A' });
            continue;
          }

          records.push({
            id: 'q' + (questions.length + records.length + 1),
            subject,
            topic: 'Imported',
            type: 'mcq',
            difficulty,
            questionText: qText,
            options: [
              { key: 'A', text: optA },
              { key: 'B', text: optB },
              { key: 'C', text: optC },
              { key: 'D', text: optD }
            ],
            correctAnswer: ans
          });
        }

        if (records.length > 0) {
          setQuestions(prev => [...prev, ...records]);
        }
      }

      const importedCount = records.length;
      if (importedCount > 0) {
        addToast('Import Completed', `Imported ${importedCount} records. Duplicate warnings: ${duplicates}.`, 'success');
      } else {
        addToast('Import Flagged', 'No new records could be saved.', 'warning');
      }

      return {
        success: true,
        count: importedCount,
        duplicates,
        errors: rowErrors
      };

    } catch (err) {
      addToast('Upload Rejected', err.message, 'danger');
      return { success: false, error: err.message, errors: [] };
    }
  };

  const scheduleExam = async (examData) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest('/exams', 'POST', examData, token);
        setExams(prev => [...prev, res.exam]);
        addToast('Exam Created', `Exam successfully created as draft.`, 'success');
        return res.exam;
      } catch (err) {
        addToast('Creation Failed', err.message, 'danger');
        throw err;
      }
    } else {
      const newExam = {
        id: uid('e'),
        title: examData.title,
        subject: examData.subject,
        questionPaperId: examData.questionPaperId,
        questions: examData.questions || [],
        duration: parseInt(examData.duration) || 60,
        total_marks: examData.total_marks || 100,
        negativeMarking: parseFloat(examData.negativeMarking) || 0,
        randomized: examData.randomized ?? true,
        attemptLimit: parseInt(examData.attemptLimit) || 1,
        passCutoff: parseInt(examData.passCutoff) || 40,
        branchFilter: examData.branchFilter || '',
        yearFilter: examData.yearFilter || '',
        assignedStudents: examData.assignedStudents || [],
        windowStart: examData.windowStart || new Date().toISOString().slice(0, 16),
        windowEnd: examData.windowEnd || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        fullscreenRequired: examData.fullscreenRequired ?? true,
        aiProctoringEnabled: examData.aiProctoringEnabled ?? true,
        collegeId: currentUser.collegeId || 'c1',
        status: examData.status || 'draft',
        creator: currentUser.name,
        publishedResults: false,
        createdAt: new Date().toISOString()
      };
      setExams(prev => [...prev, newExam]);
      if (newExam.status === 'published') {
        students.forEach(stud => {
          const matchesCollege = stud.collegeId === newExam.collegeId;
          const isAssigned = newExam.assignedStudents && newExam.assignedStudents.length > 0
            ? (newExam.assignedStudents.includes(stud.id) || newExam.assignedStudents.includes(stud.rollNumber))
            : (!newExam.branchFilter || stud.branch === newExam.branchFilter) && (!newExam.yearFilter || stud.year === newExam.yearFilter);
          if (matchesCollege && isAssigned) {
            triggerNotification('student', stud.id, 'New Exam Assigned', `Exam "${newExam.title}" is published for your branch (${newExam.branchFilter || 'All'}) and year (${newExam.yearFilter || 'All'}).`);
          }
        });
      }
      addToast('Exam Configured', `Examination scheduled and saved.`, 'success');
      return newExam;
    }
  };

  const publishExam = async (examId) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest(`/exams/${examId}/publish-exam`, 'PATCH', null, token);
        setExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'published' } : e));
        addToast('Exam Published', 'Exam is now active and visible to students.', 'success');
        return res.exam;
      } catch (err) {
        addToast('Publishing Failed', err.message, 'danger');
        throw err;
      }
    } else {
      setExams(prev => prev.map(e => {
        if (e.id === examId) {
          const updated = { ...e, status: 'published' };
          students.forEach(stud => {
            const matchesCollege = stud.collegeId === updated.collegeId;
            const isAssigned = updated.assignedStudents && updated.assignedStudents.length > 0
              ? (updated.assignedStudents.includes(stud.id) || updated.assignedStudents.includes(stud.rollNumber))
              : (!updated.branchFilter || stud.branch === updated.branchFilter) && (!updated.yearFilter || stud.year === updated.yearFilter);
            if (matchesCollege && isAssigned) {
              triggerNotification('student', stud.id, 'New Exam Assigned', `Exam "${updated.title}" is published for you.`);
            }
          });
          return updated;
        }
        return e;
      }));
      addToast('Exam Published', 'Exam is now active and visible to students.', 'success');
    }
  };

  const publishExamResults = (examId) => {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, publishedResults: true } : e));
    addToast('Results Published', 'Scores are now visible on student portals.', 'success');

    attempts.forEach(att => {
      if (att.examId === examId) {
        triggerNotification('student', att.studentId, 'Exam Results Published', `Results for exam are now available.`);
        const stud = students.find(s => s.id === att.studentId);
        if (stud) {
          sendMockEmail(
            stud.email,
            'Examination Results Published',
            'result_published',
            `Dear ${stud.name},\n\nYour results for the exam are published.\nYour Score: ${att.score}`
          );
        }
      }
    });
  };

  const forceTerminateExam = (attemptId, studentName, reason) => {
    setAttempts(prev => prev.map(att => att.id === attemptId ? { 
      ...att, 
      status: 'terminated', 
      endTime: new Date().toISOString(), 
      terminationReason: reason 
    } : att));

    addToast('Exam Terminated', `Proctor terminated exam for ${studentName}.`, 'warning');
    
    logFraudEvent(
      attempts.find(a => a.id === attemptId)?.examId || 'unknown',
      attempts.find(a => a.id === attemptId)?.studentId || 'unknown',
      studentName,
      'Proctor Manual Override',
      reason,
      'danger',
      true
    );

    const att = attempts.find(a => a.id === attemptId);
    if (att) {
      const student = students.find(s => s.id === att.studentId);
      if (student) {
        sendMockEmail(
          student.email,
          'Exam Terminated - Violations Flagged',
          'exam_terminated',
          `Dear ${student.name},\n\nYour exam was force-terminated by the proctor due to: ${reason}`
        );
      }
    }
  };

  // Question Bank Operations
  const addQuestion = async (questionData) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest('/exams/questions', 'POST', questionData, token);
        setQuestions(prev => [...prev, res]);
        addToast('Question Saved', 'Question added to active question bank.', 'success');
        return res;
      } catch (err) {
        addToast('Save Failed', err.message, 'danger');
        throw err;
      }
    } else {
      const newQ = {
        id: uid('q'),
        ...questionData,
        marks: parseFloat(questionData.marks) || 1,
        createdAt: new Date().toISOString()
      };
      setQuestions(prev => [...prev, newQ]);
      addToast('Question Saved', 'Question added to active question bank.', 'success');
      return newQ;
    }
  };

  const editQuestion = async (id, questionData) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest(`/exams/questions/${id}`, 'PUT', questionData, token);
        setQuestions(prev => prev.map(q => q.id === id ? res : q));
        addToast('Question Updated', 'Question details saved successfully.', 'success');
        return res;
      } catch (err) {
        addToast('Update Failed', err.message, 'danger');
        throw err;
      }
    } else {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...questionData } : q));
      addToast('Question Updated', 'Question details saved successfully.', 'success');
    }
  };

  const deleteQuestion = async (id) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        await apiRequest(`/exams/questions/${id}`, 'DELETE', null, token);
        setQuestions(prev => prev.filter(q => q.id !== id));
        addToast('Question Deleted', 'Question removed from question bank.', 'warning');
      } catch (err) {
        addToast('Deletion Failed', err.message, 'danger');
        throw err;
      }
    } else {
      setQuestions(prev => prev.filter(q => q.id !== id));
      addToast('Question Deleted', 'Question removed from question bank.', 'warning');
    }
  };

  const bulkImportQuestions = async (rawQuestions) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest('/exams/questions/bulk', 'POST', { questions: rawQuestions }, token);
        setQuestions(prev => [...prev, ...res.questions]);
        addToast('Import Successful', `Successfully imported ${res.count} questions.`, 'success');
        return res;
      } catch (err) {
        addToast('Import Failed', err.message, 'danger');
        throw err;
      }
    } else {
      const errors = [];
      const valid = [];
      rawQuestions.forEach((q, i) => {
        const rowNum = i + 1;
        if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer || !q.difficulty || !q.subject) {
          errors.push({ row: rowNum, error: 'Missing required columns.' });
          return;
        }
        const cleanAnswer = q.correct_answer.toString().trim().toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(cleanAnswer)) {
          errors.push({ row: rowNum, error: `Invalid Correct Answer: ${cleanAnswer}` });
          return;
        }
        valid.push({
          id: uid('q'),
          questionText: q.question,
          options: [
            { key: 'A', text: q.option_a },
            { key: 'B', text: q.option_b },
            { key: 'C', text: q.option_c },
            { key: 'D', text: q.option_d }
          ],
          correctAnswer: cleanAnswer,
          difficulty: q.difficulty,
          subject: q.subject,
          topic: q.topic || 'General',
          branch: q.branch || 'CSE',
          marks: parseFloat(q.marks) || 1,
          createdAt: new Date().toISOString()
        });
      });
      if (errors.length > 0) {
        throw new Error(`Validation failed with ${errors.length} errors.`);
      }
      setQuestions(prev => [...prev, ...valid]);
      addToast('Import Successful', `Successfully imported ${valid.length} questions.`, 'success');
      return { count: valid.length, questions: valid };
    }
  };

  // Question Paper Builder
  const addQuestionPaper = async (paperData) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await apiRequest('/exams/question-papers', 'POST', paperData, token);
        setQuestionPapers(prev => [...prev, res]);
        addToast('Paper Saved', 'Question paper saved successfully.', 'success');
        return res;
      } catch (err) {
        addToast('Save Failed', err.message, 'danger');
        throw err;
      }
    } else {
      const newPaper = {
        id: uid('qp'),
        title: paperData.title,
        subject: paperData.subject,
        questions: paperData.questions,
        questionMarks: paperData.questionMarks,
        totalMarks: paperData.totalMarks,
        status: paperData.status || 'draft',
        createdAt: new Date().toISOString()
      };
      setQuestionPapers(prev => [...prev, newPaper]);
      addToast('Paper Saved', 'Question paper saved successfully.', 'success');
      return newPaper;
    }
  };

  const deleteQuestionPaper = async (id) => {
    if (apiActive) {
      try {
        const token = localStorage.getItem('access_token');
        await apiRequest(`/exams/question-papers/${id}`, 'DELETE', null, token);
        setQuestionPapers(prev => prev.filter(p => p.id !== id));
        addToast('Paper Deleted', 'Question paper deleted successfully.', 'warning');
      } catch (err) {
        addToast('Deletion Failed', err.message, 'danger');
        throw err;
      }
    } else {
      setQuestionPapers(prev => prev.filter(p => p.id !== id));
      addToast('Paper Deleted', 'Question paper deleted successfully.', 'warning');
    }
  };

  const parseQuestionUpload = async (subject, topic, rawContent) => {
    try {
      const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
      let count = 0;
      const added = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          const qText = parts[0];
          const optA = parts[1];
          const optB = parts[2];
          const optC = parts[3];
          const optD = parts[4];
          const correct = parts[5].toUpperCase();

          const q = await addQuestion({
            subject,
            topic,
            type: 'mcq',
            difficulty: idx % 3 === 0 ? 'Easy' : (idx % 3 === 1 ? 'Medium' : 'Hard'),
            questionText: qText,
            options: [
              { key: 'A', text: optA },
              { key: 'B', text: optB },
              { key: 'C', text: optC },
              { key: 'D', text: optD }
            ],
            correctAnswer: correct,
            marks: 1
          });
          added.push(q);
          count++;
        }
      }

      if (count > 0) {
        addToast('MCQ Extraction Complete', `AI successfully extracted ${count} MCQs from file.`, 'success');
      } else {
        addToast('Extraction Failed', 'Format mismatch. Format: Question|A|B|C|D|Correct', 'warning');
      }

      return added;
    } catch (err) {
      addToast('AI Parsing Failure', 'Unable to structure questions automatically.', 'danger');
      return [];
    }
  };

  const generateAIQuestions = async (subject, topic, count, difficulty, fileContent = null) => {
    const sampleQuestions = [
      {
        questionText: `What is the primary role of the objective function in ${topic}?`,
        options: [
          { key: 'A', text: 'To represent target predictions' },
          { key: 'B', text: 'To quantify the performance or cost that needs minimization or maximization' },
          { key: 'C', text: 'To filter input parameters and features' },
          { key: 'D', text: 'To manage memory during optimization run' }
        ],
        correctAnswer: 'B'
      },
      {
        questionText: `Which of the following describes overfitting in the context of ${subject} (${topic})?`,
        options: [
          { key: 'A', text: 'Model performs poorly on both training and test datasets' },
          { key: 'B', text: 'Model performs exceptionally on test datasets but fails training datasets' },
          { key: 'C', text: 'Model fits the training data too closely, capturing noise and failing to generalize' },
          { key: 'D', text: 'Model has insufficient parameters to represent the mathematical mapping' }
        ],
        correctAnswer: 'C'
      },
      {
        questionText: `In ${topic}, what is the significance of hyperparameter tuning?`,
        options: [
          { key: 'A', text: 'It automates database connection handling' },
          { key: 'B', text: 'It optimizes model parameters that are not directly learned during training' },
          { key: 'C', text: 'It increases the processing bandwidth of hardware servers' },
          { key: 'D', text: 'It converts structured data records into unstructured text format' }
        ],
        correctAnswer: 'B'
      },
      {
        questionText: `Which algorithm is best suited for classifying high-dimensional non-linear boundaries within ${topic}?`,
        options: [
          { key: 'A', text: 'Linear Regression' },
          { key: 'B', text: 'Naive Bayes Classifier' },
          { key: 'C', text: 'Support Vector Machines with Kernel Tricks' },
          { key: 'D', text: 'Single-Layer Perceptron model' }
        ],
        correctAnswer: 'C'
      },
      {
        questionText: `What optimization method is most commonly utilized in ${topic} deep learning models?`,
        options: [
          { key: 'A', text: 'Gradient Descent and its variations (Adam, SGD)' },
          { key: 'B', text: 'Bubble sort optimization' },
          { key: 'C', text: 'Static heuristic branching' },
          { key: 'D', text: 'Matrix dimension inversion' }
        ],
        correctAnswer: 'A'
      }
    ];

    const numToGen = Math.min(count, sampleQuestions.length);
    const generated = [];

    for (let i = 0; i < numToGen; i++) {
      const q = await addQuestion({
        subject,
        topic,
        type: 'mcq',
        difficulty,
        questionText: fileContent ? `[AI Extracted from Notes] ${sampleQuestions[i].questionText}` : sampleQuestions[i].questionText,
        options: sampleQuestions[i].options,
        correctAnswer: sampleQuestions[i].correctAnswer,
        marks: 1
      });
      generated.push(q);
    }

    addToast('AI Generation Complete', `Generated ${generated.length} ${difficulty} questions for ${topic}.`, 'success');
    return generated;
  };

  // Student Proctoring & Exam Operations
  const submitExamAttempt = (examId, studentId, studentName, userAnswers, violationsCount, isTerminated = false, termReason = '', isOngoing = false) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    exam.questions.forEach(qId => {
      const q = questions.find(qu => qu.id === qId);
      if (q) {
        const studentAns = userAnswers[qId];
        if (!studentAns) {
          skipped++;
        } else if (studentAns === q.correctAnswer) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    const posMarks = correct * 1.0;
    const negMarks = wrong * (exam.negativeMarking || 0);
    const score = Math.max(0, posMarks - negMarks);

    // Look for existing ongoing attempt
    const existingIndex = attempts.findIndex(att => att.examId === examId && att.studentId === studentId && att.status === 'ongoing');

    const attemptData = {
      examId,
      studentId,
      studentName,
      score: parseFloat(score.toFixed(2)),
      totalQuestions: exam.questions.length,
      correctAnswers: correct,
      wrongAnswers: wrong,
      skippedAnswers: skipped,
      status: isOngoing ? 'ongoing' : (isTerminated ? 'terminated' : 'completed'),
      violationsCount,
      terminationReason: isTerminated ? termReason : null
    };

    if (existingIndex !== -1) {
      let updatedAttempt;
      setAttempts(prev => {
        const list = [...prev];
        updatedAttempt = {
          ...list[existingIndex],
          ...attemptData,
          endTime: isOngoing ? null : new Date().toISOString()
        };
        list[existingIndex] = updatedAttempt;
        return list;
      });

      if (!isOngoing) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          if (isTerminated) {
            triggerNotification(
              'management',
              'global',
              'Exam Terminated Due to Malpractice',
              `Student ${studentName} was terminated from "${exam.title}" due to: ${termReason}.`
            );
            sendMockEmail(
              student.email,
              'Exam Attempt Terminated - Malpractice',
              'exam_terminated',
              `Dear ${student.name},\n\nYour attempt on "${exam.title}" was terminated.\nReason: ${termReason}`
            );
          } else {
            triggerNotification(
              'management',
              'global',
              'Exam Completed',
              `Student ${studentName} successfully submitted and completed "${exam.title}".`
            );
            sendMockEmail(
              student.email,
              'Exam Submission Recorded',
              'exam_submitted',
              `Dear ${student.name},\n\nWe have successfully received your answers for: ${exam.title}. Results will be published by your administrator.`
            );
          }
        }
      }

      return updatedAttempt;
    } else {
      const newAttempt = {
        id: uid('att'),
        ...attemptData,
        startTime: new Date().toISOString(),
        endTime: isOngoing ? null : new Date().toISOString()
      };
      
      setAttempts(prev => [...prev, newAttempt]);

      if (!isOngoing) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          if (isTerminated) {
            triggerNotification(
              'management',
              'global',
              'Exam Terminated Due to Malpractice',
              `Student ${studentName} was terminated from "${exam.title}" due to: ${termReason}.`
            );
            sendMockEmail(
              student.email,
              'Exam Attempt Terminated - Malpractice',
              'exam_terminated',
              `Dear ${student.name},\n\nYour attempt on "${exam.title}" was terminated.\nReason: ${termReason}`
            );
          } else {
            triggerNotification(
              'management',
              'global',
              'Exam Completed',
              `Student ${studentName} successfully submitted and completed "${exam.title}".`
            );
            sendMockEmail(
              student.email,
              'Exam Submission Recorded',
              'exam_submitted',
              `Dear ${student.name},\n\nWe have successfully received your answers for: ${exam.title}. Results will be published by your administrator.`
            );
          }
        }
      }

      return newAttempt;
    }
  };

  // Proctoring Violations Log
  const logFraudEvent = (examId, studentId, studentName, eventType, description, severity = 'warning', immediateTerminate = false) => {
    const newEvent = {
      id: 'fe_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      examId,
      studentId,
      studentName,
      eventType,
      description,
      severity,
      timestamp: new Date().toISOString(),
      evidenceSnapshot: null
    };

    setFraudEvents(prev => [newEvent, ...prev]);

    if (severity === 'danger' || immediateTerminate) {
      addToast('Security Alert', `${eventType} detected! High-risk violation logged.`, 'danger');
    } else {
      addToast('Proctor Warning', description, 'warning');
    }

    // Trigger real-time management notification
    triggerNotification(
      'management',
      'global',
      `Security Alert: ${studentName}`,
      `${eventType} detected: ${description}`
    );

    const student = students.find(s => s.id === studentId);
    if (student && severity === 'danger') {
      sendMockEmail(
        student.email,
        `Proctor Security Alert: ${eventType}`,
        'fraud_alert',
        `Dear ${student.name},\n\nOur intelligent proctoring agent detected a violation during your ongoing exam.\nEvent: ${eventType}\nDescription: ${description}`
      );
    }
  };

  // Helper to attach webcam snapshots to the latest fraud event
  const attachEvidenceSnapshot = (snapshotBase64) => {
    setFraudEvents(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], evidenceSnapshot: snapshotBase64 };
      return updated;
    });
  };

  return (
    <PlatformContext.Provider value={{
      currentUser,
      colleges,
      departments,
      batches,
      managementAdmins,
      students,
      questions,
      questionPapers,
      exams,
      attempts,
      fraudEvents,
      notifications,
      emailLogs,
      emailQueue,
      auditLogs,
      smtpHealthy,
      setSmtpHealthy,
      retryFailedEmails,
      clearEmailLogs,
      resetInitialPassword,
      activateStudent,
      toasts,
      theme,
      setTheme,
      login,
      logout,
      addToast,
      removeToast,
      apiActive,
      onboardCollege,
      toggleCollegeStatus,
      addManagementAdmin,
      addDepartment,
      createBatch,
      addStudent,
      registerStudent,
      verifyStudentOtp,
      toggleStudentStatus,
      forceResetStudentPassword,
      resendStudentCredentials,
      toggleManagementAdminStatus,
      forceResetManagementAdminPassword,
      resendManagementAdminCredentials,
      processBulkUpload,
      scheduleExam,
      publishExam,
      publishExamResults,
      forceTerminateExam,
      addQuestion,
      editQuestion,
      deleteQuestion,
      bulkImportQuestions,
      addQuestionPaper,
      deleteQuestionPaper,
      parseQuestionUpload,
      generateAIQuestions,
      submitExamAttempt,
      logFraudEvent,
      attachEvidenceSnapshot,
      triggerNotification,
      sendMockEmail,
      logAuditEvent
    }}>
      {children}
    </PlatformContext.Provider>
  );
};
