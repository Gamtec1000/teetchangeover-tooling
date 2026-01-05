// client/src/components/Layout.tsx
import React, { useState } from 'react';
import {
  FiGrid,
  FiList,
  FiSettings,
  FiHardDrive,
  FiTool,
  FiUsers,
  FiFileText,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiChevronLeft,
  FiSliders,
  FiBook,
  FiPackage,
  FiMoon,
  FiSun
} from 'react-icons/fi';

interface LayoutProps {
  page: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
  isAdmin: boolean;
  onAdminLoginClick: () => void;
  onLogout: () => void;
  hideSidebar?: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ page, onNavigate, children, isAdmin, onAdminLoginClick, onLogout, hideSidebar = false, theme, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse on small screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { id: 'changeover', icon: <FiList />, label: 'Start Changeover' },
    { id: 'procedures', icon: <FiBook />, label: 'Procedures' },
    { id: 'parts', icon: <FiTool />, label: 'Parts' },
    { id: 'consumables', icon: <FiPackage />, label: 'Consumables' },
    { id: 'tools', icon: <FiUsers />, label: 'Tools' },
  ];

  const adminNavItems = [
    { id: 'machines', icon: <FiHardDrive />, label: 'Machines' },
    { id: 'pipe_sizes', icon: <FiSettings />, label: 'Pipe Sizes' },
    { id: 'changeover_templates', icon: <FiFileText />, label: 'Templates' },
    { id: 'settings', icon: <FiSliders />, label: 'Settings' },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavClick = (itemId: string) => {
      onNavigate(itemId);
      // Auto-collapse on mobile after selection
      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  return (
    <div className="layout">
      {!hideSidebar && (
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-header">
            {isSidebarOpen && (
              <img
                src="/tenaris-logo.png"
                alt="Tenaris"
                style={{ height: '40px', objectFit: 'contain' }}
              />
            )}
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {isSidebarOpen ? <FiChevronLeft /> : <FiMenu />}
            </button>
          </div>
          <nav className="sidebar-nav">
            <ul>
              {navItems.map((item) => (
                <li
                  key={item.id}
                  className={page === item.id ? 'active' : ''}
                  onClick={() => handleNavClick(item.id)}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  {item.icon}
                  {isSidebarOpen && <span>{item.label}</span>}
                </li>
              ))}
              {isAdmin && adminNavItems.map((item) => (
                <li
                  key={item.id}
                  className={page === item.id ? 'active' : ''}
                  onClick={() => handleNavClick(item.id)}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  {item.icon}
                  {isSidebarOpen && <span>{item.label}</span>}
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-footer">
            <button onClick={toggleTheme} style={{marginBottom: '0.5rem'}} title={!isSidebarOpen ? 'Toggle Theme' : ''}>
                {theme === 'light' ? <FiMoon /> : <FiSun />}
                {isSidebarOpen && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
            </button>
            {isAdmin ? (
              <button onClick={onLogout} title={!isSidebarOpen ? 'Logout' : ''}>
                  <FiLogOut /> {isSidebarOpen && 'Logout'}
              </button>
            ) : (
              <button onClick={onAdminLoginClick} title={!isSidebarOpen ? 'Admin Login' : ''}>
                  <FiLogIn /> {isSidebarOpen && 'Admin Login'}
              </button>
            )}
          </div>
        </aside>
      )}
      
      {/* Mobile Toggle Button - Visible only on mobile when sidebar is closed */}
      {(!isSidebarOpen && !hideSidebar) && (
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
           <FiMenu />
        </button>
      )}

      <main className={`main-content ${!hideSidebar ? (isSidebarOpen ? 'open' : 'collapsed') : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
