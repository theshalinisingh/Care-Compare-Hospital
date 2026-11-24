
import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Plus, Search, RefreshCw, X,
  Clock, UserRound, Building2, Stethoscope,
  Pencil, Trash2, CheckCircle2, XCircle
} from 'lucide-react';

import '../styles/appointments.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  patientId: '',
  hospitalId: '',
  doctorId: '',
  appointmentDate: '',
  reason: '',
  notes: ''
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const token = () => localStorage.getItem('cc-token');

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (!token()) {
        throw new Error('Please login with your admin account.');
      }

      const responses = await Promise.all([
        fetch(`${API}/appointments`, { headers: headers() }),
        fetch(`${API}/patients`, { headers: headers() }),
        fetch(`${API}/hospitals`),
        fetch(`${API}/doctors`)
      ]);

      const [appointmentData, patientData, hospitalData, doctorData] =
        await Promise.all(responses.map(async response => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Unable to load appointment data.');
          }
          return data;
        }));

      setAppointments(appointmentData.appointments || []);
      setPatients(patientData.patients || []);
      setHospitals(
        Array.isArray(hospitalData)
          ? hospitalData
          : hospitalData.data || hospitalData.hospitals || []
      );
      setDoctors(doctorData.doctors || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDoctors = useMemo(
    () => doctors.filter(doctor => doctor.hospitalId === form.hospitalId),
    [doctors, form.hospitalId]
  );

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      appointment.doctor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      appointment.hospital?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openAddForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = appointment => {
    setEditing(appointment);
    setForm({
      patientId: appointment.patientId,
      hospitalId: appointment.hospitalId,
      doctorId: appointment.doctorId,
      appointmentDate: new Date(appointment.appointmentDate)
        .toISOString().slice(0, 16),
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    });
    setShowForm(true);
  };

  const updateField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'hospitalId' ? { doctorId: '' } : {})
    }));
  };

  const saveAppointment = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editing
        ? `${API}/appointments/${editing.id}`
        : `${API}/appointments`;

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify({
          ...form,
          appointmentDate: new Date(form.appointmentDate).toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save appointment.');
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async id => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`${API}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: headers()
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Cancellation failed.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAppointment = async id => {
    if (!window.confirm('Permanently delete this appointment?')) return;

    try {
      const response = await fetch(`${API}/appointments/${id}`, {
        method: 'DELETE',
        headers: headers()
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Delete failed.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const stats = [
    { label: 'Total appointments', value: appointments.length, icon: CalendarDays, tone: 'blue' },
    { label: 'Scheduled', value: appointments.filter(a => a.status === 'SCHEDULED').length, icon: Clock, tone: 'purple' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle2, tone: 'teal' },
    { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length, icon: XCircle, tone: 'orange' }
  ];

  return (
    <main className="am-page">
      <div className="am-heading">
        <div>
          <div className="am-eyebrow"><span /> HEALTHCARE INTELLIGENCE</div>
          <h1>Appointments Management</h1>
          <p>Schedule and manage patient consultations across hospitals.</p>
        </div>

        <div className="am-heading-actions">
          <button className="am-secondary-btn" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="am-primary-btn" onClick={openAddForm}>
            <Plus size={17} /> Book Appointment
          </button>
        </div>
      </div>

      <div className="am-notice">
        <CalendarDays size={20} />
        <div>
          <strong>Appointment scheduling</strong>
          <p>Only use fictional patient records during development. Confirm availability before real-world booking.</p>
        </div>
      </div>

      {error && (
        <div className="am-error">
          {error}
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      <section className="am-stats">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <div className="am-stat-card" key={item.label}>
              <div className={`am-stat-icon ${item.tone}`}><Icon size={21} /></div>
              <span>{item.label}</span>
              <strong>{item.value.toString().padStart(2, '0')}</strong>
            </div>
          );
        })}
      </section>

      <section className="am-directory">
        <div className="am-directory-heading">
          <div>
            <h2>Appointment directory</h2>
            <p>View and manage scheduled consultations.</p>
          </div>
          <span className="am-count">{filteredAppointments.length} records</span>
        </div>

        <div className="am-filters">
          <div className="am-search">
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, doctor or hospital..."
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No show</option>
          </select>
        </div>

        {loading ? (
          <div className="am-empty">
            <RefreshCw size={26} className="am-spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="am-empty">
            <CalendarDays size={35} />
            <h3>No appointments found</h3>
            <p>Book an appointment to get started.</p>
          </div>
        ) : (
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>DOCTOR</th>
                  <th>HOSPITAL</th>
                  <th>DATE & TIME</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>
                      <button className="am-patient-name" onClick={() => setSelected(appointment)}>
                        <span className="am-avatar">
                          {appointment.patient?.name?.charAt(0).toUpperCase()}
                        </span>
                        <strong>{appointment.patient?.name}</strong>
                      </button>
                    </td>
                    <td>
                      <div className="am-cell-main">{appointment.doctor?.name}</div>
                      <small>{appointment.doctor?.speciality}</small>
                    </td>
                    <td>
                      <div className="am-cell-main">{appointment.hospital?.name}</div>
                      <small>{appointment.hospital?.city}</small>
                    </td>
                    <td>{new Date(appointment.appointmentDate).toLocaleString()}</td>
                    <td>
                      <span className={`am-status ${appointment.status.toLowerCase()}`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="am-row-actions">
                        <button title="View" onClick={() => setSelected(appointment)}>
                          <UserRound size={16} />
                        </button>
                        <button title="Edit" onClick={() => openEditForm(appointment)}>
                          <Pencil size={16} />
                        </button>
                        {appointment.status === 'SCHEDULED' && (
                          <button title="Cancel" onClick={() => cancelAppointment(appointment.id)}>
                            <XCircle size={16} />
                          </button>
                        )}
                        <button title="Delete" onClick={() => deleteAppointment(appointment.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="am-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="am-modal" onSubmit={saveAppointment} onClick={e => e.stopPropagation()}>
            <div className="am-modal-heading">
              <div>
                <h2>{editing ? 'Edit appointment' : 'Book new appointment'}</h2>
                <p>Connect an existing patient, hospital and doctor.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)}><X /></button>
            </div>

            <label>Patient *
              <select required value={form.patientId} onChange={e => updateField('patientId', e.target.value)}>
                <option value="">Select patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </label>

            <label>Hospital *
              <select required value={form.hospitalId} onChange={e => updateField('hospitalId', e.target.value)}>
                <option value="">Select hospital</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>
                ))}
              </select>
            </label>

            <label>Doctor *
              <select required value={form.doctorId} onChange={e => updateField('doctorId', e.target.value)} disabled={!form.hospitalId}>
                <option value="">Select doctor</option>
                {filteredDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name} — {doctor.speciality}</option>
                ))}
              </select>
              {form.hospitalId && filteredDoctors.length === 0 && (
                <small>No doctors are currently listed for this hospital.</small>
              )}
            </label>

            <label>Appointment date and time *
              <input
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                value={form.appointmentDate}
                onChange={e => updateField('appointmentDate', e.target.value)}
              />
            </label>

            <label>Reason for visit
              <input
                value={form.reason}
                onChange={e => updateField('reason', e.target.value)}
                placeholder="e.g. General consultation"
              />
            </label>

            <label>Notes
              <textarea
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="Optional notes"
                rows={3}
              />
            </label>

            <div className="am-modal-actions">
              <button type="button" className="am-secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="am-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="am-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="am-modal am-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-heading">
              <div>
                <h2>Appointment details</h2>
                <p>Consultation record information</p>
              </div>
              <button onClick={() => setSelected(null)}><X /></button>
            </div>

            <div className="am-detail-list">
              <p><UserRound size={17} /> <strong>Patient:</strong> {selected.patient?.name}</p>
              <p><Stethoscope size={17} /> <strong>Doctor:</strong> {selected.doctor?.name}</p>
              <p><Building2 size={17} /> <strong>Hospital:</strong> {selected.hospital?.name}</p>
              <p><CalendarDays size={17} /> <strong>Date:</strong> {new Date(selected.appointmentDate).toLocaleString()}</p>
              <p><Clock size={17} /> <strong>Status:</strong> {selected.status}</p>
              <p><strong>Reason:</strong> {selected.reason || 'Not specified'}</p>
              <p><strong>Notes:</strong> {selected.notes || 'None'}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
