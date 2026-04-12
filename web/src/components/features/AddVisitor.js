import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AddVisitor.css';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

function AddVisitor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    visitorName: '',
    purpose: '',
    otherPurpose: '',
    host: '',
    contactNumber: '',
    timeIn: '',
  });

  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });

  const showBanner = (message, type = 'success') => {
    setBanner({ show: true, message, type });
    setTimeout(() => {
      hideBanner();
    }, 3000);
  };

  const hideBanner = () => {
    const bannerElement = document.querySelector('.banner-notification');
    if (bannerElement) {
      bannerElement.classList.add('fade-out');
      setTimeout(() => {
        setBanner({ show: false, message: '', type: 'success' });
      }, 300);
    } else {
      setBanner({ show: false, message: '', type: 'success' });
    }
  };

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
    setLoading(true);

    // Validation
    if (!formData.visitorName.trim()) { 
      showBanner('Please enter visitor name', 'error');
      setLoading(false);
      return; 
    }
    if (!formData.purpose) { 
      showBanner('Please select a purpose of visit', 'error');
      setLoading(false);
      return; 
    }
    if (formData.purpose === 'Other' && !formData.otherPurpose.trim()) { 
      showBanner('Please specify the purpose of visit', 'error');
      setLoading(false);
      return; 
    }
    if (!formData.host.trim()) { 
      showBanner('Please enter the host name', 'error');
      setLoading(false);
      return; 
    }
    if (!formData.contactNumber.trim()) { 
      showBanner('Please enter a contact number', 'error');
      setLoading(false);
      return; 
    }
    if (!/^\d{11}$/.test(formData.contactNumber.trim())) {
      showBanner('Contact number must be exactly 11 digits', 'error');
      setLoading(false);
      return;
    }

    // Prepare data for backend - Matches VisitorDTO exactly
    const submissionData = {
      visitorName: formData.visitorName,
      purpose: formData.purpose === 'Other' ? formData.otherPurpose : formData.purpose,
      host: formData.host,  // Note: 'host' not 'hostName' - matches VisitorDTO
      contactNo: formData.contactNumber,  // Note: 'contactNo' matches VisitorDTO
    };

    console.log('Submitting to /api/visitors:', submissionData);

    try {
      const response = await fetch('http://localhost:8080/api/visitors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const savedData = await response.json();
        console.log('Saved visitor:', savedData);
        showBanner('✓ Visitor checked in successfully!', 'success');
        setTimeout(() => {
          navigate('/visitor-log');
        }, 1500);
      } else {
        const error = await response.text();
        console.error('Server error:', error);
        showBanner(error || 'Failed to add visitor', 'error');
      }
    } catch (error) {
      console.error('Error adding visitor:', error);
      showBanner('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/records');

  return (
    <div className="add-visitor-wrapper">
      {/* Banner Notification */}
      {banner.show && (
        <div className={`banner-notification ${banner.type}`}>
          <div className="banner-content">
            <span className="banner-icon">
              {banner.type === 'success' && '✓'}
              {banner.type === 'error' && '✗'}
              {banner.type === 'warning' && '⚠'}
              {banner.type === 'info' && 'ℹ'}
            </span>
            <span className="banner-message">{banner.message}</span>
            <button className="banner-close" onClick={hideBanner}>×</button>
          </div>
        </div>
      )}

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

                {/* Specify Purpose if Other */}
                {formData.purpose === 'Other' && (
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
                )}

                {/* Host */}
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
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormData(prev => ({ ...prev, contactNumber: digits }));
                      }}
                      className="form-input with-icon"
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
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
                      className="form-input with-icon time-input"
                      readOnly
                    />
                  </div>
                  <small className="time-note">Auto-updates to Philippine time (PHT)</small>
                </div>

              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
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