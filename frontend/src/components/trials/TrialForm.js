import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trialsAPI, handleApiError } from '../../services/api';

const defaultForm = {
  trialName: '',
  trialId: '',
  description: '',
  principalInvestigator: '',
  sponsor: '',
  phase: 'Phase I',
  status: 'Planning',
  startDate: '',
  endDate: '',
  estimatedEnrollment: 1,
  actualEnrollment: 0,
  primaryEndpoint: '',
  therapeuticArea: '',
  drugName: '',
};

const TrialForm = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(editMode);

  useEffect(() => {
    if (editMode && id) {
      loadTrial(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, id]);

  const loadTrial = async (trialId) => {
    try {
      setInitialLoading(true);
      const { data } = await trialsAPI.getTrial(trialId);
      const t = data.trial;
      setForm({
        trialName: t.trialName || '',
        trialId: t.trialId || '',
        description: t.description || '',
        principalInvestigator: t.principalInvestigator || '',
        sponsor: t.sponsor || '',
        phase: t.phase || 'Phase I',
        status: t.status || 'Planning',
        startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
        endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
        estimatedEnrollment: t.estimatedEnrollment ?? 1,
        actualEnrollment: t.actualEnrollment ?? 0,
        primaryEndpoint: t.primaryEndpoint || '',
        therapeuticArea: t.therapeuticArea || '',
        drugName: t.drugName || '',
      });
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (error) setError(null);
    
    setForm((prev) => {
      let newValue = value;
      
      if (name === 'estimatedEnrollment' || name === 'actualEnrollment') {
        newValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      }
      
      if (name === 'trialId') {
        newValue = value.toUpperCase();
      }
      
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const validateForm = () => {
    const requiredFields = {
      trialName: 'Trial Name',
      trialId: 'Trial ID',
      description: 'Description',
      principalInvestigator: 'Principal Investigator',
      sponsor: 'Sponsor',
      startDate: 'Start Date',
      endDate: 'End Date',
      primaryEndpoint: 'Primary Endpoint',
      therapeuticArea: 'Therapeutic Area'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !form[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      return `Please fill in all required fields: ${missingFields.join(', ')}`;
    }

    if (!/^[A-Z0-9-]+$/.test(form.trialId)) {
      return 'Trial ID can only contain uppercase letters, numbers, and hyphens';
    }

    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Please enter valid dates';
    }

    if (endDate <= startDate) {
      return 'End date must be after start date';
    }

    if (!editMode && startDate < today) {
      return 'Start date cannot be in the past for new trials';
    }

    if (form.estimatedEnrollment <= 0) {
      return 'Estimated enrollment must be greater than 0';
    }

    if (form.estimatedEnrollment > 100000) {
      return 'Estimated enrollment cannot exceed 100,000';
    }

    if (form.actualEnrollment < 0) {
      return 'Actual enrollment cannot be negative';
    }

    if (form.actualEnrollment > form.estimatedEnrollment) {
      return 'Actual enrollment cannot exceed estimated enrollment';
    }

    return null;
  };

  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const numericFields = {
        estimatedEnrollment: Number(form.estimatedEnrollment),
        actualEnrollment: Number(form.actualEnrollment)
      };

      const payload = {
        ...form,
        ...numericFields,
        startDate: form.startDate ? formatDateForBackend(form.startDate) : null,
        endDate: form.endDate ? formatDateForBackend(form.endDate) : null,
        trialId: form.trialId.toUpperCase(),
      };
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      if (editMode) {
        await trialsAPI.updateTrial(id, payload);
      } else {
        await trialsAPI.createTrial(payload);
        setForm(defaultForm);
      }

      navigate('/trials');
    } catch (err) {
      console.error('API Error:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="loading">Loading trial data...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <h2>{editMode ? 'Edit Clinical Trial' : 'New Clinical Trial'}</h2>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="trialName" className="form-label">Trial Name*</label>
                <input
                  id="trialName"
                  name="trialName"
                  className="form-control"
                  value={form.trialName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="trialId" className="form-label">Trial ID*</label>
                <input
                  id="trialId"
                  name="trialId"
                  className="form-control"
                  value={form.trialId}
                  onChange={handleChange}
                  placeholder="ABC-123"
                  pattern="[A-Z0-9-]+"
                  title="Uppercase letters, numbers, and hyphens only"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description*</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="3"
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="principalInvestigator" className="form-label">Principal Investigator*</label>
                <input
                  id="principalInvestigator"
                  name="principalInvestigator"
                  className="form-control"
                  value={form.principalInvestigator}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="sponsor" className="form-label">Sponsor*</label>
                <input
                  id="sponsor"
                  name="sponsor"
                  className="form-control"
                  value={form.sponsor}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="phase" className="form-label">Phase*</label>
                <select
                  id="phase"
                  name="phase"
                  className="form-select"
                  value={form.phase}
                  onChange={handleChange}
                >
                  <option value="Preclinical">Preclinical</option>
                  <option value="Phase I">Phase I</option>
                  <option value="Phase II">Phase II</option>
                  <option value="Phase III">Phase III</option>
                  <option value="Phase IV">Phase IV</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="status" className="form-label">Status*</label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Recruiting">Recruiting</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Completed">Completed</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="startDate" className="form-label">Start Date*</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="form-control"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="endDate" className="form-label">End Date*</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="form-control"
                  value={form.endDate}
                  onChange={handleChange}
                  min={form.startDate}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="estimatedEnrollment" className="form-label">Estimated Enrollment*</label>
                <input
                  type="number"
                  id="estimatedEnrollment"
                  name="estimatedEnrollment"
                  min="1"
                  max="100000"
                  className="form-control"
                  value={form.estimatedEnrollment}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="actualEnrollment" className="form-label">Actual Enrollment</label>
                <input
                  type="number"
                  id="actualEnrollment"
                  name="actualEnrollment"
                  min="0"
                  max={form.estimatedEnrollment}
                  className="form-control"
                  value={form.actualEnrollment}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="primaryEndpoint" className="form-label">Primary Endpoint*</label>
                <input
                  id="primaryEndpoint"
                  name="primaryEndpoint"
                  className="form-control"
                  value={form.primaryEndpoint}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="therapeuticArea" className="form-label">Therapeutic Area*</label>
                <input
                  id="therapeuticArea"
                  name="therapeuticArea"
                  className="form-control"
                  value={form.therapeuticArea}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="drugName" className="form-label">Drug Name (optional)</label>
              <input
                id="drugName"
                name="drugName"
                className="form-control"
                value={form.drugName}
                onChange={handleChange}
              />
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/trials')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {loading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Changes' : 'Create Trial')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrialForm;