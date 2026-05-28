import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../../contexts/PlatformContext';
import { ShieldCheck, Mail, Lock, KeyRound, Eye, EyeOff, Check, X, ArrowLeft, RefreshCw } from 'lucide-react';

export default function StudentActivation({ onBackToLogin }) {
  const { activateStudent, apiRequest, addToast } = usePlatform();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Pre-fill from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const otpParam = params.get('otp');
    if (emailParam) setEmail(emailParam);
    if (otpParam) setOtp(otpParam);
  }, []);

  // Password requirements checklist
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !password || !confirmPassword) {
      addToast('Validation Error', 'All fields are required.', 'danger');
      return;
    }
    if (!isPasswordValid) {
      addToast('Validation Error', 'Password does not meet safety criteria.', 'danger');
      return;
    }
    if (!passwordsMatch) {
      addToast('Validation Error', 'Passwords do not match.', 'danger');
      return;
    }

    setIsSubmitting(true);
    const success = await activateStudent(email, password, otp);
    setIsSubmitting(false);

    if (success) {
      // Clear query params to tidy up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      onBackToLogin();
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      addToast('Validation Error', 'Please enter your email to request a new code.', 'danger');
      return;
    }
    setIsResending(true);
    try {
      // Hit resend-otp API or simulation
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Code Sent', data.message || 'A new verification code has been sent.', 'success');
      } else {
        addToast('Resend Failed', data.message || 'Could not dispatch code.', 'danger');
      }
    } catch (err) {
      addToast('Resend Failed', 'Offline / Connection Error', 'danger');
    } finally {
      setIsResending(false);
    }
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
              Student Account Invitation Activation
            </p>
            <h2 className="auth-title">Activate Account</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="activate-email">Email Address</label>
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
                  id="activate-email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* OTP Code */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="activate-otp">6-Digit Verification Code</label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending || !email}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.75rem',
                    cursor: email ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    opacity: email ? 1 : 0.5
                  }}
                >
                  <RefreshCw size={12} className={isResending ? 'spin' : ''} />
                  Resend Code
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound
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
                  id="activate-otp"
                  type="text"
                  maxLength={6}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', letterSpacing: '4px', fontWeight: 'bold' }}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="activate-password">Set New Password</label>
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
                  id="activate-password"
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

              {/* Password strength visual guidelines */}
              {password && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Password Security Checklist:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasMinLength ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {hasMinLength ? <Check size={12} /> : <X size={12} />}
                    At least 8 characters long
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasUppercase ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {hasUppercase ? <Check size={12} /> : <X size={12} />}
                    Contains uppercase letter (A-Z)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasLowercase ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {hasLowercase ? <Check size={12} /> : <X size={12} />}
                    Contains lowercase letter (a-z)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasNumber ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {hasNumber ? <Check size={12} /> : <X size={12} />}
                    Contains number (0-9)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasSpecial ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {hasSpecial ? <Check size={12} /> : <X size={12} />}
                    Contains special symbol (@, $, %, etc.)
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="activate-confirm-password">Confirm Password</label>
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
                  id="activate-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <div style={{
                  marginTop: '0.4rem',
                  fontSize: '0.75rem',
                  color: passwordsMatch ? 'var(--color-success)' : 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {passwordsMatch ? <Check size={12} /> : <X size={12} />}
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isSubmitting || !isPasswordValid || !passwordsMatch || !otp || !email}
            >
              {isSubmitting ? 'Activating Profile...' : 'Activate Account & Set Password'}
            </button>
          </form>

          {/* Back to Login option */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            textAlign: 'center'
          }}>
            <button
              onClick={onBackToLogin}
              className="btn btn-secondary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <ArrowLeft size={16} />
              Return to Login Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
