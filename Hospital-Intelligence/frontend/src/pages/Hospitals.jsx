
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Building2, MapPin, Star, Pencil,
  Trash2, Eye, X, RefreshCw, AlertCircle
} from 'lucide-react';
import '../styles/hospitals.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  name: '',
  city: '',
  state: '',
  region: 'North India',
  address: '',
  description: '',
  phone: '',
  website: ''
};

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('cc-token');

  const loadHospitals = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/hospitals`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Unable to load hospitals');

      setHospitals(result.data || []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hospitals.filter(hospital =>
      [hospital.name, hospital.city, hospital.state]
        .some(value => value?.toLowerCase().includes(query))
    );
  }, [hospitals, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = hospital => {
    setEditing(hospital);
    setForm({
      name: hospital.name || '',
      city: hospital.city || '',
      state: hospital.state || '',
      region: hospital.region || '',
      address: hospital.address || '',
      description: hospital.description || '',
      phone: hospital.phone || '',
      website: hospital.website || ''
    });
    setFormOpen(true);
  };

  const handleSave = async event => {
    event.preventDefault();

    if (!token) {
      setError('Admin login is required to manage hospitals.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editing
        ? `${API}/hospitals/${editing.id}`
        : `${API}/hospitals`;

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          website: form.website || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save hospital');
      }

      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadHospitals();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteHospital = async hospital => {
    if (!token) {
      setError('Admin login is required to delete hospitals.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${hospital.name}? Related doctors, services and facilities will also be deleted.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/hospitals/${hospital.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Delete failed');

      await loadHospitals();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="hm-page">
      <div className="hm-heading">
        <div>
          <span className="hm-eyebrow">DIRECTORY MANAGEMENT</span>
          <h2>Hospital Management</h2>
          <p>Manage hospital profiles and directory information.</p>
        </div>
        <button className="hm-primary-btn" onClick={openAdd}>
          <Plus size={17} /> Add Hospital
        </button>
      </div>

      <div className="hm-stats">
        <article><span>Total hospitals</span><strong>{hospitals.length}</strong></article>
        <article><span>Verified hospitals</span><strong>{hospitals.filter(h => h.verified).length}</strong></article>
        <article><span>Demo / unverified</span><strong>{hospitals.filter(h => !h.verified).length}</strong></article>
      </div>

      {error && (
        <div className="hm-error">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError('')} aria-label="Dismiss error"><X size={16}/></button>
        </div>
      )}

      <section className="hm-panel">
        <div className="hm-toolbar">
          <div>
            <h3>Hospital directory</h3>
            <p>{filtered.length} hospital records</p>
          </div>
          <label className="hm-search">
            <Search size={17}/>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search name, city or state..."
            />
          </label>
          <button className="hm-refresh" onClick={loadHospitals} title="Refresh">
            <RefreshCw size={17}/>
          </button>
        </div>

        {loading ? (
          <div className="hm-empty">Loading hospitals...</div>
        ) : filtered.length === 0 ? (
          <div className="hm-empty">No hospitals found.</div>
        ) : (
          <div className="hm-table-wrap">
            <table className="hm-table">
              <thead>
                <tr>
                  <th>HOSPITAL</th>
                  <th>LOCATION</th>
                  <th>RATING</th>
                  <th>DATA STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(hospital => (
                  <tr key={hospital.id}>
                    <td>
                      <div className="hm-hospital-name">
                        <span className="hm-building-icon"><Building2 size={19}/></span>
                        <div>
                          <strong>{hospital.name}</strong>
                          <small>{hospital.phone || 'Phone not provided'}</small>
                        </div>
                      </div>
                    </td>
                    <td><MapPin size={14}/> {hospital.city}, {hospital.state}</td>
                    <td><Star size={14} fill="currentColor"/> {hospital.rating || '—'}</td>
                    <td>
                      <span className={hospital.verified ? 'hm-status verified' : 'hm-status demo'}>
                        {hospital.verified ? 'Verified' : 'Demo / Unverified'}
                      </span>
                    </td>
                    <td>
                      <div className="hm-actions">
                        <button onClick={() => setSelected(hospital)} title="View"><Eye size={16}/></button>
                        <button onClick={() => openEdit(hospital)} title="Edit"><Pencil size={16}/></button>
                        <button className="hm-delete" onClick={() => deleteHospital(hospital)} title="Delete"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <div className="hm-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) setFormOpen(false);
        }}>
          <form className="hm-modal" onSubmit={handleSave}>
            <div className="hm-modal-heading">
              <div>
                <h3>{editing ? 'Edit Hospital' : 'Add New Hospital'}</h3>
                <p>Enter the hospital profile information.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}><X/></button>
            </div>

            <div className="hm-form-grid">
              {[
                ['name', 'Hospital name'],
                ['city', 'City'],
                ['state', 'State'],
                ['region', 'Region'],
                ['phone', 'Phone number'],
                ['website', 'Website']
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={form[key]}
                    onChange={event => setForm({ ...form, [key]: event.target.value })}
                    required={['name', 'city', 'state'].includes(key)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                </label>
              ))}

              <label className="hm-full">
                Address
                <input
                  value={form.address}
                  onChange={event => setForm({ ...form, address: event.target.value })}
                  required
                  placeholder="Full hospital address"
                />
              </label>

              <label className="hm-full">
                Description
                <textarea
                  value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })}
                  required
                  minLength={10}
                  rows={3}
                  placeholder="Hospital description (minimum 10 characters)"
                />
              </label>
            </div>

            <div className="hm-modal-footer">
              <button type="button" className="hm-cancel" onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="hm-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create hospital'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="hm-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) setSelected(null);
        }}>
          <section className="hm-modal">
            <div className="hm-modal-heading">
              <div><h3>{selected.name}</h3><p>{selected.city}, {selected.state}</p></div>
              <button onClick={() => setSelected(null)}><X/></button>
            </div>
            <p>{selected.description}</p>
            <p><strong>Address:</strong> {selected.address}</p>
            <p><strong>Phone:</strong> {selected.phone || 'Not provided'}</p>
            <p><strong>Website:</strong> {selected.website || 'Not provided'}</p>
            <p><strong>Doctors:</strong> {selected.doctors?.length || 0}</p>
            <p><strong>Services:</strong> {selected.services?.length || 0}</p>
            <p><strong>Facilities:</strong> {selected.facilities?.length || 0}</p>
            <p><strong>Data status:</strong> {selected.verified ? 'Verified' : 'Demo / Unverified'}</p>
          </section>
        </div>
      )}
    </div>
  );
}
