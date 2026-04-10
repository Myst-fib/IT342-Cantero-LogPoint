import React, { useState, useEffect } from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

const PURPOSES = ['Meeting', 'Interview', 'Delivery', 'Vendor Visit', 'Maintenance', 'Other'];
const DEPARTMENTS = ['Human Resources', 'Engineering', 'Finance', 'IT', 'Facilities', 'Executive', 'Other'];

function EditVisitorModal({ log, onClose, onSave }) {
  const [formData, setFormData] = useState({
    visitorName: '',
    purpose: '',
    otherPurpose: '',
    host: '',
    department: '',
    otherDepartment: '',
    contactNo: '',  // Changed from contactNumber to contactNo
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!log) return;

    const isOtherPurpose = !PURPOSES.slice(0, -1).includes(log.purposeName);
    const isOtherDept = !DEPARTMENTS.slice(0, -1).includes(log.departmentName);

    setFormData({
      visitorName: log.visitorName || '',
      purpose: isOtherPurpose ? 'Other' : (log.purposeName || ''),
      otherPurpose: isOtherPurpose ? (log.purposeName || '') : '',
      host: log.hostName || '',
      department: isOtherDept ? 'Other' : (log.departmentName || ''),
      otherDepartment: isOtherDept ? (log.departmentName || '') : '',
      contactNo: log.contactNo || '',  // Changed from contactNumber
    });
  }, [log]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.visitorName.trim()) return setError('Visitor name is required.');
    if (!formData.purpose) return setError('Please select a purpose.');
    if (formData.purpose === 'Other' && !formData.otherPurpose.trim()) return setError('Please specify the purpose.');
    if (!formData.host.trim()) return setError('Host name is required.');
    if (!formData.department) return setError('Please select a department.');
    if (formData.department === 'Other' && !formData.otherDepartment.trim()) return setError('Please specify the department.');
    if (!formData.contactNo.trim()) return setError('Contact number is required.');

    setLoading(true);
    setError('');
    
    try {
      const payload = {
        visitorName: formData.visitorName,
        purpose: formData.purpose === 'Other' ? formData.otherPurpose : formData.purpose,
        host: formData.host,
        department: formData.department === 'Other' ? formData.otherDepartment : formData.department,
        contactNo: formData.contactNo,  // Changed from contactNumber
      };

      console.log('Sending update payload:', payload); // Debug log

      const response = await fetch(`http://localhost:8080/api/visit-logs/${log.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const updated = await response.json();
        onSave(updated);
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        setError(errorText || 'Failed to update visitor.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-modal-card">
        <div className="edit-modal-header">
          <div>
            <div className="edit-modal-title">Edit Visitor</div>
            <div className="edit-modal-subtitle">ID #{log.id} — update the details below</div>
          </div>
          <button className="edit-modal-close" onClick={onClose}>
            <CloseOutlinedIcon />
          </button>
        </div>

        <div className="edit-modal-body">
          {error && <div className="edit-error-banner">{error}</div>}

          <div className="edit-form-grid">
            {/* Visitor Name */}
            <div className="edit-form-group full">
              <label className="form-label">Visitor Name <span className="required">*</span></label>
              <div className="input-icon-wrapper">
                <PersonOutlineIcon className="input-field-icon" />
                <input
                  type="text"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleChange}
                  className="form-input with-icon"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="edit-form-group">
              <label className="form-label">Purpose of Visit <span className="required">*</span></label>
              <div className="input-icon-wrapper">
                <AssignmentOutlinedIcon className="input-field-icon" />
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="form-input with-icon"
                >
                  <option value="">Select purpose</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Other Purpose */}
            {formData.purpose === 'Other' && (
              <div className="edit-form-group">
                <label className="form-label">Specify Purpose <span className="required">*</span></label>
                <div className="input-icon-wrapper">
                  <EditNoteOutlinedIcon className="input-field-icon" />
                  <input
                    type="text"
                    name="otherPurpose"
                    value={formData.otherPurpose}
                    onChange={handleChange}
                    className="form-input with-icon"
                    placeholder="Please specify the purpose"
                  />
                </div>
              </div>
            )}

            {/* Host */}
            <div className="edit-form-group">
              <label className="form-label">Host <span className="required">*</span></label>
              <div className="input-icon-wrapper">
                <BadgeOutlinedIcon className="input-field-icon" />
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  className="form-input with-icon"
                  placeholder="Who are they visiting?"
                />
              </div>
            </div>

            {/* Department */}
            <div className="edit-form-group">
              <label className="form-label">Department <span className="required">*</span></label>
              <div className="input-icon-wrapper">
                <BusinessOutlinedIcon className="input-field-icon" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-input with-icon"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Other Department */}
            {formData.department === 'Other' && (
              <div className="edit-form-group">
                <label className="form-label">Specify Department <span className="required">*</span></label>
                <div className="input-icon-wrapper">
                  <EditNoteOutlinedIcon className="input-field-icon" />
                  <input
                    type="text"
                    name="otherDepartment"
                    value={formData.otherDepartment}
                    onChange={handleChange}
                    className="form-input with-icon"
                    placeholder="Please specify the department"
                  />
                </div>
              </div>
            )}

            {/* Contact Number */}
            <div className="edit-form-group">
              <label className="form-label">Contact Number <span className="required">*</span></label>
              <div className="input-icon-wrapper">
                <PhoneOutlinedIcon className="input-field-icon" />
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  className="form-input with-icon"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="edit-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-save-edit" onClick={handleSubmit} disabled={loading}>
            <SaveOutlinedIcon className="btn-icon" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditVisitorModal;