
import React, { useState } from 'react';
import App from './App.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Hospitals from './pages/Hospitals.jsx';
import Doctors from './pages/Doctors.jsx';
import Patients from './pages/Patients.jsx';
import Appointments from './pages/Appointments.jsx';

export default function Workspace() {
  const [page, setPage] = useState('dashboard');

  return (
    <>
      {page === 'dashboard' && (
        <>
          <Dashboard onNavigate={setPage} />

          <button
            className="hc-workspace-switch"
            onClick={() => setPage('discovery')}
          >
            <span>＋</span> Hospital Discovery
          </button>
        </>
      )}

      {page === 'appointments' && (
  <>
    <Appointments />
    <button
      className="hc-workspace-switch"
      onClick={() => setPage('dashboard')}
    >
      ← Dashboard
    </button>
  </>
)}

      {page === 'hospitals' && (
        <>
          <Hospitals />

          <button
            className="hc-workspace-switch"
            onClick={() => setPage('dashboard')}
          >
            ← Dashboard
          </button>
        </>
      )}

      {page === 'doctors' && (
        <>
          <Doctors />

          <button
            className="hc-workspace-switch"
            onClick={() => setPage('dashboard')}
          >
            ← Dashboard
          </button>
        </>
      )}

      {page === 'patients' && (
  <>
    <Patients />
    <button
      className="hc-workspace-switch"
      onClick={() => setPage('dashboard')}
    >
      ← Dashboard
    </button>
  </>
)}

      {page === 'discovery' && (
        <>
          <App />

          <button
            className="hc-workspace-switch"
            onClick={() => setPage('dashboard')}
          >
            ← Dashboard
          </button>
        </>
      )}
    </>
  );
}
