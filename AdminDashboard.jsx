import React, { useEffect, useState } from 'react';
import { getApiBaseUrl, getAuthHeaders, getFriendlyFetchError, parseApiResponse } from './auth.js';

const API_BASE_URL = getApiBaseUrl();

const emptyForm = {
  name: '',
  address: '',
  lat: '',
  lng: '',
  price: '',
  totalSlots: '',
};

function toFormState(spot) {
  return {
    name: spot.name || spot.description || '',
    address: spot.location?.address || '',
    lat: spot.location?.lat ?? '',
    lng: spot.location?.lng ?? '',
    price: spot.price ?? '',
    totalSlots: spot.totalSlots ?? '',
  };
}

function buildPayload(formState) {
  return {
    name: formState.name.trim(),
    location: {
      address: formState.address.trim(),
      lat: Number(formState.lat),
      lng: Number(formState.lng),
    },
    price: Number(formState.price),
    totalSlots: Number(formState.totalSlots),
  };
}

const AdminDashboard = () => {
  const [spots, setSpots] = useState([]);
  const [formState, setFormState] = useState(emptyForm);
  const [editingSpotId, setEditingSpotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSpotId, setActiveSpotId] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSpots = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/admin`, {
        headers: getAuthHeaders(),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load parking spots.');
      }

      setSpots(data.spots || []);
      setSource(data.source || '');
    } catch (err) {
      setError(getFriendlyFetchError(err, 'Unable to load parking spots.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots();
  }, []);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingSpotId('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = (spot) => {
    setFormState(toFormState(spot));
    setEditingSpotId(spot.id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = buildPayload(formState);
      const isEditing = Boolean(editingSpotId);
      const response = await fetch(
        `${API_BASE_URL}/api/spots/admin${isEditing ? `/${editingSpotId}` : ''}`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save parking spot.');
      }

      setSuccess(data.message || `Parking spot ${isEditing ? 'updated' : 'created'} successfully.`);
      resetForm();
      await loadSpots();
    } catch (err) {
      setError(getFriendlyFetchError(err, 'Unable to save parking spot.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (spot) => {
    const confirmed = window.confirm(`Delete "${spot.name || spot.description}"?`);

    if (!confirmed) {
      return;
    }

    setActiveSpotId(spot.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/admin/${spot.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete parking spot.');
      }

      if (editingSpotId === spot.id) {
        resetForm();
      }

      setSuccess(data.message || 'Parking spot deleted successfully.');
      await loadSpots();
    } catch (err) {
      setError(getFriendlyFetchError(err, 'Unable to delete parking spot.'));
    } finally {
      setActiveSpotId('');
    }
  };

  const handleToggleAvailability = async (spot) => {
    setActiveSpotId(spot.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/admin/${spot.id}/availability`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: !spot.isAvailable,
        }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update availability.');
      }

      setSuccess(data.message || 'Availability updated successfully.');
      await loadSpots();
    } catch (err) {
      setError(getFriendlyFetchError(err, 'Unable to update availability.'));
    } finally {
      setActiveSpotId('');
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-1">Admin Dashboard</h1>
          <p className="text-muted mb-0">
            Manage parking spots, pricing, total capacity, and availability from one place.
          </p>
        </div>
        {source && <span className="badge text-bg-secondary fs-6">Data source: {source}</span>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 admin-panel-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h4 mb-0">{editingSpotId ? 'Edit Parking Spot' : 'Add Parking Spot'}</h2>
                {editingSpotId && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Parking Spot Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="e.g. City Center Parking"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Location / Address</label>
                  <input
                    className="form-control"
                    name="address"
                    value={formState.address}
                    onChange={handleChange}
                    placeholder="Street, landmark, or area"
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="lat"
                      value={formState.lat}
                      onChange={handleChange}
                      placeholder="26.2183"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="lng"
                      value={formState.lng}
                      onChange={handleChange}
                      placeholder="78.1828"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price Per Hour</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      name="price"
                      value={formState.price}
                      onChange={handleChange}
                      placeholder="20"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Total Slots</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      name="totalSlots"
                      value={formState.totalSlots}
                      onChange={handleChange}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>

                <button className="btn btn-primary w-100 mt-4" type="submit" disabled={submitting}>
                  {submitting
                    ? editingSpotId
                      ? 'Updating...'
                      : 'Creating...'
                    : editingSpotId
                      ? 'Update Parking Spot'
                      : 'Add Parking Spot'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm border-0 admin-panel-card">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h4 mb-0">All Parking Spots</h2>
                <button className="btn btn-outline-secondary btn-sm" onClick={loadSpots} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="text-muted">Loading parking spots...</div>
              ) : spots.length === 0 ? (
                <div className="text-muted">No parking spots found yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Total Slots</th>
                        <th>Available</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spots.map((spot) => {
                        const isBusy = activeSpotId === spot.id;

                        return (
                          <tr key={spot.id}>
                            <td className="fw-semibold">{spot.name || spot.description}</td>
                            <td>
                              <div>{spot.location?.address || 'Coordinates only'}</div>
                              <small className="text-muted">
                                {spot.location?.lat}, {spot.location?.lng}
                              </small>
                            </td>
                            <td>Rs {spot.price}</td>
                            <td>{spot.totalSlots}</td>
                            <td>{spot.availableSlots}</td>
                            <td>
                              <span className={`badge ${spot.isAvailable ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                {spot.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex flex-wrap justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(spot)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`btn btn-sm ${spot.isAvailable ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                  onClick={() => handleToggleAvailability(spot)}
                                  disabled={isBusy}
                                >
                                  {isBusy ? 'Saving...' : spot.isAvailable ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(spot)}
                                  disabled={isBusy}
                                >
                                  {isBusy ? 'Working...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
