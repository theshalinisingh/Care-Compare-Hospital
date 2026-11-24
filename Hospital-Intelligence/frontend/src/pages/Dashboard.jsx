import React, { useState } from 'react';
import {
  Activity, BedDouble, Building2, CalendarDays, ChevronDown,
  ClipboardList, Clock3, Download, HeartPulse, LayoutDashboard,
  Menu, Users, UserRound, Stethoscope, TrendingUp, TrendingDown,
  ShieldCheck, Settings, Bell, Search, ArrowUpRight, Package,
  FileBarChart, CircleHelp
} from 'lucide-react';
import '../styles/dashboard.css';

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Hospitals', icon: Building2 },
  { label: 'Doctors', icon: Stethoscope },
  { label: 'Patients', icon: Users },
  { label: 'Appointments', icon: CalendarDays },
  { label: 'Departments', icon: ClipboardList },
  { label: 'Bed Management', icon: BedDouble },
  { label: 'Staff', icon: UserRound },
  { label: 'Inventory', icon: Package },
  { label: 'Analytics', icon: FileBarChart },
];

const metrics = [
  { label: 'Total hospitals', value: '04', change: 'Demo records', icon: Building2, tone: 'blue' },
  { label: 'Total doctors', value: '04', change: 'Illustrative data', icon: Stethoscope, tone: 'purple' },
  { label: 'Total patients', value: '—', change: 'Not available', icon: Users, tone: 'teal' },
  { label: 'Total admissions', value: '—', change: 'Not available', icon: Activity, tone: 'orange' },
  { label: 'Bed occupancy', value: '—', change: 'Not available', icon: BedDouble, tone: 'pink' },
  { label: 'Avg. waiting time', value: '—', change: 'Not available', icon: Clock3, tone: 'green' },
];

const activity = [
  { title: 'Hospital directory', detail: '4 illustrative hospital profiles', status: 'Demo data', tone: 'blue' },
  { title: 'Doctor schedules', detail: 'Sample schedules only', status: 'Unverified', tone: 'orange' },
  { title: 'Patient analytics', detail: 'No verified data connected', status: 'Unavailable', tone: 'grey' },
  { title: 'Bed management', detail: 'No bed inventory connected', status: 'Unavailable', tone: 'grey' },
];

