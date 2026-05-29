import React, { useState, useRef } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { 
  Users, BookOpen, UserCheck, ShieldAlert, FileText, Upload, Plus, BarChart3, 
  RotateCcw, AlertOctagon, Terminal, Play, LogOut, CheckCircle, Mail, Download, 
  Trash, Eye, Check, AlertCircle, HelpCircle, ClipboardList, Clock, Key
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

const ManagementPortal = () => {
  const {
    currentUser,
    logout,
    students,
    addStudent,
    toggleStudentStatus,
    forceResetStudentPassword,
    resendStudentCredentials,
    departments,
    addDepartment,
    batches,
    createBatch,
    managementAdmins,
    addManagementAdmin,
    processBulkUpload,
    exams,
    scheduleExam,
    assignExamStudents,
    publishExam,
    publishExamResults,
    attempts,
    forceTerminateExam,
    fraudEvents,
    emailLogs,
    emailQueue,
    smtpHealthy,
    setSmtpHealthy,
    retryFailedEmails,
    clearEmailLogs,
    notifications,
    addToast,
    auditLogs,
    logAuditEvent,
    questions,
    questionPapers,
    addQuestion,
    editQuestion,
    deleteQuestion,
    bulkImportQuestions,
    addQuestionPaper,
    deleteQuestionPaper,
    apiActive
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSubTab, setUserSubTab] = useState('students');
  const [bulkSubTab, setBulkSubTab] = useState('upload');
  const fileInputRef = useRef(null);

  // Manual Creation States
  const [studentForm, setStudentForm] = useState({ name: '', email: '', rollNumber: '', department: 'Computer Science & Engineering', year: '3rd Year', batchId: 'b1' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [batchForm, setBatchForm] = useState({ name: '', department: 'Computer Science & Engineering' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', department: 'All' });

  // Bulk Upload States
  const [uploadType, setUploadType] = useState('student');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawCsvText, setRawCsvText] = useState('');
  const [rawFileObject, setRawFileObject] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Question Bank States
  const [qSearch, setQSearch] = useState('');
  const [qSubject, setQSubject] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState('');
  const [qBranch, setQBranch] = useState('');
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'Medium',
    subject: '',
    topic: '',
    branch: 'CSE',
    marks: 1
  });
  const [bulkQFile, setBulkQFile] = useState(null);
  const [bulkQError, setBulkQError] = useState(null);
  const [bulkQSuccess, setBulkQSuccess] = useState(null);

  // Question Paper Builder States
  const [paperForm, setPaperForm] = useState({
    title: '',
    subject: '',
    selectedQuestions: [],
    questionMarks: {},
    totalMarks: 0
  });
  const [paperQSearch, setPaperQSearch] = useState('');
  const [paperQSubject, setPaperQSubject] = useState('');
  const [paperQDifficulty, setPaperQDifficulty] = useState('');
  const [randomCount, setRandomCount] = useState(5);

  // Assignments States
  const [assignmentForm, setAssignmentForm] = useState({
    examId: '',
    type: 'batch', // batch, branch, roster
    batchId: '',
    branch: 'CSE',
    year: '1st Year',
    rosterText: ''
  });

  // Schedule Exam States
  const [examForm, setExamForm] = useState({
    title: '',
    subject: '',
    questionPaperId: '',
    duration: 60,
    negativeMarking: 0.25,
    randomized: true,
    attemptLimit: 1,
    passCutoff: 40,
    windowStart: new Date().toISOString().slice(0, 16),
    windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    fullscreenRequired: true,
    aiProctoringEnabled: true
  });

  // Force Terminate Modal State
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [terminateReason, setTerminateReason] = useState('Secondary screen detected');

  // Form Validations
  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.email.trim() || !studentForm.rollNumber.trim()) {
      addToast('Validation Error', 'All fields are required.', 'danger');
      return;
    }
    addStudent(studentForm);
    setStudentForm({ name: '', email: '', rollNumber: '', department: 'Computer Science & Engineering', year: '3rd Year', batchId: 'b1' });
  };

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      addToast('Validation Error', 'Name and code are required.', 'danger');
      return;
    }
    addDepartment(deptForm.name, deptForm.code);
    setDeptForm({ name: '', code: '' });
  };

  const handleBatchSubmit = (e) => {
    e.preventDefault();
    if (!batchForm.name.trim()) {
      addToast('Validation Error', 'Batch name is required.', 'danger');
      return;
    }
    createBatch(batchForm.name, batchForm.department);
    setBatchForm({ name: '', department: 'Computer Science & Engineering' });
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim()) {
      addToast('Validation Error', 'Name and email are required.', 'danger');
      return;
    }
    addManagementAdmin(adminForm);
    setAdminForm({ name: '', email: '', department: 'All' });
  };

  // Exam Schedule assignment
  const handleExamSubmit = (e) => {
    e.preventDefault();
    if (!examForm.title.trim() || !examForm.subject.trim() || !examForm.questionPaperId) {
      addToast('Validation Error', 'Exam title, subject, and question paper are required.', 'danger');
      return;
    }
    scheduleExam({
      ...examForm,
      status: 'draft',
      assignedStudents: []
    });
    setExamForm({
      title: '',
      subject: '',
      questionPaperId: '',
      duration: 60,
      negativeMarking: 0.25,
      randomized: true,
      attemptLimit: 1,
      passCutoff: 40,
      windowStart: new Date().toISOString().slice(0, 16),
      windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      fullscreenRequired: true,
      aiProctoringEnabled: true
    });
    addToast('Exam Scheduled', 'Exam scheduled as Draft. Please assign students and publish.', 'success');
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!questionForm.questionText.trim() || !questionForm.optionA.trim() || !questionForm.optionB.trim()) {
      addToast('Validation Error', 'Question text and Options A & B are required.', 'danger');
      return;
    }
    
    const formatted = {
      ...questionForm,
      options: [
        { key: 'A', text: questionForm.optionA },
        { key: 'B', text: questionForm.optionB },
        ...(questionForm.optionC ? [{ key: 'C', text: questionForm.optionC }] : []),
        ...(questionForm.optionD ? [{ key: 'D', text: questionForm.optionD }] : [])
      ],
      marks: parseInt(questionForm.marks) || 1
    };

    if (isEditingQuestion) {
      editQuestion(questionForm.id, formatted);
      setIsEditingQuestion(false);
      addToast('Question Updated', 'Question details saved.', 'success');
    } else {
      addQuestion(formatted);
      addToast('Question Created', 'Added to question bank.', 'success');
    }

    setQuestionForm({
      id: '',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      difficulty: 'Medium',
      subject: '',
      topic: '',
      branch: 'CSE',
      marks: 1
    });
  };

  const handleQuestionDelete = (id) => {
    if (window.confirm('Delete this question permanently from the bank?')) {
      deleteQuestion(id);
      addToast('Question Deleted', 'Removed from question bank.', 'warning');
    }
  };

  const handlePaperSubmit = (e) => {
    e.preventDefault();
    if (!paperForm.title.trim() || !paperForm.subject.trim()) {
      addToast('Validation Error', 'Title and subject are required.', 'danger');
      return;
    }
    if (paperForm.selectedQuestions.length === 0) {
      addToast('Validation Error', 'Please select at least one question for the paper.', 'danger');
      return;
    }

    addQuestionPaper({
      title: paperForm.title,
      subject: paperForm.subject,
      questions: paperForm.selectedQuestions,
      marks: paperForm.questionMarks,
      totalMarks: paperForm.totalMarks
    });

    setPaperForm({
      title: '',
      subject: '',
      selectedQuestions: [],
      questionMarks: {},
      totalMarks: 0
    });
    addToast('Success', 'Question paper assembled successfully.', 'success');
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentForm.examId) {
      addToast('Validation Error', 'Please select an exam to assign.', 'danger');
      return;
    }

    const exam = exams.find(ex => ex.id === assignmentForm.examId);
    if (!exam) return;

    let targetStudents = [];
    let branchFilter = '';
    let yearFilter = '';
    let batchFilter = '';

    if (assignmentForm.type === 'batch') {
      const selectedBatch = batches.find(b => b.id === assignmentForm.batchId);
      if (!selectedBatch) {
        addToast('Validation Error', 'Please select a student batch.', 'danger');
        return;
      }
      targetStudents = students
        .filter(s => s.batchId === assignmentForm.batchId)
        .map(s => s.id);
      
      if (targetStudents.length === 0) {
        addToast('No Students Found', `No students found registered under batch: ${selectedBatch.name}`, 'warning');
        return;
      }
      batchFilter = selectedBatch.name;
    } else if (assignmentForm.type === 'branch') {
      targetStudents = students
        .filter(s => s.branch === assignmentForm.branch && s.year === assignmentForm.year)
        .map(s => s.id);
      
      if (targetStudents.length === 0) {
        addToast('No Students Found', `No students found matching ${assignmentForm.branch} - ${assignmentForm.year}`, 'warning');
        return;
      }
      branchFilter = assignmentForm.branch;
      yearFilter = assignmentForm.year;
    } else {
      const rollNumbers = assignmentForm.rosterText
        .split(/[\n,]+/)
        .map(r => r.trim())
        .filter(Boolean);
      
      targetStudents = students
        .filter(s => rollNumbers.includes(s.rollNumber))
        .map(s => s.id);

      if (targetStudents.length === 0) {
        addToast('No Students Matched', 'Ensure roll numbers match registered students.', 'danger');
        return;
      }
    }

    try {
      await assignExamStudents(exam.id, {
        assignedStudents: targetStudents,
        branchFilter,
        yearFilter,
        batchFilter
      });
      addToast('Students Assigned', `Assigned ${targetStudents.length} students to ${exam.title} successfully.`, 'success');
      
      setAssignmentForm({
        examId: '',
        type: 'batch',
        batchId: '',
        branch: 'CSE',
        year: '1st Year',
        rosterText: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkQuestionImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setBulkQError('CSV file is empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const qIndex = headers.indexOf('question');
      const optA = headers.indexOf('option a');
      const optB = headers.indexOf('option b');
      const optC = headers.indexOf('option c');
      const optD = headers.indexOf('option d');
      const ansIndex = headers.indexOf('correct answer');
      const diffIndex = headers.indexOf('difficulty');
      const subjIndex = headers.indexOf('subject');
      const topicIndex = headers.indexOf('topic');
      const marksIndex = headers.indexOf('marks');

      if (qIndex === -1 || optA === -1 || optB === -1 || ansIndex === -1) {
        setBulkQError('Missing columns. Headers must contain: Question, Option A, Option B, Correct Answer');
        return;
      }

      const parsedQuestions = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const row = [];
        let insideQuote = false;
        let entry = '';
        for (let char of lines[i]) {
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            row.push(entry.trim());
            entry = '';
          } else {
            entry += char;
          }
        }
        row.push(entry.trim());

        if (row.length < 4) continue;

        const qText = row[qIndex];
        const aText = row[optA];
        const bText = row[optB];
        const cText = optC !== -1 ? row[optC] : '';
        const dText = optD !== -1 ? row[optD] : '';
        const answer = row[ansIndex]?.toUpperCase();
        const difficulty = diffIndex !== -1 ? row[diffIndex] : 'Medium';
        const subject = subjIndex !== -1 ? row[subjIndex] : 'General';
        const topic = topicIndex !== -1 ? row[topicIndex] : '';
        const marks = marksIndex !== -1 ? parseInt(row[marksIndex]) || 1 : 1;

        if (!qText || !aText || !bText || !answer) {
          errors.push(`Row ${i + 1}: Missing required fields.`);
          continue;
        }

        if (!['A', 'B', 'C', 'D'].includes(answer)) {
          errors.push(`Row ${i + 1}: Invalid correct answer (must be A, B, C, or D).`);
          continue;
        }

        parsedQuestions.push({
          questionText: qText,
          options: [
            { key: 'A', text: aText },
            { key: 'B', text: bText },
            ...(cText ? [{ key: 'C', text: cText }] : []),
            ...(dText ? [{ key: 'D', text: dText }] : [])
          ],
          correctAnswer: answer,
          difficulty,
          subject,
          topic,
          branch: 'CSE',
          marks
        });
      }

      if (errors.length > 0) {
        setBulkQError(errors.slice(0, 5).join(' | '));
        setBulkQSuccess(null);
      } else {
        bulkImportQuestions(parsedQuestions);
        setBulkQSuccess(`Successfully imported ${parsedQuestions.length} questions.`);
        setBulkQError(null);
        addToast('Import Completed', `${parsedQuestions.length} questions added to bank.`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Download Sample Templates
  const downloadSampleTemplate = (type) => {
    let headers = "";
    let sample = "";
    if (type === 'student') {
      headers = "full_name,email,roll_number,branch,year,mobile_number,gender\n";
      sample = "Alice Cooper,alice.c@student.edu,ICS-2024-099,CSE,3rd Year,9876543210,Female\nBob Marley,bob.m@student.edu,ICS-2024-101,ECE,2nd Year,9876543211,Male";
    } else if (type === 'teacher') {
      headers = "Name, Email, Department, Subject\n";
      sample = "Prof. Severus Snape, severus.s@ics.edu, Computer Science & Engineering, Cryptography\nDr. Bruce Banner, bruce.b@ics.edu, Information Technology, Data Science";
    } else {
      headers = "Question, Option A, Option B, Option C, Option D, Correct Answer, Difficulty, Subject\n";
      sample = "What is the speed of light?, 299792 km/s, 150000 km/s, 3000 km/s, 500000 km/s, A, Easy, Physics";
    }

    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${type}_bulk_template.csv`);
    a.click();
    addToast('Template Downloaded', `Mock sample file for ${type} generated.`, 'success');
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelected = (file) => {
    if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
      setFileName(file.name);
      setRawFileObject(file);

      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRawCsvText(event.target.result);
          addToast('File Loaded', `Successfully read ${file.name}`, 'info');
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            if (!window.XLSX) {
              addToast('Loading Library', 'Excel library loading. Please retry dropping/selecting the file.', 'warning');
              const script = document.createElement('script');
              script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
              document.head.appendChild(script);
              return;
            }
            const data = new Uint8Array(event.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvText = window.XLSX.utils.sheet_to_csv(worksheet);
            setRawCsvText(csvText);
            addToast('File Loaded', `Successfully read and parsed Excel: ${file.name}`, 'info');
          } catch (err) {
            console.error(err);
            addToast('Excel Parse Error', 'Unable to parse Excel file format.', 'danger');
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } else {
      addToast('Invalid File Format', 'Only .csv or .xlsx spreadsheets supported.', 'danger');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  // Run bulk import
  const executeBulkImport = async (e) => {
    e.preventDefault();
    if (!rawCsvText.trim() && !rawFileObject) {
      addToast('Input Required', 'Provide CSV format rows or drop template file.', 'warning');
      return;
    }
    setIsValidating(true);
    setUploadResult(null);
    setImportProgress(10);

    const interval = setInterval(() => {
      setImportProgress(p => Math.min(p + 30, 90));
    }, 400);

    if (apiActive && uploadType === 'student') {
      try {
        const formData = new FormData();
        if (rawFileObject) {
          formData.append('file', rawFileObject);
        } else {
          const blob = new Blob([rawCsvText], { type: 'text/csv' });
          formData.append('file', blob, 'roster.csv');
        }
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/students/import', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });
        clearInterval(interval);
        setImportProgress(100);
        const data = await res.json();
        if (res.ok) {
          setUploadResult({
            success: true,
            message: `Imported ${data.summary?.successCount || 0} students. ${data.summary?.errorCount || 0} errors.`,
            imported: data.preview || [],
            errors: data.errors || []
          });
          setRawCsvText('');
          setFileName('');
          setRawFileObject(null);
          addToast('Import Complete', `${data.summary?.successCount || 0} students imported successfully.`, 'success');
        } else {
          setUploadResult({ success: false, message: data.message || 'Import failed.', errors: data.errors || [] });
          addToast('Import Failed', data.message || 'Server-side import error.', 'danger');
        }
      } catch (err) {
        clearInterval(interval);
        setUploadResult({ success: false, message: err.message });
        addToast('Import Error', err.message, 'danger');
      } finally {
        setIsValidating(false);
      }
    } else {
      setTimeout(() => {
        clearInterval(interval);
        const res = processBulkUpload(uploadType, rawCsvText);
        setImportProgress(100);
        setIsValidating(false);
        setUploadResult(res);
        if (res.success) {
          setRawCsvText('');
          setFileName('');
          setRawFileObject(null);
        }
      }, 1500);
    }
  };

  // Active / finished stats
  const activeExams = exams.length;
  const totalStudents = students.length;
  const terminatedExamsCount = attempts.filter(att => att.status === 'terminated').length;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BookOpen size={28} />
          <span>OmniAdmin<span>.ai</span></span>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-section-header" style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Core Operations</li>
          <li>
            <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <BarChart3 size={18} />
              Overview
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <Users size={18} />
              User & Org Control
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
              <ClipboardList size={18} />
              Audit Logs ⭐
            </button>
          </li>

          <li className="sidebar-section-header" style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Question Management</li>
          <li>
            <button className={`sidebar-item ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
              <HelpCircle size={18} />
              Question Bank
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'question_papers' ? 'active' : ''}`} onClick={() => setActiveTab('question_papers')}>
              <FileText size={18} />
              Question Papers
            </button>
          </li>

          <li className="sidebar-section-header" style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Exam Management</li>
          <li>
            <button className={`sidebar-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
              <BookOpen size={18} />
              Exam Schedules
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
              <Users size={18} />
              Rosters & Assignments
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
              <ShieldAlert size={18} />
              Live Proctor Node
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <FileText size={18} />
              Result Reports
            </button>
          </li>

          <li className="sidebar-section-header" style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Integrations & Logs</li>
          <li>
            <button className={`sidebar-item ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>
              <Upload size={18} />
              Bulk Upload ⭐
            </button>
          </li>
          <li>
            <button className={`sidebar-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
              <Mail size={18} />
              Email Outbox Log ⭐
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar" style={{ backgroundColor: 'var(--color-primary)' }}>AD</div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">Management Admin</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-bar">
          <div className="header-title-section">
            <h1>Institution Administration</h1>
            <p>Onboard personnel, manage batches, configure proctor rules, and audit results.</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
          </div>
        </header>

        {/* 1. Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                  <UserCheck size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Enrolled Students</span>
                  <span className="stat-value">{totalStudents}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                  <BookOpen size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Scheduled Exams</span>
                  <span className="stat-value">{activeExams}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                  <AlertOctagon size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Malpractice Blocks</span>
                  <span className="stat-value">{terminatedExamsCount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <h3 className="card-title">Recent Exam Violations</h3>
                <div className="table-container">
                  {fraudEvents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlignment: 'center', color: 'var(--text-muted)' }}>
                      No proctor anomalies flagged in this session.
                    </div>
                  ) : (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Violation</th>
                          <th>Timestamp</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fraudEvents.slice(0, 5).map((evt) => (
                          <tr key={evt.id}>
                            <td>{evt.studentName}</td>
                            <td>
                              <span className="badge badge-warning">{evt.eventType}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{evt.description}</div>
                            </td>
                            <td>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                            <td>
                              <span className={`badge ${evt.severity === 'danger' ? 'badge-danger' : 'badge-warning'}`}>
                                {evt.severity === 'danger' ? 'Terminated' : 'Warning'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 className="card-title">Quick Tasks</h3>
                  <button className="btn btn-primary" onClick={() => setActiveTab('bulk')} style={{ justifyContent: 'flex-start' }}>
                    <Upload size={16} />
                    Execute Bulk Import Pipeline
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('exams')} style={{ justifyContent: 'flex-start' }}>
                    <Plus size={16} />
                    Schedule Academic Exam
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('users')} style={{ justifyContent: 'flex-start' }}>
                    <Users size={16} />
                    Setup Batches & Admins
                  </button>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 className="card-title">Real-time Platform Alerts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {notifications.filter(n => n.recipientRole === 'management' || n.recipientRole === 'global').length === 0 ? (
                      <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        No active proctoring alerts.
                      </div>
                    ) : (
                      notifications
                        .filter(n => n.recipientRole === 'management' || n.recipientRole === 'global')
                        .slice(0, 8)
                        .map(n => (
                          <div key={n.id} style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'var(--bg-app)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.15rem'
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{n.title}</div>
                            <div style={{ color: 'var(--text-light)' }}>{n.message}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
                              {new Date(n.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. User & Org Control */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="tab-nav-buttons">
              <button className={`tab-nav-btn ${userSubTab === 'students' ? 'active' : ''}`} onClick={() => setUserSubTab('students')}>Students</button>
              <button className={`tab-nav-btn ${userSubTab === 'departments' ? 'active' : ''}`} onClick={() => setUserSubTab('departments')}>Departments</button>
              <button className={`tab-nav-btn ${userSubTab === 'batches' ? 'active' : ''}`} onClick={() => setUserSubTab('batches')}>Batches</button>
              <button className={`tab-nav-btn ${userSubTab === 'admins' ? 'active' : ''}`} onClick={() => setUserSubTab('admins')}>Sub-Admins</button>
            </div>

            {/* Students Subtab */}
            {userSubTab === 'students' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>Enrolled Students Directory</h3>
                  <span className="badge badge-info">{students.length} Registered Students</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Students register themselves using the self-service flow. Direct administrative student accounts creation is disabled for security and validation integrity.
                </p>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Student Info</th>
                        <th>Roll No</th>
                        <th>Department</th>
                        <th>Batch</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        const batch = batches.find(b => b.id === s.batchId);
                        return (
                          <tr key={s.id}>
                            <td>
                              <strong>{s.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                            </td>
                            <td><code>{s.rollNumber}</code></td>
                            <td>{s.department || s.branch || 'General'}</td>
                            <td><span className="badge badge-info">{batch ? batch.name : 'Unassigned'}</span></td>
                            <td>
                              <span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'pending' ? 'badge-info' : 'badge-danger'}`}>
                                {s.status === 'active' ? 'Active' : s.status === 'pending' ? 'Pending Invite' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => toggleStudentStatus(s.id)}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  {s.status === 'active' ? 'Deactivate' : s.status === 'pending' ? 'Suspend Invite' : 'Activate'}
                                </button>
                                {s.status !== 'pending' && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      if (window.confirm(`Force password reset for student ${s.name}?`)) {
                                        forceResetStudentPassword(s.id);
                                      }
                                    }}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-warning)', borderColor: 'rgba(255, 193, 7, 0.2)' }}
                                  >
                                    <Key size={12} style={{ marginRight: '0.25rem' }} /> Reset
                                  </button>
                                )}
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => resendStudentCredentials(s.id)}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <Mail size={12} style={{ marginRight: '0.25rem' }} /> {s.status === 'pending' ? 'Resend Invite' : 'Resend Credentials'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Departments Subtab */}
            {userSubTab === 'departments' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div className="card" style={{ alignSelf: 'start' }}>
                  <h3 className="card-title">Add Department</h3>
                  <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Department Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Electrical Engineering" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Code Code</label>
                      <input type="text" className="form-control" placeholder="e.g. EE" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Add Department</button>
                  </form>
                </div>

                <div className="card">
                  <h3 className="card-title">Active Departments</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Department Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(d => (
                          <tr key={d.id}>
                            <td><code>{d.code}</code></td>
                            <td>{d.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Batches Subtab */}
            {userSubTab === 'batches' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div className="card" style={{ alignSelf: 'start' }}>
                  <h3 className="card-title">Create Batch Group</h3>
                  <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Batch Name</label>
                      <input type="text" className="form-control" placeholder="e.g. CSE-C" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Associated Department</label>
                      <select className="form-control form-select" value={batchForm.department} onChange={(e) => setBatchForm({ ...batchForm, department: e.target.value })}>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Create Batch</button>
                  </form>
                </div>

                <div className="card">
                  <h3 className="card-title">Academic Batches</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Batch Code</th>
                          <th>Department</th>
                          <th>Student Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.name}</strong></td>
                            <td>{b.department}</td>
                            <td>{b.students.length} Candidates</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Admins Subtab */}
            {userSubTab === 'admins' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div className="card" style={{ alignSelf: 'start' }}>
                  <h3 className="card-title">Create Management Account</h3>
                  <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Admin Name</label>
                      <input type="text" className="form-control" placeholder="Jane Smith" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Admin Email</label>
                      <input type="email" className="form-control" placeholder="jane@ics.edu" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department Role</label>
                      <select className="form-control form-select" value={adminForm.department} onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}>
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Generate Account</button>
                  </form>
                </div>

                <div className="card">
                  <h3 className="card-title">Administrators</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Access Role</th>
                          <th>Password Status</th>
                          <th>Credentials</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managementAdmins.map(a => (
                          <tr key={a.id}>
                            <td>
                              <strong>{a.name}</strong>
                              {a.createdAt && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Created: {new Date(a.createdAt).toLocaleDateString()}</div>}
                            </td>
                            <td>{a.email}</td>
                            <td><span className="badge badge-success">{a.department === 'All' ? 'Global Admin' : a.department}</span></td>
                            <td>
                              {a.mustResetPassword ? (
                                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
                                  <Key size={12} /> Reset Required
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
                                  <CheckCircle size={12} /> Active
                                </span>
                              )}
                            </td>
                            <td>
                              {a.tempPasswordDisplay ? (
                                <code style={{ fontSize: '0.75rem', background: 'var(--color-warning-light)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--color-warning)' }}>{a.tempPasswordDisplay}</code>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Password set</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Bulk Upload Tab */}
        {activeTab === 'bulk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="tab-nav-buttons">
              <button className={`tab-nav-btn ${bulkSubTab === 'upload' ? 'active' : ''}`} onClick={() => setBulkSubTab('upload')}>Spreadsheet Import</button>
              <button className={`tab-nav-btn ${bulkSubTab === 'instructions' ? 'active' : ''}`} onClick={() => setBulkSubTab('instructions')}>Instructions & Templates</button>
            </div>

            {bulkSubTab === 'upload' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                <div className="card" style={{ alignSelf: 'start' }}>
                  <h3 className="card-title">Bulk Import Console</h3>
                  <form onSubmit={executeBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Data Schema Format</label>
                      <select className="form-control form-select" value={uploadType} onChange={(e) => { setUploadType(e.target.value); setUploadResult(null); }}>
                        <option value="student">Student Registry</option>
                        <option value="question">Question Bank (MCQs)</option>
                      </select>
                    </div>

                    <div 
                      className={`drag-drop-zone ${dragOver ? 'drag-over' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2.5rem 1.5rem',
                        textAlign: 'center',
                        backgroundColor: dragOver ? 'var(--color-primary-light)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Upload size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {fileName ? `File Selected: ${fileName}` : 'Drag & Drop Excel/CSV spreadsheet here (or click to browse)'}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported formats: .csv, .xlsx</span>
                    </div>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                      accept=".csv,.xlsx"
                    />

                    <div className="form-group">
                      <label className="form-label">Paste CSV Content directly (Fallback)</label>
                      <textarea 
                        className="form-control" 
                        rows="5" 
                        placeholder="Name, Email, Roll Number, Department, Year, Batch..."
                        value={rawCsvText}
                        onChange={(e) => setRawCsvText(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isValidating} style={{ width: '100%' }}>
                      {isValidating ? `Importing Data Node (${importProgress}%)` : 'Verify & Execute Pipeline'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <h3 className="card-title">Bulk Import Logs</h3>
                  {isValidating && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '2rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Row-by-row validation workflow running...</span>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${importProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {uploadResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: uploadResult.success && uploadResult.errors.length === 0 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                        color: uploadResult.success && uploadResult.errors.length === 0 ? 'var(--color-success)' : 'var(--color-warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <CheckCircle size={20} />
                        <div>
                          <strong>Pipeline Completed.</strong> Created {uploadResult.count} accounts. Duplicates: {uploadResult.duplicates}
                        </div>
                      </div>

                      {uploadResult.errors.length > 0 && (
                        <div>
                          <h4 style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Row-Level Validation Violations ({uploadResult.errors.length})</h4>
                          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                              <thead>
                                <tr>
                                  <th>Spreadsheet Row</th>
                                  <th>Status Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadResult.errors.map((err, idx) => (
                                  <tr key={idx} style={{ backgroundColor: 'var(--bg-card)' }}>
                                    <td>Row {err.row}</td>
                                    <td style={{ color: 'var(--color-danger)' }}>{err.error}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '3rem', color: 'var(--text-muted)' }}>
                      <Terminal size={36} />
                      <p style={{ fontSize: '0.85rem' }}>No bulk workflow data loaded.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bulkSubTab === 'instructions' && (
              <div className="card">
                <h3 className="card-title">Instructions & Sample Templates</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Please match the CSV/spreadsheet column headers exactly to avoid file parsing errors. Download samples below:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Users size={20} style={{ color: 'var(--color-primary)' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Student Template</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name, Email, Roll Number, Department, Year, Batch</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadSampleTemplate('student')} style={{ marginTop: '0.5rem' }}>
                      <Download size={12} /> Download CSV
                    </button>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <BookOpen size={20} style={{ color: 'var(--color-info)' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Question Template</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Question, Option A, Option B, Correct Answer, Difficulty</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadSampleTemplate('question')} style={{ marginTop: '0.5rem' }}>
                      <Download size={12} /> Download CSV
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exams' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
            <div className="card" style={{ alignSelf: 'start' }}>
              <h3 className="card-title">Schedule New Exam</h3>
              <form onSubmit={handleExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Exam Title *</label>
                  <input type="text" className="form-control" placeholder="Mid-Term AI Exam" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input type="text" className="form-control" placeholder="Artificial Intelligence" value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Question Paper *</label>
                  {questionPapers.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                      No question papers assembled. Build one in "Question Papers" first.
                    </div>
                  ) : (
                    <select className="form-control form-select" value={examForm.questionPaperId} onChange={(e) => setExamForm({ ...examForm, questionPaperId: e.target.value })} required>
                      <option value="">-- Choose Question Paper --</option>
                      {questionPapers.map(qp => (
                        <option key={qp.id} value={qp.id}>{qp.title} ({qp.subject} - {qp.questions.length} MCQs)</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem', marginTop: '0.5rem' }}>Exam Rules & Constraints</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Max Attempts *</label>
                    <input type="number" className="form-control" value={examForm.attemptLimit} onChange={(e) => setExamForm({ ...examForm, attemptLimit: parseInt(e.target.value) || 1 })} min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pass Cutoff (%) *</label>
                    <input type="number" className="form-control" value={examForm.passCutoff} onChange={(e) => setExamForm({ ...examForm, passCutoff: parseInt(e.target.value) || 40 })} min="1" max="100" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (Mins) *</label>
                    <input type="number" className="form-control" value={examForm.duration} onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) || 10 })} min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Negative Mark</label>
                    <select className="form-control form-select" value={examForm.negativeMarking} onChange={(e) => setExamForm({ ...examForm, negativeMarking: parseFloat(e.target.value) })}>
                      <option value="0">0.00 (None)</option>
                      <option value="0.25">0.25 (1/4th)</option>
                      <option value="0.33">0.33 (1/3rd)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBlock: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={examForm.fullscreenRequired} onChange={(e) => setExamForm({ ...examForm, fullscreenRequired: e.target.checked })} />
                    Enforce Mandatory Fullscreen Tab-Lock
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={examForm.aiProctoringEnabled} onChange={(e) => setExamForm({ ...examForm, aiProctoringEnabled: e.target.checked })} />
                    Enable AI Proctoring Device Calibration
                  </label>
                </div>

                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem', marginTop: '0.5rem' }}>Availability Window</h4>

                <div className="form-group">
                  <label className="form-label">Window Open *</label>
                  <input type="datetime-local" className="form-control" value={examForm.windowStart} onChange={(e) => setExamForm({ ...examForm, windowStart: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Window Close *</label>
                  <input type="datetime-local" className="form-control" value={examForm.windowEnd} onChange={(e) => setExamForm({ ...examForm, windowEnd: e.target.value })} required />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={questionPapers.length === 0}>
                  Schedule Draft Exam
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Scheduled College Examinations</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Exam Code & Title</th>
                      <th>Assigned Roster</th>
                      <th>Constraints</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No scheduled exams found.
                        </td>
                      </tr>
                    ) : (
                      exams.map(e => {
                        const qp = questionPapers.find(p => p.id === e.questionPaperId);
                        return (
                          <tr key={e.id}>
                            <td>
                              <strong>{e.title}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {e.subject} • {e.duration} mins • Paper: {qp ? qp.title : 'None'}
                              </div>
                            </td>
                            <td>
                              {e.assignedStudents && e.assignedStudents.length > 0 ? (
                                <span className="badge badge-info">{e.assignedStudents.length} Students Assigned</span>
                              ) : e.branchFilter ? (
                                <span className="badge badge-secondary">{e.branchFilter} - {e.yearFilter}</span>
                              ) : (
                                <span className="badge badge-danger">Unassigned</span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span>Neg Mark: <code>{e.negativeMarking}</code></span>
                                <span>Tab Lock: {e.fullscreenRequired ? 'Yes' : 'No'}</span>
                                <span>AI Proctor: {e.aiProctoringEnabled ? 'Yes' : 'No'}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${e.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                                {e.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {e.status === 'draft' && (
                                  <button className="btn btn-primary btn-sm" onClick={() => {
                                    if (!e.assignedStudents || e.assignedStudents.length === 0) {
                                      addToast('Publish Rejected', 'Roster must be assigned before publishing.', 'danger');
                                      return;
                                    }
                                    publishExam(e.id);
                                    addToast('Success', 'Exam published to students portal.', 'success');
                                  }}>
                                    Publish Exam
                                  </button>
                                )}
                                {!e.publishedResults ? (
                                  <button className="btn btn-secondary btn-sm" onClick={() => publishExamResults(e.id)}>
                                    Publish Results
                                  </button>
                                ) : (
                                  <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Results Active</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank */}
        {activeTab === 'questions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
            {/* Left Column: Form & Bulk upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h3 className="card-title">{isEditingQuestion ? 'Edit Bank Question' : 'Add New Question'}</h3>
                <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Question Text *</label>
                    <textarea className="form-control" rows="3" placeholder="Enter question description..." value={questionForm.questionText} onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Option A *</label>
                      <input type="text" className="form-control" placeholder="Option A" value={questionForm.optionA} onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option B *</label>
                      <input type="text" className="form-control" placeholder="Option B" value={questionForm.optionB} onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })} required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Option C</label>
                      <input type="text" className="form-control" placeholder="Option C (Optional)" value={questionForm.optionC} onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option D</label>
                      <input type="text" className="form-control" placeholder="Option D (Optional)" value={questionForm.optionD} onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Correct Option *</label>
                      <select className="form-control form-select" value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} required>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C" disabled={!questionForm.optionC}>Option C</option>
                        <option value="D" disabled={!questionForm.optionD}>Option D</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Marks</label>
                      <input type="number" className="form-control" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })} min="1" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Difficulty *</label>
                      <select className="form-control form-select" value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Code</label>
                      <select className="form-control form-select" value={questionForm.branch} onChange={(e) => setQuestionForm({ ...questionForm, branch: e.target.value })}>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Subject Title *</label>
                      <input type="text" className="form-control" placeholder="e.g. Physics" value={questionForm.subject} onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Topic Tag</label>
                      <input type="text" className="form-control" placeholder="e.g. Mechanics" value={questionForm.topic} onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {isEditingQuestion ? 'Update Question' : 'Save Question'}
                    </button>
                    {isEditingQuestion && (
                      <button type="button" className="btn btn-secondary" onClick={() => {
                        setIsEditingQuestion(false);
                        setQuestionForm({
                          id: '', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
                          correctAnswer: 'A', difficulty: 'Medium', subject: '', topic: '', branch: 'CSE', marks: 1
                        });
                      }}>Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card">
                <h3 className="card-title">Bulk Import Questions</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Import questions via CSV file. Column Headers: <code>Question, Option A, Option B, Option C, Option D, Correct Answer, Difficulty, Subject, Topic, Marks</code>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input type="file" className="form-control" accept=".csv" onChange={handleBulkQuestionImport} />
                  {bulkQSuccess && <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>{bulkQSuccess}</div>}
                  {bulkQError && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', whiteSpace: 'pre-wrap' }}>{bulkQError}</div>}
                </div>
              </div>
            </div>

            {/* Right Column: Listings & Filters */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Question Bank Directory</h3>
                <span className="badge badge-info">{questions.length} Questions</span>
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                <input type="text" className="form-control" placeholder="Search text..." value={qSearch} onChange={(e) => setQSearch(e.target.value)} />
                <input type="text" className="form-control" placeholder="Subject..." value={qSubject} onChange={(e) => setQSubject(e.target.value)} />
                <select className="form-control form-select" value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)}>
                  <option value="">Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <select className="form-control form-select" value={qBranch} onChange={(e) => setQBranch(e.target.value)}>
                  <option value="">Branch</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px' }}>
                {questions
                  .filter(q => {
                    const matchesSearch = !qSearch || q.questionText.toLowerCase().includes(qSearch.toLowerCase()) || (q.topic && q.topic.toLowerCase().includes(qSearch.toLowerCase()));
                    const matchesSubject = !qSubject || q.subject.toLowerCase().includes(qSubject.toLowerCase());
                    const matchesDiff = !qDifficulty || q.difficulty === qDifficulty;
                    const matchesBranch = !qBranch || q.branch === qBranch;
                    return matchesSearch && matchesSubject && matchesDiff && matchesBranch;
                  })
                  .map(q => (
                    <div key={q.id} style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-surface-hover)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span className="badge badge-info">{q.subject}</span>
                          {q.topic && <span className="badge badge-secondary">{q.topic}</span>}
                          <span className="badge badge-primary">{q.difficulty}</span>
                          <span className="badge badge-secondary">{q.marks} Marks</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem' }} onClick={() => {
                            setIsEditingQuestion(true);
                            setQuestionForm({
                              id: q.id,
                              questionText: q.questionText,
                              optionA: q.options[0]?.text || '',
                              optionB: q.options[1]?.text || '',
                              optionC: q.options[2]?.text || '',
                              optionD: q.options[3]?.text || '',
                              correctAnswer: q.correctAnswer,
                              difficulty: q.difficulty,
                              subject: q.subject,
                              topic: q.topic || '',
                              branch: q.branch || 'CSE',
                              marks: q.marks || 1
                            });
                          }}>
                            Edit
                          </button>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem', color: 'var(--color-danger)' }} onClick={() => handleQuestionDelete(q.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{q.questionText}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {q.options.map(opt => (
                          <div key={opt.key} style={{ padding: '0.25rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: q.correctAnswer === opt.key ? 'var(--color-success-light)' : 'transparent' }}>
                            <strong>{opt.key}:</strong> {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Question Papers Builder */}
        {activeTab === 'question_papers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
            {/* Left Column: Build details */}
            <div className="card">
              <h3 className="card-title">Assemble Question Paper</h3>
              <form onSubmit={handlePaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Paper Title *</label>
                  <input type="text" className="form-control" placeholder="Midterm Physics Dec 2026" value={paperForm.title} onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input type="text" className="form-control" placeholder="Physics" value={paperForm.subject} onChange={(e) => setPaperForm({ ...paperForm, subject: e.target.value })} required />
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBlock: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Assembled Questions ({paperForm.selectedQuestions.length})</strong>
                  <span style={{ float: 'right', fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700 }}>Total Marks: {paperForm.totalMarks}</span>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {paperForm.selectedQuestions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Select questions from the bank on the right, or use the Randomizer.
                    </div>
                  ) : (
                    paperForm.selectedQuestions.map((qId, idx) => {
                      const q = questions.find(qu => qu.id === qId);
                      if (!q) return null;
                      return (
                        <div key={qId} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Q{idx + 1} • {q.difficulty}</span>
                            <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.3rem', color: 'var(--color-danger)' }} onClick={() => {
                              const updated = paperForm.selectedQuestions.filter(id => id !== qId);
                              const updatedMarks = { ...paperForm.questionMarks };
                              delete updatedMarks[qId];
                              const nextTotal = updated.reduce((sum, id) => sum + (updatedMarks[id] || 0), 0);
                              setPaperForm({ ...paperForm, selectedQuestions: updated, questionMarks: updatedMarks, totalMarks: nextTotal });
                            }}>Remove</button>
                          </div>
                          <p style={{ fontSize: '0.8rem', margin: 0 }}>{q.questionText}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Custom Marks:</span>
                            <input type="number" style={{ width: '60px', padding: '0.15rem 0.25rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem' }} value={paperForm.questionMarks[qId] || 1} min="1" onChange={(e) => {
                              const custom = parseInt(e.target.value) || 1;
                              const updatedMarks = { ...paperForm.questionMarks, [qId]: custom };
                              const nextTotal = paperForm.selectedQuestions.reduce((sum, id) => sum + (updatedMarks[id] || 0), 0);
                              setPaperForm({ ...paperForm, questionMarks: updatedMarks, totalMarks: nextTotal });
                            }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Assemble Paper Template</button>
              </form>
            </div>

            {/* Right Column: Question Bank Selections & Randomizer */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Randomizer Widget */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)' }}>
                  <RotateCcw size={16} /> Random Question Generator
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <input type="text" className="form-control form-control-sm" placeholder="Subject..." value={paperQSubject} onChange={(e) => setPaperQSubject(e.target.value)} />
                  <select className="form-control form-select form-select-sm" value={paperQDifficulty} onChange={(e) => setPaperQDifficulty(e.target.value)}>
                    <option value="">Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <input type="number" className="form-control form-control-sm" value={randomCount} onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)} min="1" max="50" />
                </div>
                <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => {
                  let filtered = questions.filter(q => {
                    const matchesSubj = !paperQSubject || q.subject.toLowerCase().includes(paperQSubject.toLowerCase());
                    const matchesDiff = !paperQDifficulty || q.difficulty === paperQDifficulty;
                    return matchesSubj && matchesDiff;
                  });
                  if (filtered.length === 0) {
                    addToast('Generator Error', 'No questions match criteria.', 'warning');
                    return;
                  }
                  // Shuffle and pick
                  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
                  const selection = shuffled.slice(0, randomCount);
                  const newIds = [...paperForm.selectedQuestions];
                  const newMarks = { ...paperForm.questionMarks };
                  
                  selection.forEach(q => {
                    if (!newIds.includes(q.id)) {
                      newIds.push(q.id);
                      newMarks[q.id] = q.marks || 1;
                    }
                  });

                  const nextTotal = newIds.reduce((sum, id) => sum + (newMarks[id] || 0), 0);
                  setPaperForm({ ...paperForm, selectedQuestions: newIds, questionMarks: newMarks, totalMarks: nextTotal });
                  addToast('Added Randomly', `Selected and inserted ${selection.length} questions into paper.`, 'success');
                }}>Generate & Append</button>
              </div>

              {/* Individual Question Checklist */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Select Individual Questions</h4>
                <input type="text" className="form-control" style={{ width: '180px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} placeholder="Search..." value={paperQSearch} onChange={(e) => setPaperQSearch(e.target.value)} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px' }}>
                {questions
                  .filter(q => !paperQSearch || q.questionText.toLowerCase().includes(paperQSearch.toLowerCase()))
                  .map(q => {
                    const isChecked = paperForm.selectedQuestions.includes(q.id);
                    return (
                      <div key={q.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}>
                        <input type="checkbox" checked={isChecked} style={{ marginTop: '0.2rem' }} onChange={() => {
                          let updated = [...paperForm.selectedQuestions];
                          let updatedMarks = { ...paperForm.questionMarks };
                          if (isChecked) {
                            updated = updated.filter(id => id !== q.id);
                            delete updatedMarks[q.id];
                          } else {
                            updated.push(q.id);
                            updatedMarks[q.id] = q.marks || 1;
                          }
                          const nextTotal = updated.reduce((sum, id) => sum + (updatedMarks[id] || 0), 0);
                          setPaperForm({ ...paperForm, selectedQuestions: updated, questionMarks: updatedMarks, totalMarks: nextTotal });
                        }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{q.questionText}</div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{q.subject} • {q.difficulty} • Default Marks: {q.marks}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Rosters & Assignments */}
        {activeTab === 'assignments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title">Assign Students to Exam</h3>
              <form onSubmit={handleAssignmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Scheduled Exam *</label>
                  <select className="form-control form-select" value={assignmentForm.examId} onChange={(e) => setAssignmentForm({ ...assignmentForm, examId: e.target.value })} required>
                    <option value="">-- Choose Exam --</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.subject})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignment Method *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="radio" checked={assignmentForm.type === 'batch'} onChange={() => setAssignmentForm({ ...assignmentForm, type: 'batch' })} />
                      Assign by Batch
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="radio" checked={assignmentForm.type === 'branch'} onChange={() => setAssignmentForm({ ...assignmentForm, type: 'branch' })} />
                      Branch & Year Match
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="radio" checked={assignmentForm.type === 'roster'} onChange={() => setAssignmentForm({ ...assignmentForm, type: 'roster' })} />
                      Roll Number Roster List
                    </label>
                  </div>
                </div>

                {assignmentForm.type === 'batch' ? (
                  <div className="form-group">
                    <label className="form-label">Select Student Batch *</label>
                    <select className="form-control form-select" value={assignmentForm.batchId} onChange={(e) => setAssignmentForm({ ...assignmentForm, batchId: e.target.value })} required={assignmentForm.type === 'batch'}>
                      <option value="">-- Choose Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.department})</option>
                      ))}
                    </select>
                  </div>
                ) : assignmentForm.type === 'branch' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Branch Filter</label>
                      <select className="form-control form-select" value={assignmentForm.branch} onChange={(e) => setAssignmentForm({ ...assignmentForm, branch: e.target.value })}>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year Filter</label>
                      <select className="form-control form-select" value={assignmentForm.year} onChange={(e) => setAssignmentForm({ ...assignmentForm, year: e.target.value })}>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Paste Roster Roll Numbers (Comma or Newline separated) *</label>
                    <textarea className="form-control" rows="5" placeholder="e.g. ICS-2024-099, ICS-2024-101" value={assignmentForm.rosterText} onChange={(e) => setAssignmentForm({ ...assignmentForm, rosterText: e.target.value })} required={assignmentForm.type === 'roster'} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Assign Student Roster
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Rosters & Templates Downloads</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Download sample spreadsheets or review current student counts assigned to exams.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => downloadSampleTemplate('student')}>
                  <Download size={12} /> Student Import Template
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => downloadSampleTemplate('question')}>
                  <Download size={12} /> Question Import Template
                </button>
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Current Exam Assignment Summary</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {exams.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <span>{e.title}</span>
                    <strong>
                      {e.assignedStudents && e.assignedStudents.length > 0 ? `${e.assignedStudents.length} Students` : e.branchFilter ? `${e.branchFilter} - ${e.yearFilter}` : 'None'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Live Monitoring Node */}
        {activeTab === 'monitoring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title">Live Candidate Feed Monitor</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {attempts.filter(att => att.status === 'ongoing').length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlignment: 'center', color: 'var(--text-muted)' }}>
                    No students currently attempting exams. Start an exam on student portal to view feed.
                  </div>
                ) : (
                  attempts.filter(att => att.status === 'ongoing').map(att => {
                    const studentViolations = fraudEvents.filter(f => f.studentId === att.studentId && f.examId === att.examId);
                    return (
                      <div key={att.id} style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {/* Mock camera feed rendering a canvas pattern */}
                        <div style={{ position: 'relative', height: '140px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#0f0', fontFamily: 'monospace', fontSize: '0.75rem', position: 'absolute', top: '5px', left: '5px' }}>● LIVE FEED</span>
                          <Users size={48} style={{ color: '#fff', opacity: 0.15 }} />
                          {/* Highlight frame on warning */}
                          {studentViolations.length > 0 && (
                            <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--color-danger)', animation: 'pulse 1s infinite' }}></div>
                          )}
                        </div>
                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{att.studentName}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Violations: {studentViolations.length}</span>
                          <button className="btn btn-danger btn-sm" onClick={() => setTerminateTarget({ id: att.id, name: att.studentName })} style={{ marginTop: '0.5rem', width: '100%' }}>
                            Force Terminate ⭐
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Live Suspect Event Stream</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Student</th>
                      <th>Violation Node</th>
                      <th>Description</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudEvents.map(evt => (
                      <tr key={evt.id}>
                        <td>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                        <td><strong>{evt.studentName}</strong></td>
                        <td><span className="badge badge-warning">{evt.eventType}</span></td>
                        <td>{evt.description}</td>
                        <td>
                          <span className={`badge ${evt.severity === 'danger' ? 'badge-danger' : 'badge-warning'}`}>
                            {evt.severity === 'danger' ? 'High' : 'Medium'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. Email Outbox Log */}
        {activeTab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Control Panel */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 className="card-title" style={{ margin: 0 }}>SMTP Server Controller & Daemon Settings</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Manage local spool files, SMTP validation statuses, and delivery retries.
              </p>
              
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginTop: '0.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: smtpHealthy ? 'var(--color-success)' : 'var(--color-danger)',
                    boxShadow: smtpHealthy ? '0 0 10px var(--color-success)' : '0 0 10px var(--color-danger)',
                    transition: 'all 0.3s ease'
                  }}></div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      SMTP Status: 
                      <span style={{ color: smtpHealthy ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {smtpHealthy ? 'HEALTHY (Online)' : 'FAULTED (Offline)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {smtpHealthy ? 'Queue items process automatically every 5 seconds.' : 'Delivery paused. Emails are spooled in local outbox queue.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    className={`btn btn-${smtpHealthy ? 'danger' : 'success'} btn-sm`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setSmtpHealthy(!smtpHealthy)}
                  >
                    {smtpHealthy ? 'Simulate Outage' : 'Resolve Outage'}
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={retryFailedEmails}>
                    Retry Outbox Spool
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={clearEmailLogs}>
                    Purge Outbox & Spool
                  </button>
                </div>
              </div>
            </div>

            {/* Outbox Spool Queue */}
            <div className="card">
              <h3 className="card-title">Outbox Spool Queue ({emailQueue.length} items)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Active queue items pending validation, retry schedules, or experiencing gateway failures.
              </p>
              <div className="table-container">
                {emailQueue.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No pending/failed items in the outbox spool. All messages sent successfully.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>State Status</th>
                        <th>Attempts</th>
                        <th>Logs / Error Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailQueue.map(item => (
                        <tr key={item.id}>
                          <td><code>{item.to}</code></td>
                          <td><strong>{item.subject}</strong></td>
                          <td>
                            <span className={`badge badge-${
                              item.status === 'sent' ? 'success' :
                              item.status === 'failed' ? 'danger' :
                              'warning'
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td><code>{item.retryCount} / 3</code></td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {item.errorMessage ? (
                              <span style={{ color: 'var(--color-danger)' }}>{item.errorMessage}</span>
                            ) : (
                              item.status === 'pending' ? 'Queued for transmission' : 'Pending retry window'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Email Dispatch History Log */}
            <div className="card">
              <h3 className="card-title">Email Delivery History Log ({emailLogs.length} entries)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Permanent audit trail of successfully transmitted communication messages.
              </p>
              <div className="table-container">
                {emailLogs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Delivery history log is empty.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Recipient Address</th>
                        <th>Subject Line</th>
                        <th>Template Type</th>
                        <th>Message Payload Preview</th>
                        <th>Sent Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailLogs.map((log) => (
                        <tr key={log.id}>
                          <td><code>{log.to}</code></td>
                          <td><strong>{log.subject}</strong></td>
                          <td><span className="badge badge-info">{log.type}</span></td>
                          <td>
                            <pre style={{
                              margin: 0,
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '60px',
                              overflowY: 'auto',
                              backgroundColor: 'var(--bg-app)',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)'
                            }}>{log.body}</pre>
                          </td>
                          <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. Result Reports */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title">Completed Candidates Assessment Reports</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Subject Score</th>
                      <th>Violations count</th>
                      <th>Termination Reasons</th>
                      <th>Status State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.filter(att => att.status !== 'ongoing').map((att) => (
                      <tr key={att.id}>
                        <td><strong>{att.studentName}</strong></td>
                        <td><code>{att.score} / {att.totalQuestions}</code></td>
                        <td>{att.violationsCount} Violations</td>
                        <td style={{ color: 'var(--color-danger)' }}>{att.terminationReason || 'N/A'}</td>
                        <td>
                          <span className={`badge ${att.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. Audit Logs */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Onboarding & System Audit Trail</h3>
                <span className="badge badge-info">{auditLogs?.length || 0} Events Logged</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Complete chronological log of all account provisioning, login attempts, password resets, and system events.
              </p>
              <div className="table-container">
                {(!auditLogs || auditLogs.length === 0) ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ClipboardList size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>No audit events recorded yet.</p>
                  </div>
                ) : (
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Actor</th>
                        <th>Target</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <Clock size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${
                              log.action.includes('created') ? 'badge-success' :
                              log.action.includes('login') || log.action.includes('logout') ? 'badge-info' :
                              log.action.includes('terminated') || log.action.includes('fraud') ? 'badge-danger' :
                              'badge-warning'
                            }`}>
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td><strong>{log.actor}</strong></td>
                          <td><code>{log.target}</code></td>
                          <td style={{ maxWidth: '350px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Force Terminate Modal popup */}
      {terminateTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="card-title" style={{ color: 'var(--color-danger)' }}>Confirm Manual Exam Termination</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Are you sure you want to terminate the exam attempt for <strong>{terminateTarget.name}</strong>?
            </p>
            <div className="form-group">
              <label className="form-label">Termination Reason</label>
              <select className="form-control form-select" value={terminateReason} onChange={(e) => setTerminateReason(e.target.value)}>
                <option value="Secondary device usage flagged">Secondary device usage flagged</option>
                <option value="Unauthorized assistant present">Unauthorized assistant present</option>
                <option value="Suspicious head rotations detected">Suspicious head rotations detected</option>
                <option value="Webcam feed disconnected manually">Webcam feed disconnected manually</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setTerminateTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                forceTerminateExam(terminateTarget.id, terminateTarget.name, terminateReason);
                setTerminateTarget(null);
              }}>Confirm Terminate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPortal;
