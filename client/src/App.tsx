// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, getCollectionSnapshot, deleteChangeoverLog } from './firebase';
import AdminLogin from './components/AdminLogin';
import MachineManagement from './components/MachineManagement';
import PartsManagement from './components/PartsManagement';
import ToolsManagement from './components/ToolsManagement';
import PipeSizesManagement from './components/PipeSizesManagement';
import ChangeoverTemplatesManagement from './components/ChangeoverTemplatesManagement';
import ChangeoverFlow from './components/ChangeoverFlow';
import ChangeoverReadOnlyView from './components/ChangeoverReadOnlyView';
import Settings from './components/Settings';
import Layout from './components/Layout';
import ConsumablesManagement from './components/ConsumablesManagement';
import PinLockScreen from './components/PinLockScreen';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

import './App.css';

interface ChangeoverLog {
  id: string;
  machineId: string;
  fromSize: string;
  toSize: string;
  duration: number;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  machineName?: string;
  operatorName?: string;
  stepNotes?: any[];
  finalNote?: string;
}

const Dashboard: React.FC<{ logs: ChangeoverLog[], machines: any[], isAdmin: boolean }> = ({ logs, machines, isAdmin }) => {
  const [selectedLogNotes, setSelectedLogNotes] = useState<ChangeoverLog | null>(null);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
    
  const logsWithMachineNames = useMemo(() => {
    const machineMap = new Map(machines.map(m => [m.id, m.name]));
    // Sort logs by date (descending)
    const sortedLogs = [...logs].sort((a, b) => {
        const dateA = a.date && a.date.seconds ? a.date.seconds : 0;
        const dateB = b.date && b.date.seconds ? b.date.seconds : 0;
        return dateB - dateA; // Descending order (newest first)
    });

    return sortedLogs.map(log => ({
      ...log,
      machineName: machineMap.get(log.machineId) || 'Unknown',
    }));
  }, [logs, machines]);

  const filteredLogs = useMemo(() => {
    let result = logsWithMachineNames;
    if (selectedMachineFilter !== 'all') {
        result = logsWithMachineNames.filter(log => log.machineId === selectedMachineFilter);
    }
    return result;
  }, [logsWithMachineNames, selectedMachineFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMachineFilter]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const totalChangeovers = filteredLogs.length;
  const avgDuration = totalChangeovers > 0 ? filteredLogs.reduce((acc, log) => acc + log.duration, 0) / totalChangeovers : 0;

  const avgTimeByMachine = useMemo(() => {
    const machineMap = new Map(machines.map(m => [
        m.id, 
        m.name ? { name: m.name, totalDuration: 0, count: 0 } : null
    ]).filter(entry => entry[1] !== null) as [string, { name: string, totalDuration: number, count: number }][]);
    
    for (const log of logs) {
      const machine = machineMap.get(log.machineId);
      if (machine) {
        machine.totalDuration += log.duration;
        machine.count++;
      }
    }
    
    return Array.from(machineMap.values()).map(m => ({
        name: m.name,
        avgDuration: m.count > 0 ? parseFloat(((m.totalDuration / m.count) / 60).toFixed(2)) : 0
    }));
  }, [logs, machines]);

  const changeoverDurationOverTime = useMemo(() => {
    return filteredLogs
        .filter(log => log.date && log.date.seconds)
        .map(log => ({
            date: new Date(log.date.seconds * 1000).toLocaleDateString(),
            duration: parseFloat((log.duration / 60).toFixed(2)),
        }));
  }, [filteredLogs]);

  const handleDeleteLog = async (logId: string) => {
      if (window.confirm("Are you sure you want to delete this log?")) {
          await deleteChangeoverLog(logId);
      }
  };

  return (
    <div className="dashboard">
      <div className="filter-section" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--white)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: 'var(--text-color)' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: 'var(--text-color)' }}>Filter by Machine:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <div 
                onClick={() => setSelectedMachineFilter('all')}
                style={{ 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    border: selectedMachineFilter === 'all' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                    backgroundColor: selectedMachineFilter === 'all' ? 'var(--background-color)' : 'var(--white)',
                    color: selectedMachineFilter === 'all' ? 'var(--primary-color)' : 'var(--text-color)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                }}
              >
                  All Machines
              </div>
              {machines.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => setSelectedMachineFilter(m.id)}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        border: selectedMachineFilter === m.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                        backgroundColor: selectedMachineFilter === m.id ? 'var(--background-color)' : 'var(--white)',
                        color: selectedMachineFilter === m.id ? 'var(--primary-color)' : 'var(--text-color)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        userSelect: 'none',
                        transition: 'all 0.2s ease'
                    }}
                  >
                      {m.name}
                  </div>
              ))}
          </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Changeovers</h3>
          <p>{totalChangeovers}</p>
        </div>
        <div className="stat-card">
          <h3>Average Duration</h3>
          <p>{(avgDuration / 60).toFixed(2)}min</p>
        </div>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Average Time per Machine (min)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgTimeByMachine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value} min`} />
              <Tooltip formatter={(value) => [`${value} min`, 'Avg Duration']}/>
              <Legend />
              <Bar dataKey="avgDuration" fill="#8884d8" name="Avg Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Duration Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={changeoverDurationOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value} min`} />
              <Tooltip formatter={(value) => [`${value} min`, 'Duration']}/>
              <Legend />
              <Line type="monotone" dataKey="duration" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="logs-table">
        <h3>Recent Changeover Logs</h3>
        {filteredLogs.length === 0 ? (
          <p>No changeover logs found.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: 'var(--shadow)' }}>
                <table>
                <thead>
                    <tr>
                    <th>Machine</th>
                    <th>Operator</th>
                    <th>From Size</th>
                    <th>To Size</th>
                    <th>Duration (min)</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {currentLogs.map((log) => (
                    <tr key={log.id}>
                    <td>{log.machineName}</td>
                    <td>{log.operatorName || 'Unknown'}</td>
                    <td>{log.fromSize}</td>
                    <td>{log.toSize}</td>
                    <td>{(log.duration / 60).toFixed(2)}</td>
                    <td>
                        {log.date && log.date.seconds
                        ? new Date(log.date.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                        <button onClick={() => setSelectedLogNotes(log)} style={{ padding: '5px 10px', fontSize: '0.8rem', marginRight: '5px' }}>Notes</button>
                        {isAdmin && (
                            <button onClick={() => handleDeleteLog(log.id)} style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#ff5252' }}>Delete</button>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem', gap: '1rem' }}>
                    <button 
                        onClick={handlePrevPage} 
                        disabled={currentPage === 1}
                        style={{ 
                            backgroundColor: currentPage === 1 ? 'var(--border-color)' : 'var(--primary-color)',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.6 : 1
                        }}
                    >
                        Previous
                    </button>
                    <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={handleNextPage} 
                        disabled={currentPage === totalPages}
                        style={{ 
                            backgroundColor: currentPage === totalPages ? 'var(--border-color)' : 'var(--primary-color)',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.6 : 1
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
          </>
        )}
      </div>

      {selectedLogNotes && (
          <div className="modal">
              <div className="modal-content" style={{ maxWidth: '600px' }}>
                  <h2>Changeover Notes</h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>Final Note</h4>
                      <p style={{ color: 'var(--text-color)' }}>{selectedLogNotes.finalNote || 'No final notes provided.'}</p>
                  </div>

                  <div>
                      <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>Step Notes</h4>
                      {selectedLogNotes.stepNotes && selectedLogNotes.stepNotes.length > 0 ? (
                          <ul style={{ paddingLeft: '20px' }}>
                              {selectedLogNotes.stepNotes.map((note: any, idx: number) => (
                                  <li key={idx} style={{ marginBottom: '10px' }}>
                                      <strong>Step {note.stepIndex + 1}: {note.stepTitle}</strong>
                                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)' }}>{note.text}</p>
                                  </li>
                              ))}
                          </ul>
                      ) : <p>No notes recorded for specific steps.</p>}
                  </div>

                  <div className="modal-buttons" style={{ marginTop: '20px', textAlign: 'right' }}>
                      <button onClick={() => setSelectedLogNotes(null)}>Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};


function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [logs, setLogs] = useState<ChangeoverLog[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [isChangeoverActive, setIsChangeoverActive] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const unsubscribeMachines = getCollectionSnapshot('machines', (fetchedMachines: any) => {
        setMachines(fetchedMachines);
        setLoading(false);
    });

    const unsubscribeLogs = getCollectionSnapshot('changeover_logs', (fetchedLogs: any) => {
      setLogs(fetchedLogs);
    });

    const unsubscribeAuth = onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeMachines();
      unsubscribeAuth();
    };
  }, []);

  const handleNavigate = (newPage: string) => {
      if (isChangeoverActive) {
          if (window.confirm("You have an active changeover in progress. Are you sure you want to leave? All progress will be lost.")) {
              setIsChangeoverActive(false);
              setPage(newPage);
          }
      } else {
          setPage(newPage);
      }
  };

  const handleLogout = () => {
    if (isChangeoverActive) {
        if (!window.confirm("You have an active changeover in progress. Are you sure you want to logout?")) {
            return;
        }
    }
    signOut();
    setPage('dashboard');
    setIsChangeoverActive(false);
  };

  const renderPage = () => {
    if (loading) return <p>Loading...</p>;

    switch (page) {
      case 'machines':
        return <MachineManagement />;
      case 'parts':
        return <PartsManagement isAdmin={isAdmin} />;
      case 'tools':
        return <ToolsManagement isAdmin={isAdmin} />;
      case 'consumables':
        return <ConsumablesManagement isAdmin={isAdmin} />;
      case 'pipe_sizes':
        return <PipeSizesManagement />;
      case 'changeover_templates':
        return <ChangeoverTemplatesManagement />;
      case 'settings':
        return <Settings />;
      case 'changeover':
        return <ChangeoverFlow onActiveStateChange={setIsChangeoverActive} />;
      case 'procedures':
        return <ChangeoverReadOnlyView />;
      default:
        return <Dashboard logs={logs} machines={machines} isAdmin={isAdmin} />;
    }
  };

  if (isLocked) {
    return <PinLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="App">
      <Layout 
        page={page} 
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        onAdminLoginClick={() => setShowAdminLogin(true)}
        onLogout={handleLogout}
        hideSidebar={isChangeoverActive}
        theme={theme}
        toggleTheme={toggleTheme}
      >
        {renderPage()}
      </Layout>
      {showAdminLogin && !isAdmin && (
        <AdminLogin onLoginSuccess={() => setShowAdminLogin(false)} onCancel={() => setShowAdminLogin(false)} />
      )}
    </div>
  );
}

export default App;
