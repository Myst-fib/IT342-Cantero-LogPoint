// AddVisitor.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AddVisitor.css';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

function AddVisitor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    visitorName: '',
    purpose: '',
    otherPurpose: '',
    host: '',
    department: '',
    otherDepartment: '',
    contactNumber: '+63 9',
    timeIn: '',
  });

  const [currentDate, setCurrentDate] = useState('');

  const getPhilippineTime = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const hours = philippineTime.getHours().toString().padStart(2, '0');
    const minutes = philippineTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getPhilippineDate = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return philippineTime.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, timeIn: getPhilippineTime() }));
    setCurrentDate(getPhilippineDate());

    const interval = setInterval(() => {
      setFormData(prev => ({ ...prev, timeIn: getPhilippineTime() }));
      setCurrentDate(getPhilippineDate());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.visitorName) { alert('Please enter visitor name'); return; }
    if (!formData.purpose) { alert('Please select a purpose of visit'); return; }
    if (formData.purpose === 'Other' && !formData.otherPurpose.trim()) { alert('Please specify the purpose of visit'); return; }
    if (!formData.host) { alert('Please enter the host name'); return; }
    if (!formData.department) { alert('Please select a department'); return; }
    if (formData.department === 'Other' && !formData.otherDepartment.trim()) { alert('Please specify the department'); return; }
    if (!formData.contactNumber || formData.contactNumber === '+63 9') { alert('Please enter a complete contact number'); return; }

    const submissionData = {
      ...formData,
      purpose: formData.purpose === 'Other' ? formData.otherPurpose : formData.purpose,
      department: formData.department === 'Other' ? formData.otherDepartment : formData.department,
      visitDate: currentDate
    };

    try {
      const response = await fetch('http://localhost:8080/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        alert('Visitor added successfully!');
        navigate('/records');
      } else {
        const error = await response.text();
        alert(error || 'Failed to add visitor');
      }
    } catch (error) {
      console.error('Error adding visitor:', error);
      alert('Server error. Please try again.');
    }
  };

  const handleCancel = () => navigate('/records');

  return (
    <div className="add-visitor-wrapper">
      <div className="add-visitor-container">
        <div className="page-header">
          <div>
            <div className="page-title">Add New Visitor</div>
            <div className="page-subtitle text-light">Fill in the visitor details below</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Visitor Information</div>
            <div className="date-display">
              <DateRangeRoundedIcon className="date-icon" />
              <span className="date-text">{currentDate}</span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* Visitor Name */}
                <div className="form-group full">
                  <label className="form-label">
                    Visitor Name <span className="required">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <PersonOutlineIcon className="input-field-icon" />
                    <input
                      type="text"
                      name="visitorName"
                      value={formData.visitorName}
                      onChange={handleChange}
                      className="form-input with-icon"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                {/* Purpose of Visit */}
                <div className="form-group">
                  <label className="form-label">
                    Purpose of Visit <span className="required">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <AssignmentOutlinedIcon className="input-field-icon" />
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="form-input with-icon"
                      required
                    >
                      <option value="">Select purpose</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Vendor Visit">Vendor Visit</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Other Purpose or Host */}
                {formData.purpose === 'Other' ? (
                  <div className="form-group">
                    <label className="form-label">
                      Specify Purpose <span className="required">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <EditNoteOutlinedIcon className="input-field-icon" />
                      <input
                        type="text"
                        name="otherPurpose"
                        value={formData.otherPurpose}
                        onChange={handleChange}
                        className="form-input with-icon"
                        placeholder="Please specify the purpose"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">
                      Host <span className="required">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <BadgeOutlinedIcon className="input-field-icon" />
                      <input
                        type="text"
                        name="host"
                        value={formData.host}
                        onChange={handleChange}
                        className="form-input with-icon"
                        placeholder="Who are they visiting?"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Host field when purpose is Other (so it doesn't disappear) */}
                {formData.purpose === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">
                      Host <span className="required">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <BadgeOutlinedIcon className="input-field-icon" />
                      <input
                        type="text"
                        name="host"
                        value={formData.host}
                        onChange={handleChange}
                        className="form-input with-icon"
                        placeholder="Who are they visiting?"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Department */}
                <div className="form-group">
                  <label className="form-label">
                    Department <span className="required">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <BusinessOutlinedIcon className="input-field-icon" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-input with-icon"
                      required
                    >
                      <option value="">Select department</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Finance">Finance</option>
                      <option value="IT">IT</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Executive">Executive</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Other Department */}
                {formData.department === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">
                      Specify Department <span className="required">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <EditNoteOutlinedIcon className="input-field-icon" />
                      <input
                        type="text"
                        name="otherDepartment"
                        value={formData.otherDepartment}
                        onChange={handleChange}
                        className="form-input with-icon"
                        placeholder="Please specify the department"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Contact Number */}
                <div className="form-group">
                  <label className="form-label">
                    Contact Number <span className="required">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <PhoneOutlinedIcon className="input-field-icon" />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="form-input with-icon"
                      placeholder="+63 9XX XXX XXXX"
                      required
                    />
                  </div>
                </div>

                {/* Time In */}
                <div className="form-group">
                  <label className="form-label">
                    Time In <span className="required">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <AccessTimeOutlinedIcon className="input-field-icon" />
                    <input
                      type="time"
                      name="timeIn"
                      value={formData.timeIn}
                      onChange={handleChange}
                      className="form-input with-icon time-input"
                      required
                      readOnly
                    />
                  </div>
                  <small className="time-note">Auto-updates to Philippine time (PHT)</small>
                </div>

              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="btn-save">Save Entry</button>
              </div>
            </form>
          </div>
        </div>

        <div className="tips-card">
          <div className="tips-header">
            <span className="tips-icon">ℹ️</span>
            <span className="tips-title text-primary">Quick Tips</span>
          </div>
          <div className="tips-content">
            <ul className="tips-list">
              <li>Make sure to verify visitor's identification</li>
              <li>Double-check the spelling of the visitor's name</li>
              <li>You can edit visitor details later if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddVisitor;