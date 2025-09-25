import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trialsAPI, handleApiError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MdList, 
  MdAdd, 
  MdSearch, 
  MdDescription,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';

const TrialsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    phase: '',
    search: '',
    therapeuticArea: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTrials: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const statusOptions = ['Planning', 'Active', 'Recruiting', 'Suspended', 'Completed', 'Terminated'];
  const phaseOptions = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'];

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const { data } = await trialsAPI.getTrials({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        phase: filters.phase || undefined,
        search: filters.search || undefined,
        therapeuticArea: filters.therapeuticArea || undefined,
      });
      setTrials(data.trials);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status, filters.phase, filters.search, filters.therapeuticArea]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trial?')) return;
    try {
      await trialsAPI.deleteTrial(id);
      fetchTrials();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const onFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10, status: '', phase: '', search: '', therapeuticArea: '' });
  };

  if (loading) {
    return (
      <div className="trials-page">
        <div className="container">
          <div className="loading"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="trials-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <MdList />
            </div>
            <h1 className="page-title">All Clinical Trials</h1>
          </div>
          <Link className="btn btn-primary" to="/trials/new">
            <MdAdd /> New Trial
          </Link>
        </div>

        <div className="filters-section">
          <div className="filters-row">
            <div className="search-box">
              <MdSearch className="search-icon" aria-hidden="true" />
              <input 
                name="search" 
                className="search-input" 
                placeholder="Search trials..." 
                value={filters.search} 
                onChange={onFilterChange} 
              />
            </div>
            <div className="filter-group">
              <select name="status" className="filter-select" value={filters.status} onChange={onFilterChange}>
                <option value="">All Statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select name="phase" className="filter-select" value={filters.phase} onChange={onFilterChange}>
                <option value="">All Phases</option>
                {phaseOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div className="trials-table-container">
          <table className="trials-table">
            <thead>
              <tr>
                <th>Trial Name</th>
                <th>Principal Investigator</th>
                <th>Phase</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Participants</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trials.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-row">
                    <div className="empty-state">
                      <MdDescription />
                      <h3>No trials found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
              {trials.map((t) => (
                <tr key={t._id} className="trial-row">
                  <td className="trial-name-cell">
                    <div className="trial-name">{t.trialName}</div>
                    <div className="trial-id">{t.trialId}</div>
                  </td>
                  <td>Dr. {t.principalInvestigator}</td>
                  <td>
                    <span className="phase-badge">{t.phase}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${t.status.toLowerCase()}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.startDate).toLocaleDateString()}</td>
                  <td>{new Date(t.endDate).toLocaleDateString()}</td>
                  <td>{t.actualEnrollment || 0}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        className="action-btn view-btn" 
                        title="View"
                        onClick={() => navigate(`/trials/${t._id}/edit`)}
                      >
                        <MdVisibility />
                      </button>
                      <button 
                        className="action-btn edit-btn" 
                        title="Edit"
                        onClick={() => navigate(`/trials/${t._id}/edit`)}
                      >
                        <MdEdit />
                      </button>
                      {(user?.role === 'admin' || String(t.createdBy?._id || t.createdBy) === String(user?._id)) && (
                        <button 
                          className="action-btn delete-btn" 
                          title="Delete"
                          onClick={() => handleDelete(t._id)}
                        >
                          <MdDelete />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-section">
          <div className="pagination-info">
            Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalTrials)} of {pagination.totalTrials} trials
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              disabled={!pagination.hasPrevPage} 
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              <MdChevronLeft />
            </button>
            <span className="pagination-current">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button 
              className="pagination-btn" 
              disabled={!pagination.hasNextPage} 
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              <MdChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialsList;
