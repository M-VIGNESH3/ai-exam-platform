import React, { useState } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { Building2, ShieldAlert, Cpu, Settings, Users, LogOut, CheckCircle, AlertTriangle, Plus, Globe, Sparkles } from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle';

const SuperAdminPortal = () => {
  const {
    currentUser,
    logout,
    colleges,
    onboardCollege,
    toggleCollegeStatus,
    exams,
    students,
    fraudEvents,
    managementAdmins,
    toggleManagementAdminStatus,
    forceResetManagementAdminPassword,
    resendManagementAdminCredentials
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({
    college_name: '',
    college_code: '',
    college_email: '',
    college_phone: '',
    address: '',
    admin_name: '',
    admin_email: ''
  });

  const [credentialsModal, setCredentialsModal] = useState(null);

  // Global Config form states
  const [tabSwitchLimit, setTabSwitchLimit] = useState(2);
  const [enableObjectDetection, setEnableObjectDetection] = useState(true);
  const [noFaceWarnTime, setNoFaceWarnTime] = useState(5);
  const [alertSeverityThreshold, setAlertSeverityThreshold] = useState('medium');

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    const result = await onboardCollege(formData);
    if (result && result.success) {
      setCredentialsModal({
        email: result.adminEmail,
        password: result.tempPassword,
        collegeName: formData.college_name
      });
      setFormData({
        college_name: '',
        college_code: '',
        college_email: '',
        college_phone: '',
        address: '',
        admin_name: '',
        admin_email: ''
      });
    }
  };

  // Helper Stats Calculations
  const activeCollegesCount = colleges.filter(c => c.status === 'active').length;
  const totalExamsCount = exams.length;
  const totalStudentsCount = students.length;
  const totalViolations = fraudEvents.length;
  const criticalViolations = fraudEvents.filter(f => f.severity === 'danger').length;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShieldAlert size={28} />
          <span>OmniSuper<span>.ai</span></span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <button
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Globe size={18} />
              Global Dashboard
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeTab === 'institutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('institutions')}
            >
              <Building2 size={18} />
              Colleges & Insts
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeTab === 'proctoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('proctoring')}
            >
              <ShieldAlert size={18} />
              Fraud Incidents
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeTab === 'ai-usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-usage')}
            >
              <Cpu size={18} />
              AI Infrastructure
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <Settings size={18} />
              Global Config
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar" style={{ backgroundColor: 'var(--color-danger)' }}>SA</div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">Super Admin</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="header-bar">
          <div className="header-title-section">
            <h1>Super Admin Operations</h1>
            <p>Global cloud-platform monitoring & institution control nodes</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
          </div>
        </header>

        {/* Global Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  <Building2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Institutions Onboarded</span>
                  <span className="stat-value">{colleges.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Global Enrolled Students</span>
                  <span className="stat-value">{totalStudentsCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                  <Globe size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Examinations Conducted</span>
                  <span className="stat-value">{totalExamsCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                  <ShieldAlert size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Malpractice Incidents Logged</span>
                  <span className="stat-value">{totalViolations}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
              <div className="card">
                <h3 className="card-title">
                  <Sparkles size={18} />
                  Real-time System Load & AI Demands
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Active GPU pipelines executing TensorFlow models for webcam frames validation globally.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <span>AI Model Inference Queue (Avg 12ms)</span>
                      <span>84% Capacity</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <span>Global Media Streaming Connections</span>
                      <span>1,248 concurrent feeds</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '62%', height: '100%', backgroundColor: 'var(--color-info)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <span>Storage Capacity (Evidence Records)</span>
                      <span>42.1 TB / 100 TB</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '42%', height: '100%', backgroundColor: 'var(--color-success)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Proctor Severity Split</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-danger)' }}>Critical Violations</span>
                    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--color-danger)' }}>{criticalViolations}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)' }}>Warnings Issued</span>
                    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--color-warning)' }}>{totalViolations - criticalViolations}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Automated enforcement matches policies configured in System Settings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Institutions Management */}
        {activeTab === 'institutions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
            <div className="card" style={{ alignSelf: 'start' }}>
              <h3 className="card-title">
                <Plus size={18} />
                Onboard New College
              </h3>
              <form onSubmit={handleCreateCollege} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="college-name">College Name *</label>
                  <input
                    id="college-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Imperial College of Science"
                    value={formData.college_name}
                    onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="college-code">College Code (Unique Domain) *</label>
                  <input
                    id="college-code"
                    type="text"
                    className="form-control"
                    placeholder="e.g. IMPERIAL"
                    value={formData.college_code}
                    onChange={(e) => setFormData({ ...formData, college_code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="college-email">Official Contact Email *</label>
                  <input
                    id="college-email"
                    type="email"
                    className="form-control"
                    placeholder="contact@imperial.edu"
                    value={formData.college_email}
                    onChange={(e) => setFormData({ ...formData, college_email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="college-phone">Official Phone</label>
                  <input
                    id="college-phone"
                    type="text"
                    className="form-control"
                    placeholder="+1 555-0199"
                    value={formData.college_phone}
                    onChange={(e) => setFormData({ ...formData, college_phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="college-address">Institution Address</label>
                  <input
                    id="college-address"
                    type="text"
                    className="form-control"
                    placeholder="100 Innovation Way, Boston"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem', marginTop: '0.5rem' }}>College Administrator Details</h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-name">Admin Full Name *</label>
                  <input
                    id="admin-name"
                    type="text"
                    className="form-control"
                    placeholder="Prof. James Moriarty"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-email">Admin Email *</label>
                  <input
                    id="admin-email"
                    type="email"
                    className="form-control"
                    placeholder="moriarty@imperial.edu"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Plus size={16} />
                  Authorize & Create Admin
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Authorized Institution Nodes</h3>
              <div className="table-container" style={{ marginTop: '0.5rem' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Depts</th>
                      <th>Exams</th>
                      <th>Administrator</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colleges.map((college) => {
                      const admin = managementAdmins.find(a => a.collegeId === college.id);
                      return (
                        <tr key={college.id}>
                          <td>
                            <strong>{college.name}</strong>
                          </td>
                          <td>
                            <code>{college.code}</code>
                          </td>
                          <td>{college.departmentCount}</td>
                          <td>{college.examCount}</td>
                          <td>
                            {admin ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>{admin.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{admin.email}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${college.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {college.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className={`btn btn-sm ${college.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => {
                                  toggleCollegeStatus(college.id);
                                  if (admin) {
                                    toggleManagementAdminStatus(admin.id);
                                  }
                                }}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {college.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              {admin && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      if (window.confirm(`Force password reset for admin ${admin.name}?`)) {
                                        forceResetManagementAdminPassword(admin.id);
                                      }
                                    }}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-warning)', borderColor: 'rgba(255, 193, 7, 0.2)' }}
                                    title="Force Reset Password"
                                  >
                                    Reset
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => resendManagementAdminCredentials(admin.id)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    title="Resend Credentials Email"
                                  >
                                    Resend
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Global Fraud monitoring logs */}
        {activeTab === 'proctoring' && (
          <div className="card">
            <h3 className="card-title">Global Malpractice Stream</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Listing all AI-flagged incidents across all examinations in real-time.
            </p>

            <div className="table-container" style={{ marginTop: '0.5rem' }}>
              {fraudEvents.length === 0 ? (
                <div style={{ padding: '2rem', textAlignment: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle size={32} style={{ color: 'var(--color-success)', marginBottom: '0.5rem', display: 'block', marginInline: 'auto' }} />
                  No malpractice activities registered in the current monitoring frame.
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Student</th>
                      <th>Violation Type</th>
                      <th>Description</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudEvents.map((evt) => (
                      <tr key={evt.id}>
                        <td>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                        <td>{evt.studentName}</td>
                        <td>
                          <span className="badge badge-warning">{evt.eventType}</span>
                        </td>
                        <td>{evt.description}</td>
                        <td>
                          <span className={`badge ${evt.severity === 'danger' ? 'badge-danger' : 'badge-warning'}`}>
                            {evt.severity === 'danger' ? 'Critical' : 'Warning'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* AI Processing Infrastructure */}
        {activeTab === 'ai-usage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title">AI Processing Layer Capabilities</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Overview of models running locally or through API integrations to support the examination workflow.
              </p>
              <div className="stats-grid" style={{ marginTop: '0.5rem' }}>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Webcam Object Detection</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)' }}>Mobile Phone, Book, Notes</span>
                    <span className="badge badge-info" style={{ marginTop: '0.25rem', width: 'fit-content' }}>COCO-SSD (Free)</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Face Verification System</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)' }}>Biometric Match & Multi-Face</span>
                    <span className="badge badge-info" style={{ marginTop: '0.25rem', width: 'fit-content' }}>Face-API (Free)</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">AI Assessment Generation</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)' }}>Automatic MCQ Construction</span>
                    <span className="badge badge-info" style={{ marginTop: '0.25rem', width: 'fit-content' }}>Offline Parser & NLP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Configurations */}
        {activeTab === 'config' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3 className="card-title">
              <Settings size={18} />
              Global Proctoring & Security Policies
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure automatic enforcement parameters that propagate to individual exams.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tab-switches-limit">Maximum Browser Tab Switches Before Termination</label>
                <input
                  id="tab-switches-limit"
                  type="number"
                  className="form-control"
                  value={tabSwitchLimit}
                  onChange={(e) => setTabSwitchLimit(parseInt(e.target.value) || 1)}
                  min="1"
                  max="5"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={enableObjectDetection}
                    onChange={(e) => setEnableObjectDetection(e.target.checked)}
                  />
                  Enable AI Object Detection (Webcam Phone & Book Scans)
                </label>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="no-face-warn-time">Student Missing "No Face" Warning Threshold (Seconds)</label>
                <input
                  id="no-face-warn-time"
                  type="number"
                  className="form-control"
                  value={noFaceWarnTime}
                  onChange={(e) => setNoFaceWarnTime(parseInt(e.target.value) || 1)}
                  min="2"
                  max="15"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="anomaly-severity">Anomaly Alert Severity Trigger</label>
                <select
                  id="anomaly-severity"
                  className="form-control form-select"
                  value={alertSeverityThreshold}
                  onChange={(e) => setAlertSeverityThreshold(e.target.value)}
                >
                  <option value="low">Low (Log Violations, Issue Warning Popups)</option>
                  <option value="medium">Medium (Issue Warnings, Auto-Submit on Tab Swapped)</option>
                  <option value="high">High (Immediate Exam Termination on Any Violation)</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => addToast('Config Updated', 'Global proctoring policies saved & applied.', 'success')}
                style={{ width: 'fit-content', alignSelf: 'flex-start' }}
              >
                Save Policies
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Credentials Popup Modal */}
      {credentialsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '2rem', border: '1px solid var(--color-primary)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', margin: 0 }}>
              <CheckCircle size={24} />
              College Authorized Successfully
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: '1rem' }}>
              The college admin account has been generated for <strong>{credentialsModal.collegeName}</strong>.
            </p>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Admin Login Email:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: '0.2rem' }}>{credentialsModal.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Temporary Password:</span>
                <div style={{
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--color-warning)',
                  background: 'var(--color-warning-light)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  width: 'fit-content',
                  marginTop: '0.2rem',
                  fontSize: '1rem'
                }}>{credentialsModal.password}</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              These credentials have been dispatched to the admin's email address. The admin will be prompted to reset this password upon first login.
            </p>
            
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={() => setCredentialsModal(null)}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPortal;
