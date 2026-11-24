
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, Users,
  RefreshCw, MapPin, Mail, Phone, UserRound
} from 'lucide-react';
import '../styles/patients.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: '',
  city: ''
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const getToken = () => localStorage.getItem('cc-token');

  async function loadPatients() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/patients`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load patients.');
      }

      setPatients(result.patients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.toLowerCase();

    return patients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      (patient.email || '').toLowerCase().includes(query) ||
      (patient.phone || '').toLowerCase().includes(query) ||
      (patient.city || '').toLowerCase().includes(query)
    );
  }, [patients, search]);

  function openAddForm() {
    setEditingPatient(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(patient) {
    setEditingPatient(patient);
    setForm({
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone || '',
      age: patient.age ?? '',
      gender: patient.gender || '',
      city: patient.city || ''
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPatient(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!getToken()) {
      setError('Please log in with an administrator account.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      age: form.age === '' ? null : Number(form.age),
      gender: form.gender,
      city: form.city.trim()
    };

    try {
      const response = await fetch(
        editingPatient
          ? `${API}/patients/${editingPatient.id}`
          : `${API}/patients`,
        {
          method: editingPatient ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save patient.');
      }

      closeForm();
      await loadPatients();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(patient) {
    if (!window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      return;
    }

    if (!getToken()) {
      setError('Please log in with an administrator account.');
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API}/patients/${patient.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete patient.');
      }

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }

      await loadPatients();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="pm-page">
      <div className="pm-heading">
        <div>
          <div className="pm-eyebrow">
            <span /> HEALTHCARE INTELLIGENCE
          </div>
          <h1>Patients Management</h1>
          <p>Manage patient profiles and registration information.</p>
        </div>

        <div className="pm-heading-actions">
          <button className="pm-secondary-btn" onClick={loadPatients}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="pm-primary-btn" onClick={openAddForm}>
            <Plus size={17} /> Add Patient
          </button>
        </div>
      </div>

      <div className="pm-notice">
        <Users size={20} />
        <div>
          <strong>Patient records management</strong>
          <p>Use fictional records during development. Do not enter real patient information.</p>
        </div>
      </div>

      {error && (
        <div className="pm-error">
          {error}
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      <section className="pm-stats">
        <div className="pm-stat-card">
          <div className="pm-stat-icon blue"><Users size={21} /></div>
          <span>Total patients</span>
          <strong>{patients.length.toString().padStart(2, '0')}</strong>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon purple"><UserRound size={21} /></div>
          <span>Male records</span>
          <strong>{patients.filter(p => p.gender?.toLowerCase() === 'male').length.toString().padStart(2, '0')}</strong>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon teal"><UserRound size={21} /></div>
          <span>Female records</span>
          <strong>{patients.filter(p => p.gender?.toLowerCase() === 'female').length.toString().padStart(2, '0')}</strong>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon orange"><MapPin size={21} /></div>
          <span>Cities covered</span>
          <strong>{new Set(patients.map(p => p.city).filter(Boolean)).size.toString().padStart(2, '0')}</strong>
        </div>
      </section>

      <section className="pm-directory">
        <div className="pm-directory-heading">
          <div>
            <h2>Patient directory</h2>
            <p>Search and manage registered patient profiles.</p>
          </div>
          <span className="pm-count">{filteredPatients.length} records</span>
        </div>

        <div className="pm-search">
          <Search size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or city..."
          />
        </div>

        {loading ? (
          <div className="pm-empty">
            <RefreshCw className="pm-spinner" size={26} />
            <p>Loading patient records...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="pm-empty">
            <Users size={35} />
            <h3>No patients found</h3>
            <p>Add a patient record to get started.</p>
          </div>
        ) : (
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>CONTACT</th>
                  <th>AGE / GENDER</th>
                  <th>CITY</th>
                  <th>REGISTERED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
                  <tr key={patient.id}>
                    <td>
                      <button className="pm-patient-name" onClick={() => setSelectedPatient(patient)}>
                        <span className="pm-avatar">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{patient.name}</strong>
                          <small>{patient.id.slice(-8)}</small>
                        </span>
                      </button>
                    </td>

                    <td>
                      <span className="pm-contact">
                        <Mail size={12} /> {patient.email || 'Not provided'}
                      </span>
                      <span className="pm-contact">
                        <Phone size={12} /> {patient.phone || 'Not provided'}
                      </span>
                    </td>

                    <td>{patient.age ?? '—'} / {patient.gender || '—'}</td>
                    <td>{patient.city || '—'}</td>
                    <td>{new Date(patient.createdAt).toLocaleDateString('en-IN')}</td>

                    <td>
                      <div className="pm-row-actions">
                        <button title="View patient" onClick={() => setSelectedPatient(patient)}>
                          <Users size={16} />
                        </button>
                        <button title="Edit patient" onClick={() => openEditForm(patient)}>
                          <Pencil size={16} />
                        </button>
                        <button title="Delete patient" className="pm-delete" onClick={() => handleDelete(patient)}>
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
        <div className="pm-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget) closeForm();
        }}>
          <form className="pm-modal" onSubmit={handleSubmit}>
            <div className="pm-modal-heading">
              <div>
                <h2>{editingPatient ? 'Edit patient' : 'Add new patient'}</h2>
                <p>Enter patient registration details.</p>
              </div>
              <button type="button" onClick={closeForm}><X size={20} /></button>
            </div>

            <label>
              Patient name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Enter patient name" minLength={2} required />
            </label>

            <div className="pm-form-grid">
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="patient@example.com" />
              </label>

              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" />
              </label>

              <label>
                Age
                <input name="age" type="number" min="0" max="120" value={form.age} onChange={handleChange} />
              </label>

              <label>
                Gender
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>
            </div>

            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} placeholder="Enter city" />
            </label>

            <div className="pm-modal-actions">
              <button type="button" className="pm-secondary-btn" onClick={closeForm}>Cancel</button>
              <button type="submit" className="pm-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editingPatient ? 'Save changes' : 'Add patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedPatient && (
        <div className="pm-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget) setSelectedPatient(null);
        }}>
          <div className="pm-modal">
            <div className="pm-modal-heading">
              <div>
                <h2>Patient profile</h2>
                <p>Registration information.</p>
              </div>
              <button onClick={() => setSelectedPatient(null)}><X size={20} /></button>
            </div>

            <div className="pm-profile">
              <span className="pm-profile-avatar"><UserRound size={27} /></span>
              <div>
                <h3>{selectedPatient.name}</h3>
                <p>Patient ID: {selectedPatient.id}</p>
              </div>
            </div>

            <div className="pm-detail-grid">
              <div><span>Email</span><strong>{selectedPatient.email || 'Not provided'}</strong></div>
              <div><span>Phone</span><strong>{selectedPatient.phone || 'Not provided'}</strong></div>
              <div><span>Age</span><strong>{selectedPatient.age ?? 'Not provided'}</strong></div>
              <div><span>Gender</span><strong>{selectedPatient.gender || 'Not provided'}</strong></div>
              <div><span>City</span><strong>{selectedPatient.city || 'Not provided'}</strong></div>
              <div><span>Registration date</span><strong>{new Date(selectedPatient.createdAt).toLocaleDateString('en-IN')}</strong></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
