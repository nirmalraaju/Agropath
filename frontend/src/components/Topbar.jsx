import { FiBell, FiUser } from 'react-icons/fi';
import './Topbar.css';

const Topbar = () => {
  return (
    <header className="topbar glass">
      <div className="topbar-search">
        {/* Placeholder for search or breadcrumbs */}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn">
          <FiBell />
        </button>
        <div className="user-profile">
          <div className="avatar">
            <FiUser />
          </div>
          <span className="user-name">Farmer Joe</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
