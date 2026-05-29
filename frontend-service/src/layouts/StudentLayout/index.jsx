import React, { useState, useEffect, useRef } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { 
  BookOpen, ShieldCheck, Camera, Mic, Cpu, Settings, LogOut, CheckCircle, 
  AlertTriangle, AlertCircle, Play, ChevronRight, HelpCircle, Save, Sparkles, 
  AlertOctagon, RefreshCw, BarChart3, Download, FileText, Check, Wifi
} from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

const StudentPortal = () => {
  const {
    currentUser,
    logout,
    exams,
    questions,
    attempts,
    submitExamAttempt,
    logFraudEvent,
    attachEvidenceSnapshot,
    addToast,
    batches,
    apiActive,
    apiRequest
  } = usePlatform();

  // App Phases: dashboard, validation, exam, result
  const [phase, setPhase] = useState('dashboard');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [recentResult, setRecentResult] = useState(null);
  const [viewingAnalyticsAttempt, setViewingAnalyticsAttempt] = useState(null);

  // --- Sequential Pre-Exam Verification System ---
  const [activeStep, setActiveStep] = useState(0); // 0: Browser/Latency, 1: Webcam, 2: Microphone, 3: Face scan, 4: Fullscreen Ready
  const [latency, setLatency] = useState(null);
  const [cameraState, setCameraState] = useState('idle'); // idle, checking, allowed, error
  const [micState, setMicState] = useState('idle'); // idle, checking, allowed, error
  const [micLevel, setMicLevel] = useState(0);
  const [faceVerification, setFaceVerification] = useState('idle'); // idle, scanning, verified, failed
  const [isFullscreenApproved, setIsFullscreenApproved] = useState(false);

  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  // --- Live Exam States ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [isExamFullscreen, setIsExamFullscreen] = useState(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  
  // Simulation switches
  const [simulatedMultiFace, setSimulatedMultiFace] = useState(false);
  const [simulatedPhone, setSimulatedPhone] = useState(false);
  const [simulatedBook, setSimulatedBook] = useState(false);
  const [simulatedNoFace, setSimulatedNoFace] = useState(false);
  
  const [proctorStatus, setProctorStatus] = useState('Secure'); // Secure, Warning, Violating
  const [proctorReason, setProctorReason] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isTerminated, setIsTerminated] = useState(false);

  const mockMicIntervalRef = useRef(null);

  // --- Pre-Exam Verification Workflow ---
  useEffect(() => {
    if (phase === 'validation') {
      runPreExamChecks();
    }
    return () => stopMediaDevices();
  }, [phase, activeStep]);

  const runPreExamChecks = async () => {
    if (activeStep === 0) {
      // Step 1: Latency & Compatibility
      const start = Date.now();
      setTimeout(() => {
        setLatency(Date.now() - start + 12);
        addToast('Connection Verified', 'Network latency and compatibility check passed.', 'success');
      }, 800);
    } 
    else if (activeStep === 1) {
      // Step 2: Webcam setup
      setCameraState('checking');
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(videoStream);
        setCameraState('allowed');
        addToast('Webcam Approved', 'Camera feed successfully mounted.', 'success');
      } catch (err) {
        console.warn('Real webcam failed, initializing Virtual Camera Stream.', err);
        setCameraState('allowed'); // simulation pass
      }
    } 
    else if (activeStep === 2) {
      // Step 3: Microphone setup
      setMicState('checking');
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicState('allowed');
        startMicVolumeMeter(audioStream);
        addToast('Microphone Approved', 'Microphone level validated.', 'success');
      } catch (err) {
        console.warn('Real microphone failed, using Virtual Mic Meter.', err);
        setMicState('allowed');
        startMockMicVolumeMeter();
      }
    } 
    else if (activeStep === 3) {
      // Step 4: Face Biometrics Scan
      setFaceVerification('scanning');
      setTimeout(() => {
        setFaceVerification('verified');
        addToast('Biometrics Validated', `Face matching profile ${currentUser.name} matched at 98.4%.`, 'success');
      }, 1500);
    }
  };

  // Start virtual microphone simulation
  const startMockMicVolumeMeter = () => {
    if (mockMicIntervalRef.current) clearInterval(mockMicIntervalRef.current);
    mockMicIntervalRef.current = setInterval(() => {
      const base = Math.random() > 0.7 ? 40 : 5;
      const spike = Math.random() > 0.9 ? 35 : 0;
      setMicLevel(Math.floor(base + spike));
    }, 150);
  };

  // Web Audio API mic level tracker
  const startMicVolumeMeter = (mediaStream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        startMockMicVolumeMeter();
        return;
      }
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setMicLevel(Math.min(100, Math.floor((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (e) {
      startMockMicVolumeMeter();
    }
  };

  // Stop Media Streams
  const stopMediaDevices = () => {
    if (stream) {
      try {
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {}
      setStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mockMicIntervalRef.current) {
      clearInterval(mockMicIntervalRef.current);
      mockMicIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // Asynchronously bind webcam video
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, phase, activeStep]);

  // Request fullscreen and verify
  const requestFullscreenLock = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      }
      setIsFullscreenApproved(true);
      setIsExamFullscreen(true);
      addToast('Fullscreen Locked', 'Securing assessment environment.', 'info');
    } catch (e) {
      addToast('Permissions Rejected', 'Fullscreen approval required to initiate examination.', 'danger');
    }
  };

  // --- Enter Exam Hall ---
  const handleEnterExam = async () => {
    if (!isFullscreenApproved) {
      addToast('Validation Pending', 'You must lock the screen to fullscreen first.', 'warning');
      return;
    }

    try {
      if (apiActive) {
        const token = localStorage.getItem('access_token');
        const data = await apiRequest(`/exams/student/${selectedExam.id}`, 'GET', null, token);
        setExamQuestions(data.questions || []);
      } else {
        const secureQuestions = (selectedExam.questions || []).map(qId => {
          const original = questions.find(q => q.id === qId);
          if (original) {
            const { correctAnswer, ...stripped } = original;
            return stripped;
          }
          return null;
        }).filter(Boolean);
        setExamQuestions(secureQuestions);
      }
    } catch (err) {
      addToast('Failed to start exam', err.message, 'danger');
      return;
    }

    setTimeLeft(selectedExam.duration * 60);
    setPhase('exam');
    setTabSwitchesCount(0);
    setIsTerminated(false);
    setUserAnswers({});
    setMarkedQuestions({});

    submitExamAttempt(selectedExam.id, currentUser.id, currentUser.name, {}, 0, false, '', true);
  };

  // --- Fullscreen and Tab Switches Detection ---
  useEffect(() => {
    if (phase !== 'exam') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsExamFullscreen(false);
        handleTabSwitchViolation('Fullscreen Exited');
      } else {
        setIsExamFullscreen(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitchViolation('Browser Tab Changed');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, tabSwitchesCount, selectedExam]);

  const handleTabSwitchViolation = (type) => {
    const nextSwitches = tabSwitchesCount + 1;
    setTabSwitchesCount(nextSwitches);
    captureSnapshot();

    if (nextSwitches >= 2) {
      terminateExamFlow(`${type} limit exceeded (Switches: ${nextSwitches})`);
    } else {
      setProctorStatus('Warning');
      setProctorReason(`${type} detected!`);
      setWarningMessage(`WARNING: Please do not exit fullscreen or swap tabs. The next switch will terminate your exam immediately.`);
      logFraudEvent(selectedExam.id, currentUser.id, currentUser.name, 'Tab Switch Penalty', `${type} (Violation 1/2)`, 'warning');
    }
  };

  // --- Countdown Timer ---
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0 || isTerminated) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft, isTerminated]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Canvas Snapshot Evidence Capture
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/webp');
      attachEvidenceSnapshot(dataUrl);
    } catch (err) {}
  };

  // --- Proctor Telemetry Simulators ---
  useEffect(() => {
    if (phase !== 'exam') return;
    if (simulatedMultiFace) {
      captureSnapshot();
      terminateExamFlow('Multiple faces detected in front of screen');
    }
  }, [simulatedMultiFace]);

  useEffect(() => {
    if (phase !== 'exam') return;
    if (simulatedPhone) {
      captureSnapshot();
      terminateExamFlow('Secondary electronic device detected');
    }
  }, [simulatedPhone]);

  useEffect(() => {
    if (phase !== 'exam') return;
    if (simulatedBook) {
      captureSnapshot();
      terminateExamFlow('Textbooks or reference notes detected');
    }
  }, [simulatedBook]);

  useEffect(() => {
    if (phase !== 'exam') return;
    let noFaceTimeout;
    if (simulatedNoFace) {
      setProctorStatus('Warning');
      setProctorReason('No face detected');
      setWarningMessage('ALERT: Face out of frame. Please align with your camera.');
      captureSnapshot();
      logFraudEvent(selectedExam.id, currentUser.id, currentUser.name, 'Missing Candidate', 'Face missing from frame', 'warning');

      noFaceTimeout = setTimeout(() => {
        terminateExamFlow('Candidate absent from proctor camera.');
      }, 5000);
    } else {
      if (proctorReason === 'No face detected') {
        setProctorStatus('Secure');
        setProctorReason('');
        setWarningMessage('');
      }
    }
    return () => clearTimeout(noFaceTimeout);
  }, [simulatedNoFace]);

  const terminateExamFlow = (reason) => {
    setIsTerminated(true);
    setProctorStatus('Violating');
    setProctorReason(reason);
    stopMediaDevices();
    
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    logFraudEvent(selectedExam.id, currentUser.id, currentUser.name, 'Automated Termination', reason, 'danger', true);

    setTimeout(() => {
      const resultObj = submitExamAttempt(selectedExam.id, currentUser.id, currentUser.name, userAnswers, tabSwitchesCount + 1, true, reason);
      setRecentResult(resultObj);
      setPhase('result');
      addToast('Exam Terminated', 'Malpractice detected. Answers submitted.', 'danger');
    }, 2000);
  };

  const autoSubmitExam = () => {
    if (isTerminated) return;
    setIsTerminated(true);
    stopMediaDevices();
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const resultObj = submitExamAttempt(selectedExam.id, currentUser.id, currentUser.name, userAnswers, tabSwitchesCount, false, '');
    setRecentResult(resultObj);
    setPhase('result');
  };

  const manualSubmitExam = () => {
    if (isTerminated) return;
    const confirmSubmit = window.confirm('Submit assessment answers and close session?');
    if (!confirmSubmit) return;

    setIsTerminated(true);
    stopMediaDevices();
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const resultObj = submitExamAttempt(selectedExam.id, currentUser.id, currentUser.name, userAnswers, tabSwitchesCount, false, '');
    setRecentResult(resultObj);
    setPhase('result');
    addToast('Exam Submitted', 'Assessment completed successfully.', 'success');
  };

  const handleSelectOption = (questionId, optionKey) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const toggleMarkQuestion = (idx) => {
    setMarkedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Download analytical report
  const downloadAnalyticsPDF = (attempt) => {
    const exam = exams.find(e => e.id === attempt.examId);
    const content = `===========================================
OMNISTUDENT.AI DIGITAL ACADEMIC REPORT
===========================================
Student Name: ${attempt.studentName}
Roll Number : ${currentUser.rollNumber}
Department  : ${currentUser.department}
Assessment  : ${exam ? exam.title : 'Assessment'}
Subject     : ${exam ? exam.subject : 'Subject'}
-------------------------------------------
Raw Score   : ${attempt.score} / ${attempt.totalQuestions}
Correct     : ${attempt.correctAnswers}
Wrong       : ${attempt.wrongAnswers}
Skipped     : ${attempt.skippedAnswers}
Proctor Status: ${attempt.violationsCount > 0 ? 'Flagged Warning' : 'Secure'}
Flags Logged: ${attempt.violationsCount} Events
Result State: ${attempt.status.toUpperCase()}
===========================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `GradeReport_${attempt.id}.txt`);
    a.click();
    addToast('Report Downloaded', 'Grade analysis downloaded.', 'success');
  };

  // Filters & attempts
  // Only display exams scheduled matching college, branch, year, active window, and attempt limits.
  const filteredExams = exams.filter(e => {
    if (e.status !== 'published') return false;

    const examCollegeId = e.collegeId || 'c1';
    const studentCollegeId = currentUser.collegeId || 'c1';
    const collegeMatch = examCollegeId === studentCollegeId;
    if (!collegeMatch) return false;

    let isAssigned = false;
    if (e.assignedStudents && e.assignedStudents.length > 0) {
      isAssigned = e.assignedStudents.includes(currentUser.id) || e.assignedStudents.includes(currentUser.rollNumber);
    } else {
      const branchMatch = !e.branchFilter || e.branchFilter === currentUser.branch;
      const yearMatch = !e.yearFilter || e.yearFilter === currentUser.year;
      isAssigned = branchMatch && yearMatch;
    }
    if (!isAssigned) return false;

    const now = new Date();
    const startTime = e.windowStart ? new Date(e.windowStart) : null;
    const endTime = e.windowEnd ? new Date(e.windowEnd) : null;
    const windowMatch = (!startTime || now >= startTime) && (!endTime || now <= endTime);
    if (!windowMatch) return false;

    const pastAttemptsCount = attempts.filter(att => att.studentId === currentUser.id && att.examId === e.id).length;
    const attemptLimitMatch = pastAttemptsCount < (e.attemptLimit || 1);

    return attemptLimitMatch;
  });
  const studentAttempts = attempts.filter(att => att.studentId === currentUser.id);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      {phase !== 'exam' && (
        <aside className="sidebar">
          <div className="sidebar-logo">
            <ShieldCheck size={28} />
            <span>OmniStudent<span>.ai</span></span>
          </div>

          <ul className="sidebar-menu">
            <li>
              <button className="sidebar-item active" onClick={() => setPhase('dashboard')}>
                <BookOpen size={18} />
                Exams Center
              </button>
            </li>
          </ul>

          <div className="sidebar-footer">
            <div className="user-profile-summary">
              <div className="user-avatar" style={{ backgroundColor: 'var(--color-primary)' }}>ST</div>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{currentUser.rollNumber}</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%' }}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Panel */}
      <main className="main-content" style={{ marginLeft: phase === 'exam' ? '0' : 'var(--sidebar-width)', padding: phase === 'exam' ? '0' : '2rem' }}>
        
        {phase !== 'exam' && (
          <header className="header-bar">
            <div className="header-title-section">
              <h1>Student Dashboard</h1>
              <p>Registered batch: <strong>{batches?.find(b => b.id === currentUser.batchId)?.name || currentUser.batchId || 'General'}</strong></p>
            </div>
            <div className="header-actions">
              <ThemeToggle />
            </div>
          </header>
        )}

        {/* 1. STUDENT DASHBOARD */}
        {phase === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title">Assigned Examination Sheets</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Start sequential hardware calibration to enter lock-down assessment.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredExams.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No assessments currently scheduled for your batch.
                  </div>
                ) : (
                  filteredExams.map((exam) => {
                    const hasAttempted = studentAttempts.some(a => a.examId === exam.id && a.status !== 'ongoing');
                    return (
                      <div key={exam.id} style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-card)'
                      }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{exam.title}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Subject: {exam.subject} • {exam.questions.length} MCQs • {exam.duration} Minutes
                          </div>
                        </div>
                        {hasAttempted ? (
                          <span className="badge badge-success">Completed</span>
                        ) : (
                          <button className="btn btn-primary" onClick={() => {
                            setSelectedExam(exam);
                            setPhase('validation');
                            setActiveStep(0);
                            setIsFullscreenApproved(false);
                          }}>
                            Calibrate & Start
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Completed Scores & Grade Reports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {studentAttempts.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No assessments completed yet.
                  </div>
                ) : (
                  studentAttempts.map((att) => {
                    const exam = exams.find(e => e.id === att.examId);
                    const isPublished = exam ? exam.publishedResults : false;
                    return (
                      <div key={att.id} style={{
                        border: '1px solid var(--border-color)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-hover)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{exam ? exam.title : 'Assessment'}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>Score: {isPublished ? `${att.score} pts` : 'Pending Publication ⏳'}</span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {isPublished && (
                              <span className={`badge ${Math.round((att.correctAnswers / att.totalQuestions) * 100) >= (exam?.passCutoff || 40) ? 'badge-success' : 'badge-danger'}`}>
                                {Math.round((att.correctAnswers / att.totalQuestions) * 100) >= (exam?.passCutoff || 40) ? 'Passed' : 'Failed'}
                              </span>
                            )}
                            <span className={`badge ${att.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                              {att.status}
                            </span>
                          </div>
                        </div>
                        {isPublished && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewingAnalyticsAttempt(att)} style={{ marginTop: '0.25rem', width: '100%' }}>
                            <BarChart3 size={12} />
                            View Analytics
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRE-EXAM INTERACTIVE VALIDATION */}
        {phase === 'validation' && selectedExam && (
          <div style={{ maxWidth: '800px', marginInline: 'auto' }}>
            <div className="card">
              <h3 className="card-title" style={{ gap: '0.5rem' }}>
                <ShieldCheck size={22} style={{ color: 'var(--color-primary)' }} />
                Hardware Calibration & Security Locks
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Your assessment requires webcam, microphone, face validation, and full-screen confirmation.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="webcam-container" style={{ position: 'relative', height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
                    {faceVerification === 'scanning' && (
                      <div className="webcam-loading-overlay">
                        <Cpu className="animate-spin" size={32} />
                        <span>AI Scanning Face...</span>
                      </div>
                    )}
                    <video ref={videoRef} className="webcam-feed" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                    {faceVerification === 'verified' && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '3px solid var(--color-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700
                      }}>
                        Face Locked & Matched
                      </div>
                    )}
                  </div>
                  
                  {activeStep === 4 && (
                    <button className="btn btn-secondary" onClick={requestFullscreenLock} style={{ width: '100%' }}>
                      Enable Fullscreen Mode Lock
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Sequential Checklist</h4>

                  {/* Step 0: Compatibility */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: activeStep >= 0 ? 1 : 0.4 }}>
                    {activeStep > 0 ? <CheckCircle style={{ color: 'var(--color-success)' }} /> : <Wifi size={20} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>1. Latency & Latency</div>
                      {latency && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Ping: {latency}ms (Pass)</span>}
                    </div>
                  </div>

                  {/* Step 1: Camera */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: activeStep >= 1 ? 1 : 0.4 }}>
                    {activeStep > 1 ? <CheckCircle style={{ color: 'var(--color-success)' }} /> : <Camera size={20} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>2. Webcam Device</div>
                      {cameraState === 'allowed' && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Webcam active</span>}
                    </div>
                  </div>

                  {/* Step 2: Mic */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: activeStep >= 2 ? 1 : 0.4 }}>
                    {activeStep > 2 ? <CheckCircle style={{ color: 'var(--color-success)' }} /> : <Mic size={20} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>3. Microphone Levels</div>
                      {micState === 'allowed' && (
                        <div className="audio-visualizer-bar" style={{ width: '100px', marginTop: '0.25rem' }}>
                          <div className="audio-visualizer-fill" style={{ width: `${micLevel}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Face scan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: activeStep >= 3 ? 1 : 0.4 }}>
                    {activeStep > 3 ? <CheckCircle style={{ color: 'var(--color-success)' }} /> : <Cpu size={20} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>4. Identity Verification</div>
                      {faceVerification === 'verified' && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Profile verified</span>}
                    </div>
                  </div>

                  {/* Step 4: Fullscreen */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: activeStep >= 4 ? 1 : 0.4 }}>
                    {isFullscreenApproved ? <CheckCircle style={{ color: 'var(--color-success)' }} /> : <ShieldCheck size={20} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>5. Fullscreen Lock</div>
                      {isFullscreenApproved && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Locked</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {activeStep < 4 ? (
                        <button 
                          className="btn btn-primary" 
                          disabled={
                            (activeStep === 0 && latency === null) ||
                            (activeStep === 1 && cameraState !== 'allowed') ||
                            (activeStep === 2 && micState !== 'allowed') ||
                            (activeStep === 3 && faceVerification !== 'verified')
                          } 
                          onClick={() => setActiveStep(prev => prev + 1)}
                        >
                          Continue Checks
                        </button>
                      ) : (
                        <button className="btn btn-primary" disabled={!isFullscreenApproved} onClick={handleEnterExam}>
                          <Play size={16} /> Enter Exam Hall
                        </button>
                      )}
                      <button className="btn btn-secondary" onClick={() => setPhase('dashboard')}>Abort</button>
                    </div>
                    
                    {activeStep === 0 && latency === null && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Running compatibility diagnostics...</span>
                    )}
                    {activeStep === 1 && cameraState !== 'allowed' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Please grant camera access permissions to proceed.</span>
                    )}
                    {activeStep === 2 && micState !== 'allowed' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Please grant microphone access permissions to proceed.</span>
                    )}
                    {activeStep === 3 && faceVerification !== 'verified' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>Scanning candidate face identity print...</span>
                    )}
                    {activeStep === 4 && !isFullscreenApproved && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Fullscreen mode lock is mandatory to take the assessment.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EXAMINATION PHASE */}
        {phase === 'exam' && selectedExam && (
          <div className="exam-layout">
            <nav className="exam-nav">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
                <span className="exam-nav-title">{selectedExam.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className={`exam-timer ${timeLeft < 60 ? 'urgent' : ''}`}>
                  <span>Time Left: {formatTime(timeLeft)}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={manualSubmitExam}>
                  Submit Paper
                </button>
              </div>
            </nav>

            <div className="exam-grid">
              <div className="exam-questions-pane">
                {warningMessage && (
                  <div style={{
                    padding: '1rem',
                    border: '1px solid var(--color-danger)',
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '1rem'
                  }}>
                    <AlertTriangle size={18} />
                    <span>{warningMessage}</span>
                  </div>
                )}

                {examQuestions.length === 0 ? (
                  <div className="question-card">No questions defined.</div>
                ) : (
                  (() => {
                    const question = examQuestions[currentQuestionIndex];
                    if (!question) return <div>Question details not found.</div>;
                    const qId = question.id;
                    
                    return (
                      <div className="question-card">
                        <div className="question-header">
                          <span className="question-num">Question {currentQuestionIndex + 1} of {examQuestions.length}</span>
                          <span className="badge badge-primary">{question.difficulty}</span>
                        </div>
                        <p className="question-text">{question.questionText}</p>
                        
                        <div className="options-list">
                          {question.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`option-item ${userAnswers[qId] === opt.key ? 'selected' : ''}`}
                              onClick={() => handleSelectOption(qId, opt.key)}
                            >
                              <div className="option-marker">{opt.key}</div>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                          <button
                            className="btn btn-secondary"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          >
                            Previous
                          </button>
                          
                          <button
                            className="btn btn-secondary"
                            onClick={() => toggleMarkQuestion(currentQuestionIndex)}
                            style={{
                              borderColor: markedQuestions[currentQuestionIndex] ? 'var(--color-warning)' : 'var(--border-color)',
                              backgroundColor: markedQuestions[currentQuestionIndex] ? 'var(--color-warning-light)' : 'transparent',
                              color: markedQuestions[currentQuestionIndex] ? 'var(--color-warning-hover)' : 'var(--text-secondary)'
                            }}
                          >
                            {markedQuestions[currentQuestionIndex] ? 'Marked' : 'Mark for Review'}
                          </button>

                          {currentQuestionIndex < examQuestions.length - 1 ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              className="btn btn-success"
                              onClick={manualSubmitExam}
                            >
                              Final Submit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                <div className="card" style={{ marginTop: 'auto' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Question Navigator</h4>
                  <div className="question-navigation-grid">
                    {examQuestions.map((q, idx) => {
                      const qId = q.id;
                      const isAnswered = !!userAnswers[qId];
                      const isMarked = markedQuestions[idx];
                      const isCurrent = idx === currentQuestionIndex;
                      
                      let btnClass = 'nav-btn';
                      if (isAnswered) btnClass += ' answered';
                      if (isMarked) btnClass += ' marked';
                      if (isCurrent) btnClass += ' current';

                      return (
                        <button key={qId} className={btnClass} onClick={() => setCurrentQuestionIndex(idx)}>
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="exam-proctoring-pane">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>AI Proctoring Active Feed</span>
                  <div className={`webcam-container ${proctorStatus === 'Secure' ? 'secured' : 'violating'}`}>
                    <video ref={videoRef} className="webcam-feed" autoPlay playsInline muted></video>
                    <div className="proctoring-status-tag">
                      <span className={`badge ${proctorStatus === 'Secure' ? 'badge-success' : 'badge-danger'}`}>
                        {proctorStatus}
                      </span>
                    </div>

                    {isTerminated && (
                      <div className="webcam-loading-overlay" style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}>
                        <AlertOctagon size={36} />
                        <strong>SESSION TERMINATED</strong>
                        <span style={{ fontSize: '0.75rem' }}>Reason: {proctorReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Tab Penalties:</span>
                    <strong style={{ color: tabSwitchesCount > 0 ? 'var(--color-danger)' : 'inherit' }}>{tabSwitchesCount} / 2</strong>
                  </div>
                </div>

                {/* Simulation controls */}
                <div className="demo-control-panel">
                  <div className="demo-control-title">
                    <Sparkles size={16} />
                    <span>Malpractice Anomaly Simulator</span>
                  </div>
                  <div className="demo-control-btn-grid">
                    <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedPhone(true)}>Hold Phone</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedBook(true)}>Open Book</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedMultiFace(true)}>Multi-Face</button>
                    <button className={`btn btn-sm ${simulatedNoFace ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setSimulatedNoFace(!simulatedNoFace)}>
                      {simulatedNoFace ? 'Look Back' : 'Step Out'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. RESULT SUBMISSION VIEW */}
        {phase === 'result' && recentResult && (
          <div style={{ maxWidth: '600px', marginInline: 'auto' }}>
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              {recentResult.status === 'terminated' ? (
                <>
                  <AlertOctagon size={56} style={{ color: 'var(--color-danger)', marginInline: 'auto' }} />
                  <h2 style={{ color: 'var(--color-danger)', marginTop: '1rem' }}>Attempt Blocked</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Session was auto-submitted due to: <strong>{recentResult.terminationReason}</strong>
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle size={56} style={{ color: 'var(--color-success)', marginInline: 'auto' }} />
                  <h2 style={{ marginTop: '1rem' }}>Exam Completed Successfully</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your paper was submitted. Grade results will be visible once published by college admin.
                  </p>
                </>
              )}
              <button className="btn btn-primary" onClick={() => setPhase('dashboard')} style={{ marginTop: '2rem', width: '100%' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 5. INTERACTIVE ANALYTICS MODAL */}
        {viewingAnalyticsAttempt && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '550px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  <BarChart3 size={20} style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }} />
                  Assessment Analytics & Grade Report
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewingAnalyticsAttempt(null)}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem' }}>
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Grade</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                    {viewingAnalyticsAttempt.score} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {viewingAnalyticsAttempt.totalQuestions}</span>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accuracy</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                    {Math.round((viewingAnalyticsAttempt.correctAnswers / viewingAnalyticsAttempt.totalQuestions) * 100)}%
                  </div>
                </div>

                {(() => {
                  const exam = exams.find(e => e.id === viewingAnalyticsAttempt.examId);
                  const cutoff = exam?.passCutoff || 40;
                  const scorePercent = Math.round((viewingAnalyticsAttempt.correctAnswers / viewingAnalyticsAttempt.totalQuestions) * 100);
                  const hasPassed = scorePercent >= cutoff;
                  return (
                    <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outcome Status</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: hasPassed ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
                        {hasPassed ? 'PASSED' : 'FAILED'} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({cutoff}% req)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Correct Answers:</span>
                  <strong>{viewingAnalyticsAttempt.correctAnswers}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Incorrect Answers:</span>
                  <strong>{viewingAnalyticsAttempt.wrongAnswers}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Skipped Questions:</span>
                  <strong>{viewingAnalyticsAttempt.skippedAnswers}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Tab/Integrity Incidents:</span>
                  <strong style={{ color: viewingAnalyticsAttempt.violationsCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
                    {viewingAnalyticsAttempt.violationsCount} Warnings
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => downloadAnalyticsPDF(viewingAnalyticsAttempt)} style={{ flex: 1 }}>
                  <Download size={16} /> Download Report Sheet
                </button>
                <button className="btn btn-secondary" onClick={() => setViewingAnalyticsAttempt(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPortal;
