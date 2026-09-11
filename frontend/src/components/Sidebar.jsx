import { NavLink } from 'react-router-dom';
import { FiHome, FiCamera, FiMap, FiCloud, FiMessageSquare, FiClock } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FiHome /> },
    { path: '/disease-detection', name: 'Disease Detection', icon: <FiCamera /> },
    { path: '/crop-recommendation', name: 'Crop Rec', icon: <FiMap /> },
    { path: '/weather', name: 'Weather', icon: <FiCloud /> },
    { path: '/assistant', name: 'AI Assistant', icon: <FiMessageSquare /> },
    { path: '/history', name: 'History', icon: <FiClock /> },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div className="logo-placeholder">🌱</div>
        <h2>AgroPath</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            to={item.path} 
            key={item.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
