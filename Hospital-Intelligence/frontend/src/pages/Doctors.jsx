
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, X, Stethoscope,
  Building2, Users, IndianRupee, BriefcaseMedical,
  RefreshCw, Clock, MapPin
} from 'lucide-react';
import '../styles/doctors.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  name: '',
  speciality: '',
  qualification: '',
  experienceYears: '',
  consultationFee: '',
  hospitalId: ''
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showAvailability, setShowAvailability] = useState(false);
const [availabilityDoctor, setAvailabilityDoctor] = useState(null);
const [availabilityDays, setAvailabilityDays] = useState([]);
const [slotDuration, setSlotDuration] = useState(30);
const [availabilitySaving, setAvailabilitySaving] = useState(false);
const [availabilityError, setAvailabilityError] = useState('');

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const createEmptySchedule = () =>
  weekdays.map(dayLabel => ({
    dayLabel,
    enabled: false,
    startTime: '10:00',
    endTime: '17:00'
  }));

  const token = () => localStorage.getItem('cc-token');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [doctorResponse, hospitalResponse] = await Promise.all([
        fetch(`${API}/doctors`),
        fetch(`${API}/hospitals`)
      ]);

      if (!doctorResponse.ok || !hospitalResponse.ok) {
        throw new Error('Unable to load doctors or hospitals.');
      }

      const doctorData = await doctorResponse.json();
      const hospitalData = await hospitalResponse.json();

      setDoctors(doctorData.doctors || []);
      setHospitals(
  Array.isArray(hospitalData)
    ? hospitalData
    : hospitalData.data || hospitalData.hospitals || []
);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const specialities = useMemo(
    () => [...new Set(doctors.map(d => d.speciality))].sort(),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.qualification.toLowerCase().includes(search.toLowerCase()) ||
        doctor.hospital?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesSpeciality =
        !specialityFilter || doctor.speciality === specialityFilter;

      const matchesHospital =
        !hospitalFilter || doctor.hospitalId === hospitalFilter;

      return matchesSearch && matchesSpeciality && matchesHospital;
    });
  }, [doctors, search, specialityFilter, hospitalFilter]);
 
