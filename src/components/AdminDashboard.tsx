import React, { useEffect, useState } from 'react';
import { getAllUsers, getPageViews } from '../firebase';

// Define custom type for visitor data
interface VisitorData {
  id: string;
  email?: string;
  name?: string;
  date: string;
}

// Define page view type
interface PageView {
  path: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
}

const AdminDashboard: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [isAdmin] = useState(true); // Always admin in mock mode
  const [loading, setLoading] = useState(true);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalSignups: 0,
    pageViewCount: 0,
    mostViewedPage: '',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Main data loading function
  const loadData = async () => {
    try {
      // Get users from IndexedDB
      const users = await getAllUsers();
      console.log('Admin Dashboard - Users loaded:', users);
      
      // Convert User type to VisitorData type
      const visitorData: VisitorData[] = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        date: user.createdAt
      }));
      console.log('Admin Dashboard - Visitor data:', visitorData);
      setVisitors(visitorData);
      
      // Get page views from IndexedDB
      const views = await getPageViews();
      console.log('Admin Dashboard - Page views loaded:', views);
      setPageViews(views);
      
      // Count page views by path
      const pageViewsByPath: {[key: string]: number} = {};
      views.forEach((view: PageView) => {
        pageViewsByPath[view.path] = (pageViewsByPath[view.path] || 0) + 1;
      });
      
      // Find most viewed page
      let mostViewed = '';
      let maxViews = 0;
      Object.entries(pageViewsByPath).forEach(([path, count]) => {
        if (count > maxViews) {
          mostViewed = path;
          maxViews = count;
        }
      });
      
      setStats({
        totalVisitors: views.length,
        totalSignups: users.length,
        pageViewCount: views.length,
        mostViewedPage: mostViewed,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  // Toggle signup popup
  const toggleSignupPopup = () => {
    setShowSignupPopup(!showSignupPopup);
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  if (!isAdmin) {
    return <div className="admin-unauthorized">You must be an admin to view this page.</div>;
  }
  
  // Get recent page views (last 20)
  const recentPageViews = [...pageViews]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  // Extract device info from user agent
  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    // Simple device detection
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Desktop';
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Visitors</h3>
          <p className="stat-number">{stats.totalVisitors}</p>
        </div>
        <div className="stat-card">
          <h3>Email Signups</h3>
          <p className="stat-number">{stats.totalSignups}</p>
          <button 
            className="view-signups-button"
            onClick={toggleSignupPopup}
          >
            View Signups
          </button>
        </div>
        <div className="stat-card">
          <h3>Page Views</h3>
          <p className="stat-number">{stats.pageViewCount}</p>
        </div>
      </div>
      
      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="signup-popup">
          <div className="popup-header">
            <h3>Email Signups</h3>
            <button onClick={toggleSignupPopup}>Close</button>
          </div>
          <div className="popup-content">
            {visitors.length === 0 ? (
              <p>No signups yet</p>
            ) : (
              <ul>
                {visitors.map((signup) => (
                  <li key={signup.id}>
                    <strong>{signup.email || 'No Email'}</strong>
                    <span>{new Date(signup.date).toLocaleString()}</span>
                    <span>{signup.name || 'No Name'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      <h2>Most Viewed Page</h2>
      <div className="visitor-list">
        <div className="most-viewed-page">
          <strong>{stats.mostViewedPage}</strong> - {pageViews.filter(p => p.path === stats.mostViewedPage).length} views
        </div>
      </div>
      
      <h2>Recent Page Views</h2>
      <div className="visitor-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Page</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {recentPageViews.map((view, index) => (
              <tr key={index}>
                <td>{new Date(view.timestamp).toLocaleString()}</td>
                <td>{view.path}</td>
                <td>{getDeviceInfo(view.userAgent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard; 