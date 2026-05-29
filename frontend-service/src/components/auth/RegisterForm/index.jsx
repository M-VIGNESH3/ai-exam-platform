import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../../contexts/PlatformContext';
import { ShieldCheck, Mail, Lock, User, Calendar, Phone, Upload, Eye, EyeOff, Search, Compass, ChevronRight, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

const StudentRegister = ({ onBackToLogin }) => {
  const { colleges, students, registerStudent, verifyStudentOtp, sendMockEmail, addToast, apiActive } = usePlatform();

  // Registration step state
  // 1: College selection, 2: Form inputs, 3: Email verification
  const [step, setStep] = useState(1);

  // College search state
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Form inputs state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    branch: 'CSE',
    year: '1st Year',
    mobileNumber: '',
    gender: 'Male',
    section: 'A',
    semester: '1st Semester',
    dateOfBirth: '',
    profilePhoto: '',
    password: '',
    confirmPassword: '',
    githubProfile: '',
    linkedinProfile: ''
  });

  // Security/visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Verification states
  const [sentCode, setSentCode] = useState('');
  const [userVerificationCode, setUserVerificationCode] = useState('');

  // Password checklist states
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  // Filter colleges based on search
  useEffect(() => {
    if (collegeSearch.trim() === '') {
      setSuggestions([]);
      return;
    }
    const query = collegeSearch.toLowerCase();
    const filtered = colleges.filter(
      c => c.status === 'active' &&
      (c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query))
    );
    setSuggestions(filtered);
  }, [collegeSearch, colleges]);

  const handleSelectCollege = (college) => {
    setSelectedCollege(college);
    setCollegeSearch(college.name);
    setSuggestions([]);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const validBranches = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    if (!selectedCollege) {
      return 'You must select an existing college';
    }
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      return 'Full Name must be at least 2 characters';
    }
    if (!emailRegex.test(formData.email)) {
      return 'Invalid email format';
    }
    if (students.some(s => s.email.toLowerCase() === formData.email.toLowerCase())) {
      return 'Email address is already registered';
    }
    if (!formData.rollNumber.trim()) {
      return 'Roll Number is required';
    }
    if (students.some(s => s.rollNumber.toLowerCase() === formData.rollNumber.toLowerCase())) {
      return 'Roll Number is already registered';
    }
    if (!validBranches.includes(formData.branch)) {
      return 'Invalid branch selected';
    }
    if (!validYears.includes(formData.year)) {
      return 'Invalid year selected';
    }
    if (!mobileRegex.test(formData.mobileNumber)) {
      return 'Mobile Number must be exactly 10 digits';
    }
    if (!formData.dateOfBirth) {
      return 'Date of Birth is required';
    }
    if (!formData.section.trim()) {
      return 'Section is required';
    }
    // Profile photo is optional
    if (!isPasswordStrong) {
      return 'Password does not meet strength requirements';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      addToast('Validation Error', error, 'danger');
      return;
    }

    if (apiActive) {
      const result = await registerStudent({
        ...formData,
        profilePhoto: formData.profilePhoto.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.fullName)}`,
        collegeId: selectedCollege.id
      });
      if (result.success) {
        if (result.otp) {
          setSentCode(result.otp);
        }
        setStep(3);
      }
    } else {
      // Generate simulated 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      
      // Send email to student
      sendMockEmail(
        formData.email,
        'OmniProctor Verification Code',
        'email_verification',
        `Dear ${formData.fullName},\n\nThank you for registering at OmniProctor.ai.\n\nYour 6-digit email verification code is: ${code}\n\nPlease enter this code in the registration panel to activate your account.\n\nBest regards,\nOmniProctor.ai Team`
      );

      // Toast code so they can verify without looking at logs if needed
      addToast('Verification Sent', `Verification code sent to ${formData.email}. Mock code is: ${code}`, 'info');
      setStep(3);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (apiActive) {
      const result = await verifyStudentOtp(formData.email, userVerificationCode);
      if (result.success) {
        onBackToLogin();
      }
    } else {
      if (userVerificationCode === sentCode) {
        // Register student in context state
        const result = await registerStudent({
          ...formData,
          profilePhoto: formData.profilePhoto.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.fullName)}`,
          collegeId: selectedCollege.id
        });
        if (result.success) {
          onBackToLogin();
        }
      } else {
        addToast('Verification Failed', 'Invalid verification code. Please check your email outbox logs.', 'danger');
      }
    }
  };

  return (
    <div className="auth-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '580px' }}>
        <div className="auth-card" style={{ padding: '2rem' }}>
          <div className="auth-header">
            <div className="auth-logo">
              <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
              <span>OmniProctor<span>.ai</span></span>
            </div>
            <h2 className="auth-title" style={{ marginTop: '0.5rem' }}>Student Self Registration</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Create your secure examination credentials
            </p>
          </div>

          {/* STEP 1: SEARCH COLLEGE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>1. Search & Select Your College</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Students can only register if the college is already onboarded by Super Admin.
                </p>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Search by college name or code (e.g. ICS, Stanford)..."
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                  />
                </div>

                {suggestions.length > 0 && (
                  <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    marginTop: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10
                  }}>
                    {suggestions.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCollege(c)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        className="suggestion-item"
                      >
                        <strong>{c.name}</strong>
                        <span className="badge badge-info">{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {collegeSearch.trim() !== '' && suggestions.length === 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                    No active matching college found. Contact your college administration.
                  </div>
                )}
              </div>

              <button className="btn btn-secondary btn-sm" onClick={onBackToLogin} style={{ alignSelf: 'flex-start' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          )}

          {/* STEP 2: FILL REGISTRATION FORM */}
          {step === 2 && selectedCollege && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Selected Institution: <strong>{selectedCollege.name} ({selectedCollege.code})</strong></span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(1)} style={{ padding: '0.2rem 0.5rem' }}>Change</button>
              </div>

              {validationError && (
                <div style={{
                  padding: '0.75rem',
                  border: '1px solid var(--color-danger)',
                  backgroundColor: 'var(--color-danger-light)',
                  color: 'var(--color-danger)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="fullName" className="form-control" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} placeholder="john@student.edu" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number (Default Login User ID) *</label>
                  <input type="text" name="rollNumber" className="form-control" value={formData.rollNumber} onChange={handleInputChange} placeholder="CSE2025001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="text" name="mobileNumber" className="form-control" value={formData.mobileNumber} onChange={handleInputChange} placeholder="10-digit number" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select name="branch" className="form-control form-select" value={formData.branch} onChange={handleInputChange}>
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="ECE">ECE (Electronics & Comm)</option>
                    <option value="EEE">EEE (Electrical & Electronics)</option>
                    <option value="ME">ME (Mechanical Eng)</option>
                    <option value="CE">CE (Civil Eng)</option>
                    <option value="IT">IT (Information Technology)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <select name="year" className="form-control form-select" value={formData.year} onChange={handleInputChange}>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select name="semester" className="form-control form-select" value={formData.semester} onChange={handleInputChange}>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <input type="text" name="section" className="form-control" value={formData.section} onChange={handleInputChange} placeholder="A" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" name="dateOfBirth" className="form-control" value={formData.dateOfBirth} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select name="gender" className="form-control form-select" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Profile Photo URL (Optional)</label>
                  <input type="text" name="profilePhoto" className="form-control" value={formData.profilePhoto} onChange={handleInputChange} placeholder="https://api.dicebear.com/7.x/adventurer/svg?seed=John" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulate a profile photo by providing an image URL.</span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>Security Credentials</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password checklist */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}>
                <div style={{ gridColumn: 'span 2', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Password Rules Checklist:</div>
                <div style={{ color: hasMinLength ? 'var(--color-success)' : 'var(--text-muted)' }}>✓ Min 8 characters</div>
                <div style={{ color: hasUppercase ? 'var(--color-success)' : 'var(--text-muted)' }}>✓ 1 Uppercase (A-Z)</div>
                <div style={{ color: hasLowercase ? 'var(--color-success)' : 'var(--text-muted)' }}>✓ 1 Lowercase (a-z)</div>
                <div style={{ color: hasNumber ? 'var(--color-success)' : 'var(--text-muted)' }}>✓ 1 Number (0-9)</div>
                <div style={{ color: hasSpecial ? 'var(--color-success)' : 'var(--text-muted)', gridColumn: 'span 2' }}>✓ 1 Special Character (@, #, $, etc.)</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>Professional Profiles (Optional)</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">GitHub Profile Link</label>
                  <input type="url" name="githubProfile" className="form-control" value={formData.githubProfile} onChange={handleInputChange} placeholder="https://github.com/username" />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile Link</label>
                  <input type="url" name="linkedinProfile" className="form-control" value={formData.linkedinProfile} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!isPasswordStrong || formData.password !== formData.confirmPassword}>
                  Send Verification Code <ChevronRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: EMAIL VERIFICATION */}
          {step === 3 && (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <Mail size={48} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
                <h3 style={{ marginTop: '1rem' }}>Verify Your Email</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  A verification email has been dispatched to <strong>{formData.email}</strong>.
                  Enter the 6-digit activation code sent to your inbox.
                </p>
                {apiActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-success)',
                      background: 'var(--color-success-light)',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Live Environment: Please check your email inbox or the Admin Email Outbox Log.
                    </div>
                    {sentCode && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-warning)',
                        background: 'var(--color-warning-light)',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        Debug Fallback: Your verification code is <strong>{sentCode}</strong>.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-warning)',
                    background: 'var(--color-warning-light)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    Interactive Simulation: check out the SMTP outbox logs or copy the toast alert code. Code is <strong>{sentCode}</strong>.
                  </div>
                )}
              </div>

              <div className="form-group" style={{ maxWidth: '280px', margin: '0 auto', width: '100%' }}>
                <label className="form-label" style={{ textAlign: 'center' }}>6-Digit Verification Code</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                  maxLength="6"
                  placeholder="000000"
                  value={userVerificationCode}
                  onChange={(e) => setUserVerificationCode(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Activate Account & Login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
