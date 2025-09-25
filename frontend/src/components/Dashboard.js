import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trialsAPI, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  MdDashboard, 
  MdScience, 
  MdSchedule, 
  MdCheckCircle, 
  MdGroup,
  MdPerson,
  MdCalendarToday,
  MdArrowForward,
  MdAdd,
  MdDescription
} from 'react-icons/md';

const StatCard = ({ icon: IconComponent, value, label, color = 'blue' }) => (
  <div className={`stat-card stat-card-${color}`}>
    <div className="stat-icon">
      <IconComponent />
    </div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const RecentTrialCard = ({ trial }) => (
  <div className="recent-trial-card">
    <div className="trial-header">
      <h4 className="trial-name">{trial.trialName}</h4>
      <span className={`status-badge status-${trial.status.toLowerCase()}`}>
        {trial.status}
      </span>
    </div>
    <div className="trial-details">
      <div className="trial-meta">
        <span className="meta-item">
          <MdPerson />
          Dr. {trial.principalInvestigator}
        </span>
        <span className="meta-item">
          <MdScience />
          Phase {trial.phase.replace('Phase ', '')}
        </span>
        <span className="meta-item">
          <MdCalendarToday />
          {new Date(trial.startDate).toLocaleDateString()}
        </span>
      </div>
      <p className="trial-description">{trial.description}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeTrials: 0,
    planningTrials: 0,
    completedTrials: 0,
    totalParticipants: 0
  });
  const [recentTrials, setRecentTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent trials
      const trialsResponse = await trialsAPI.getTrials({ limit: 5, page: 1 });
      setRecentTrials(trialsResponse.data.trials);

      // Calculate stats from trials data
      const allTrialsResponse = await trialsAPI.getTrials({ limit: 100, page: 1 });
      const allTrials = allTrialsResponse.data.trials;
      
      const stats = {
        activeTrials: allTrials.filter(t => t.status === 'Active').length,
        planningTrials: allTrials.filter(t => t.status === 'Planning').length,
        completedTrials: allTrials.filter(t => t.status === 'Completed').length,
        totalParticipants: allTrials.reduce((sum, t) => sum + (t.actualEnrollment || 0), 0)
      };
      
      setStats(stats);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading"><div className="spinner" /></div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-icon">
              <MdDashboard />
            </div>
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
            </div>
          </div>
          <div className="header-subtitle">
            <p className="dashboard-subtitle">Clinical Trial Overview & Analytics</p>
          </div>
        </div>

        {error && <div className="alert alert-error mb-3">{error}</div>}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard 
            icon={MdScience} 
            value={stats.activeTrials} 
            label="Active Trials" 
            color="blue" 
          />
          <StatCard 
            icon={MdSchedule} 
            value={stats.planningTrials} 
            label="In Planning" 
            color="orange" 
          />
          <StatCard 
            icon={MdCheckCircle} 
            value={stats.completedTrials} 
            label="Completed" 
            color="gray" 
          />
          <StatCard 
            icon={MdGroup} 
            value={stats.totalParticipants} 
            label="Total Participants" 
            color="red" 
          />
        </div>

        {/* Recent Clinical Trials */}
        <div className="recent-trials-section">
          <div className="section-header">
            <h2 className="section-title">Recent Clinical Trials</h2>
            <Link to="/trials" className="view-all-link">
              View All <MdArrowForward />
            </Link>
          </div>
          
          <div className="recent-trials-grid">
            {recentTrials.length === 0 ? (
              <div className="empty-state">
                <MdDescription />
                <h3>No trials found</h3>
                <p>Start by creating your first clinical trial</p>
                <Link to="/trials/new" className="btn btn-primary">
                  <MdAdd /> New Trial
                </Link>
              </div>
            ) : (
              recentTrials.map(trial => (
                <RecentTrialCard key={trial._id} trial={trial} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