export default function Dashboard({ onNavigate }) {
  const [active, setActive] = useState('Overview');
  const [period, setPeriod] = useState('Last 30 days');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="hc-dashboard">
      <aside className={`hc-sidebar ${menuOpen ? 'hc-sidebar-open' : ''}`}>
        <a className="hc-brand" href="#dashboard">
          <span className="hc-brand-icon"><HeartPulse size={23} /></span>
          <span>Hospital<span>Compare</span><small>INDIA HEALTHCARE PLATFORM</small></span>
        </a>

        <div className="hc-nav-label">WORKSPACE</div>
        <nav className="hc-nav">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={active === item.label ? 'hc-nav-item active' : 'hc-nav-item'}
                onClick={() => {
if (item.label === 'Hospitals') {
  onNavigate?.('hospitals');
} else if (item.label === 'Doctors') {
  onNavigate?.('doctors');
} else if (item.label === 'Patients') {
  onNavigate?.('patients');
} else if (item.label === 'Appointments') {
  onNavigate?.('appointments');
} else {
  setActive(item.label);
}
  setMenuOpen(false);
}}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.label === 'Overview' && <span className="hc-nav-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="hc-sidebar-bottom">
          <button className="hc-nav-item" onClick={() => setActive('Settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className="hc-nav-item" onClick={() => setActive('Help & Support')}>
            <CircleHelp size={18} /><span>Help & Support</span>
          </button>
          <div className="hc-profile">
            <div className="hc-profile-avatar">HC</div>
            <div><b>Platform Admin</b><small>Demo workspace</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="hc-main">
        <header className="hc-topbar">
          <button className="hc-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <Menu size={21} />
          </button>
          <div className="hc-breadcrumb">Workspace <span>/</span> {active}</div>
          <div className="hc-top-actions">
            <label className="hc-top-search">
              <Search size={16} />
              <input placeholder="Search dashboard..." aria-label="Search dashboard" />
            </label>
            <button className="hc-icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="hc-top-avatar">A</div>
          </div>
        </header>

        <div className="hc-content">
          <section className="hc-welcome">
            <div>
              <div className="hc-eyebrow"><span /> HEALTHCARE INTELLIGENCE</div>
              <h1>{active === 'Overview' ? 'Dashboard overview' : active}</h1>
              <p>Monitor directory information and manage your healthcare workspace.</p>
            </div>
            <div className="hc-welcome-actions">
              <select value={period} onChange={e => setPeriod(e.target.value)} aria-label="Select date range">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
              </select>
              <button className="hc-export" onClick={() => window.print()}>
                <Download size={16} /> Export
              </button>
            </div>
          </section>

          <div className="hc-demo-notice">
            <ShieldCheck size={18} />
            <div><b>Demonstration workspace</b><span>Figures marked as demo are illustrative. Patient, admission and operational statistics are not connected to verified hospital systems.</span></div>
          </div>

          <section className="hc-metrics">
            {metrics.map(metric => {
              const Icon = metric.icon;
              return (
                <article className="hc-metric-card" key={metric.label}>
                  <div className={`hc-metric-icon ${metric.tone}`}><Icon size={20} /></div>
                  <span className="hc-metric-label">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.change}</small>
                </article>
              );
            })}
          </section>

          <section className="hc-dashboard-grid">
            <article className="hc-card hc-performance-card">
              <div className="hc-card-heading">
                <div><h2>Platform activity</h2><p>Current data connection overview</p></div>
                <span className="hc-period-label">{period}</span>
              </div>
              <div className="hc-chart-placeholder">
                <div className="hc-chart-icon"><Activity size={26} /></div>
                <b>Analytics data not connected</b>
                <p>Admission trends, occupancy and patient statistics will appear here when verified data is available through the backend.</p>
              </div>
              <div className="hc-chart-legend">
                <span><i className="hc-legend-blue" /> Verified metrics</span>
                <span><i className="hc-legend-grey" /> Awaiting data</span>
              </div>
            </article>

            <article className="hc-card hc-quick-card">
              <div className="hc-card-heading">
                <div><h2>Workspace health</h2><p>Integration status</p></div>
                <Activity size={19} />
              </div>
              {activity.map(item => (
                <div className="hc-activity-row" key={item.title}>
                  <div className={`hc-activity-dot ${item.tone}`} />
                  <div className="hc-activity-copy"><b>{item.title}</b><small>{item.detail}</small></div>
                  <span className={`hc-activity-status ${item.tone}`}>{item.status}</span>
                </div>
              ))}
            </article>
          </section>

          <section className="hc-card hc-table-card">
            <div className="hc-card-heading">
              <div><h2>Hospital directory snapshot</h2><p>Illustrative records currently available in this project</p></div>
              <button className="hc-view-link" onClick={() => setActive('Hospitals')}>View directory <ArrowUpRight size={15} /></button>
            </div>
            <div className="hc-table-wrap">
              <table className="hc-table">
                <thead><tr><th>DATA MODULE</th><th>AVAILABLE INFORMATION</th><th>DATA QUALITY</th></tr></thead>
                <tbody>
                  <tr><td><Building2 size={16} /> Hospital profiles</td><td>4 sample profiles</td><td><span className="hc-table-badge demo">Demo only</span></td></tr>
                  <tr><td><Stethoscope size={16} /> Doctor records</td><td>Illustrative doctor records</td><td><span className="hc-table-badge demo">Unverified</span></td></tr>
                  <tr><td><CalendarDays size={16} /> Appointment slots</td><td>Sample schedules</td><td><span className="hc-table-badge pending">Confirm directly</span></td></tr>
                  <tr><td><BedDouble size={16} /> Beds and occupancy</td><td>Not connected</td><td><span className="hc-table-badge unavailable">Unavailable</span></td></tr>
                  <tr><td><Users size={16} /> Patient statistics</td><td>Not connected</td><td><span className="hc-table-badge unavailable">Unavailable</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer className="hc-dashboard-footer">
            <span>HospitalCompare India · Healthcare intelligence workspace</span>
            <span>Demo environment · {new Date().toLocaleDateString('en-IN')}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