async function openAvailabilityManager(doctor) {
  setAvailabilityError('');
  setAvailabilityDoctor(doctor);
  setAvailabilityDays(createEmptySchedule());
  setSlotDuration(30);
  setShowAvailability(true);

  try {
    const response = await fetch(
      `${API}/doctors/${doctor.id}/availability`,
      {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to load availability.');
    }

    const savedDays = result.availability || [];

    setAvailabilityDays(
      weekdays.map(dayLabel => {
        const saved = savedDays.find(
          item => item.dayLabel === dayLabel && item.status === 'ACTIVE'
        );

        if (!saved) {
          return {
            dayLabel,
            enabled: false,
            startTime: '10:00',
            endTime: '17:00'
          };
        }

        const firstSlot = saved.slots?.[0];
        const lastSlot = saved.slots?.[saved.slots.length - 1];

        function to24Hour(time) {
          if (!time) return '10:00';

          const match = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
          if (!match) return '10:00';

          let hour = Number(match[1]);
          const minute = match[2];

          if (match[3] === 'PM' && hour !== 12) hour += 12;
          if (match[3] === 'AM' && hour === 12) hour = 0;

          return `${String(hour).padStart(2, '0')}:${minute}`;
        }

        const startTime = to24Hour(firstSlot);

        const lastMatch = lastSlot?.match(
          /^(\d{1,2}):(\d{2}) (AM|PM)$/
        );

        let endTime = '17:00';

        if (lastMatch) {
          let hour = Number(lastMatch[1]);
          if (lastMatch[3] === 'PM' && hour !== 12) hour += 12;
          if (lastMatch[3] === 'AM' && hour === 12) hour = 0;

          const endMinutes = hour * 60 + Number(lastMatch[2]) + 30;

          endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
        }

        return {
          dayLabel,
          enabled: true,
          startTime,
          endTime
        };
      })
    );
  } catch (err) {
    setAvailabilityError(err.message);
  }
}

function updateAvailabilityDay(index, field, value) {
  setAvailabilityDays(previous =>
    previous.map((day, i) =>
      i === index ? { ...day, [field]: value } : day
    )
  );
}

async function saveAvailability(event) {
  event.preventDefault();

  if (!token()) {
    setAvailabilityError('Please log in as administrator.');
    return;
  }

  const activeDays = availabilityDays.filter(day => day.enabled);

  if (activeDays.length === 0) {
    setAvailabilityError('Please select at least one available day.');
    return;
  }

  for (const day of activeDays) {
    if (day.endTime <= day.startTime) {
      setAvailabilityError(
        `End time must be after start time on ${day.dayLabel}.`
      );
      return;
    }
  }

  setAvailabilitySaving(true);
  setAvailabilityError('');

  try {
    const response = await fetch(
      `${API}/doctors/${availabilityDoctor.id}/availability`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          slotDuration,
          days: activeDays.map(day => ({
            dayLabel: day.dayLabel,
            startTime: day.startTime,
            endTime: day.endTime
          }))
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to save availability.');
    }

    await loadData();

    setShowAvailability(false);
    setAvailabilityDoctor(null);

    alert('Doctor availability updated successfully!');
  } catch (err) {
    setAvailabilityError(err.message);
  } finally {
    setAvailabilitySaving(false);
  }
}

  function openAddForm() {
    setEditingDoctor(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(doctor) {
    setEditingDoctor(doctor);
    setForm({
      name: doctor.name,
      speciality: doctor.speciality,
      qualification: doctor.qualification,
      experienceYears: String(doctor.experienceYears),
      consultationFee: String(doctor.consultationFee),
      hospitalId: doctor.hospitalId
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingDoctor(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token()) {
      setError('Please log in with an administrator account to manage doctors.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee)
    };

    try {
      const response = await fetch(
        editingDoctor
          ? `${API}/doctors/${editingDoctor.id}`
          : `${API}/doctors`,
        {
          method: editingDoctor ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token()}`
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save doctor.');
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doctor) {
    if (!window.confirm(`Are you sure you want to delete ${doctor.name}?`)) {
      return;
    }

    if (!token()) {
      setError('Please log in with an administrator account to delete doctors.');
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API}/doctors/${doctor.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete doctor.');
      }

      await loadData();
      if (selectedDoctor?.id === doctor.id) {
        setSelectedDoctor(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="dm-page">
      <div className="dm-heading">
        <div>
          <div className="dm-eyebrow">
            <span /> HEALTHCARE INTELLIGENCE
          </div>
          <h1>Doctors Management</h1>
          <p>Manage doctor profiles, specializations and hospital associations.</p>
        </div>

        <div className="dm-heading-actions">
          <button className="dm-secondary-btn" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="dm-primary-btn" onClick={openAddForm}>
            <Plus size={17} /> Add Doctor
          </button>
        </div>
      </div>

      <div className="dm-demo-notice">
        <Stethoscope size={20} />
        <div>
          <strong>Healthcare directory</strong>
          <p>Seeded doctor records are illustrative and are not verified medical listings.</p>
        </div>
      </div>

      {error && (
        <div className="dm-error">
          {error}
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      <section className="dm-stats">
        <div className="dm-stat-card">
          <div className="dm-stat-icon blue"><Stethoscope size={21} /></div>
          <span>Total doctors</span>
          <strong>{doctors.length.toString().padStart(2, '0')}</strong>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon purple"><BriefcaseMedical size={21} /></div>
          <span>Specializations</span>
          <strong>{specialities.length.toString().padStart(2, '0')}</strong>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon teal"><Building2 size={21} /></div>
          <span>Hospitals covered</span>
          <strong>{new Set(doctors.map(d => d.hospitalId)).size.toString().padStart(2, '0')}</strong>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon orange"><Users size={21} /></div>
          <span>Available hospitals</span>
          <strong>{hospitals.length.toString().padStart(2, '0')}</strong>
        </div>
      </section>

      <section className="dm-directory">
        <div className="dm-directory-heading">
          <div>
            <h2>Doctor directory</h2>
            <p>Browse and manage registered doctor profiles.</p>
          </div>
          <span className="dm-record-count">{filteredDoctors.length} records</span>
        </div>

        <div className="dm-filters">
          <div className="dm-search">
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search doctor, qualification or hospital..."
            />
          </div>

          <select value={specialityFilter} onChange={e => setSpecialityFilter(e.target.value)}>
            <option value="">All specializations</option>
            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={hospitalFilter} onChange={e => setHospitalFilter(e.target.value)}>
            <option value="">All hospitals</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="dm-empty">
            <RefreshCw className="dm-spinner" size={26} />
            <p>Loading doctor directory...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="dm-empty">
            <Stethoscope size={34} />
            <h3>No doctors found</h3>
            <p>Try changing your filters or add a new doctor.</p>
          </div>
        ) : (
          <div className="dm-table-wrap">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>DOCTOR</th>
                  <th>SPECIALIZATION</th>
                  <th>HOSPITAL</th>
                  <th>EXPERIENCE</th>
                  <th>CONSULTATION FEE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doctor => (
                  <tr key={doctor.id}>
                    <td>
                      <button className="dm-doctor-name" onClick={() => setSelectedDoctor(doctor)}>
                        <span className="dm-avatar">{doctor.name.replace(/^Dr\.\s*/i, '').charAt(0)}</span>
                        <span>
                          <strong>{doctor.name}</strong>
                          <small>{doctor.qualification}</small>
                        </span>
                      </button>
                    </td>
                    <td><span className="dm-speciality">{doctor.speciality}</span></td>
                    <td>
                      <strong className="dm-hospital-name">{doctor.hospital?.name || 'Unknown hospital'}</strong>
                      <small className="dm-city"><MapPin size={12} /> {doctor.hospital?.city || '—'}</small>
                    </td>
                    <td>{doctor.experienceYears} years</td>
                    <td>₹{doctor.consultationFee.toLocaleString('en-IN')}</td>
                    <td>
                     <div className="dm-row-actions">
  <button
    title="View details"
    onClick={() => setSelectedDoctor(doctor)}
  >
    <Users size={16} />
  </button>

  <button
    title="Manage availability"
    onClick={() => openAvailabilityManager(doctor)}
  >
    <Clock size={16} />
  </button>

  <button
    title="Edit doctor"
    onClick={() => openEditForm(doctor)}
  >
    <Pencil size={16} />
  </button>

  <button
    title="Delete doctor"
    className="dm-delete"
    onClick={() => handleDelete(doctor)}
  >
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
        <div className="dm-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget) closeForm();
        }}>
          <form className="dm-modal" onSubmit={handleSubmit}>
            <div className="dm-modal-heading">
              <div>
                <h2>{editingDoctor ? 'Edit doctor' : 'Add new doctor'}</h2>
                <p>Enter the doctor's professional details.</p>
              </div>
              <button type="button" onClick={closeForm}><X size={20} /></button>
            </div>

            <label>Doctor name<input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Dr. A. Sharma" required minLength={2} /></label>

            <div className="dm-form-grid">
              <label>Specialization<input name="speciality" value={form.speciality} onChange={handleChange} placeholder="e.g. Cardiology" required /></label>
              <label>Qualification<input name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. DM Cardiology" required /></label>
              <label>Experience (years)<input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={handleChange} required /></label>
              <label>Consultation fee (₹)<input name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={handleChange} required /></label>
            </div>

            <label>Associated hospital
              <select name="hospitalId" value={form.hospitalId} onChange={handleChange} required>
                <option value="">Select a hospital</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
              </select>
            </label>

            <div className="dm-modal-actions">
              <button type="button" className="dm-secondary-btn" onClick={closeForm}>Cancel</button>
              <button type="submit" className="dm-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editingDoctor ? 'Save changes' : 'Add doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      
{showAvailability && availabilityDoctor && (
  <div
    className="dm-overlay"
    onMouseDown={e => {
      if (e.target === e.currentTarget && !availabilitySaving) {
        setShowAvailability(false);
      }
    }}
  >
    <form
      className="dm-modal dm-availability-modal"
      onSubmit={saveAvailability}
    >
      <div className="dm-modal-heading">
        <div>
          <h2>Manage Availability</h2>
          <p>{availabilityDoctor.name} — Weekly schedule</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAvailability(false)}
        >
          <X size={20} />
        </button>
      </div>

      {availabilityError && (
        <div className="dm-error">{availabilityError}</div>
      )}

      <div className="dm-availability-manager">
        {availabilityDays.map((day, index) => (
          <div className="dm-schedule-day" key={day.dayLabel}>
            <label className="dm-day-toggle">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={e =>
                  updateAvailabilityDay(index, 'enabled', e.target.checked)
                }
              />
              <strong>{day.dayLabel}</strong>
            </label>

            {day.enabled ? (
              <div className="dm-time-fields">
                <label>
                  Start
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={e =>
                      updateAvailabilityDay(index, 'startTime', e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  End
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={e =>
                      updateAvailabilityDay(index, 'endTime', e.target.value)
                    }
                    required
                  />
                </label>
              </div>
            ) : (
              <span className="dm-day-off">Day off</span>
            )}
          </div>
        ))}
      </div>

      <label className="dm-slot-duration">
        Consultation slot duration
        <select
          value={slotDuration}
          onChange={e => setSlotDuration(Number(e.target.value))}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </label>

      <div className="dm-modal-actions">
        <button
          type="button"
          className="dm-secondary-btn"
          onClick={() => setShowAvailability(false)}
          disabled={availabilitySaving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="dm-primary-btn"
          disabled={availabilitySaving}
        >
          {availabilitySaving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </form>
  </div>
)}


      {selectedDoctor && (
        <div className="dm-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget) setSelectedDoctor(null);
        }}>
          <div className="dm-modal dm-detail-modal">
            <div className="dm-modal-heading">
              <div>
                <h2>Doctor profile</h2>
                <p>Professional information and availability.</p>
              </div>
              <button onClick={() => setSelectedDoctor(null)}><X size={20} /></button>
            </div>

            <div className="dm-profile">
              <span className="dm-profile-avatar"><Stethoscope size={26} /></span>
              <div>
                <h3>{selectedDoctor.name}</h3>
                <p>{selectedDoctor.speciality}</p>
              </div>
            </div>

            <div className="dm-detail-grid">
              <div><span>Qualification</span><strong>{selectedDoctor.qualification}</strong></div>
              <div><span>Experience</span><strong>{selectedDoctor.experienceYears} years</strong></div>
              <div><span>Consultation fee</span><strong>₹{selectedDoctor.consultationFee}</strong></div>
              <div><span>Hospital</span><strong>{selectedDoctor.hospital?.name}</strong></div>
            </div>

            <h3 className="dm-availability-title"><Clock size={17} /> Availability (sample data)</h3>
            {(selectedDoctor.availability || []).length ? (
              selectedDoctor.availability.map(slot => (
                <div className="dm-slot" key={slot.id}>
                  <strong>{slot.dayLabel}</strong>
                  <span>{slot.slots.join(' · ')}</span>
                </div>
              ))
            ) : (
              <p className="dm-muted">No availability information recorded.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
