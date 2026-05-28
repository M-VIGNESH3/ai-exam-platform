import React, { useState } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { ShieldCheck, Mail, Lock, LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = usePlatform();
  const [role, setRole] = useState('management'); // Default to management, the most important role
  const [email, setEmail] = useState('admin@ics.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password, role);
  };

  const handleAutofill = (selectedRole, defaultEmail) => {
    setRole(selectedRole);
    setEmail(defaultEmail);
    setPassword('admin123');
  };

  return (
    <div className="auth-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '440px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
              <span>OmniProctor<span>.ai</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Enterprise Assessment & AI Proctoring Ecosystem
            </p>
            <h2 className="auth-title">Sign in to your Portal</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label">Choose Your Role</label>
            <div className="role-selector">
              <div
                className={`role-pill ${role === 'super_admin' ? 'active' : ''}`}
                onClick={() => handleAutofill('super_admin', 'superadmin@platform.com')}
              >
                Super Admin
              </div>
              <div
                className={`role-pill ${role === 'management' ? 'active' : ''}`}
                onClick={() => handleAutofill('management', 'admin@ics.edu')}
              >
                College Admin
              </div>
              <div
                className={`role-pill ${role === 'student' ? 'active' : ''}`}
                onClick={() => handleAutofill('student', 'john.doe@student.edu')}
              >
                Student
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  id="email-input"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }}>
              <LogIn size={18} />
              Sign In
            </button>
          </form>
        </div>

        {/* Demo Assistant Card */}
        <div
          className="card"
          style={{
            border: '1px dashed var(--color-primary)',
            backgroundColor: 'var(--color-primary-light)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
            <Sparkles size={16} />
            <span>Interactive Demo Assistant</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Click any account below to instantly switch roles and populate credentials:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => handleAutofill('super_admin', 'superadmin@platform.com')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>Super Admin:</strong> <span>superadmin@platform.com</span>
            </button>
            <button
              onClick={() => handleAutofill('management', 'admin@ics.edu')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>College Management:</strong> <span>admin@ics.edu</span>
            </button>
             <button
              onClick={() => handleAutofill('student', 'john.doe@student.edu')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>Student (John Doe):</strong> <span>john.doe@student.edu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
