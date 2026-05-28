import React, { useState } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { ShieldAlert, Lock, CheckCircle, XCircle, LogOut } from 'lucide-react';

const ForcedPasswordReset = () => {
  const { currentUser, resetInitialPassword, logout } = usePlatform();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password Validation Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const matchesConfirm = newPassword && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg('Please satisfy all password complexity criteria.');
      return;
    }
    if (!matchesConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    resetInitialPassword(currentUser.email, currentUser.role, newPassword);
  };

  return (
    <div className="auth-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '460px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ color: 'var(--color-warning)' }}>
              <ShieldAlert size={32} />
              <span>OmniProctor<span>.ai</span></span>
            </div>
            <h2 className="auth-title" style={{ marginTop: '0.5rem' }}>Setup Secure Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Your account was created with a temporary key. Please initialize your secure credentials before accessing the dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger" style={{ fontSize: '0.85rem', padding: '0.75rem', borderRadius: '6px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
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
                  id="new-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
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
                  id="confirm-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  required
                />
              </div>
            </div>

            {/* Validation Checklist Panel */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                Security Requirements:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasMinLength ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {hasMinLength ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>At least 8 characters long</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasUppercase ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {hasUppercase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasLowercase ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {hasLowercase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>At least 1 lowercase letter (a-z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasNumber ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {hasNumber ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>At least 1 number (0-9)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasSpecial ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {hasSpecial ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>At least 1 special character (@, #, $, etc.)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: matchesConfirm ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {matchesConfirm ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>Passwords match exactly</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-light)'
                }}
                onClick={logout}
              >
                <LogOut size={16} /> Back to Sign In
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1.5 }}
                disabled={!isPasswordValid || !matchesConfirm}
              >
                Activate Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcedPasswordReset;
