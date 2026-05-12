import React, { useState, useEffect } from 'react';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://cap-dev-backend-one.vercel.app';

const formatDkk = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);
};

const AdminFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFlag, setNewFlag] = useState({ name: '', price: '' });
  const [editValues, setEditValues] = useState({ name: '', price: '' });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/flags`);
      const data = await res.json();
      setFlags(data);
    } catch (err) {
      showToast('Fejl ved hentning af flag', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleAdd = async () => {
    if (!newFlag.name.trim()) return showToast('Navn er påkrævet', 'error');
    if (newFlag.price === '') return showToast('Pris er påkrævet', 'error');
    if (!Number.isFinite(Number(newFlag.price))) return showToast('Pris skal være et tal', 'error');

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlag.name.trim(),
          price: parseFloat(newFlag.price)
        }),
      });

      if (!res.ok) throw new Error();

      setNewFlag({ name: '', price: '' });
      await fetchFlags();
      showToast(`"${newFlag.name}" blev tilføjet`);
    } catch {
      showToast('Fejl ved oprettelse af flag', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (flag) => {
    setEditingId(flag.id);
    setEditValues({ name: flag.name, price: flag.price });
  };

  const handleUpdate = async (id) => {
    if (!editValues.name.trim()) return showToast('Navn er påkrævet', 'error');
    if (editValues.price === '') return showToast('Pris er påkrævet', 'error');
    if (!Number.isFinite(Number(editValues.price))) return showToast('Pris skal være et tal', 'error');

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/flags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editValues.name.trim(),
          price: parseFloat(editValues.price)
        }),
      });

      if (!res.ok) throw new Error();

      setEditingId(null);
      await fetchFlags();
      showToast('Flag opdateret succesfuldt');
    } catch {
      showToast('Fejl ved opdatering', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Er du sikker på du vil slette "${name}"?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/flags/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      await fetchFlags();
      showToast(`"${name}" blev slettet`);
    } catch {
      showToast('Fejl ved sletning', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${toast.type === 'error' ? 'bg-red-200' : 'bg-emerald-200'}`} />
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  🏳️
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Admin Dashboard</div>
                  <div className="text-xs text-slate-500">Cap-Zee</div>
                </div>
              </div>

              <nav className="px-3 py-3">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Administration
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-indigo-700 shadow-sm border border-indigo-100">
                      🏳️
                    </span>
                    Flags
                  </div>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500 border border-slate-200">
                      ⚙️
                    </span>
                    Settings
                  </div>
                </div>
              </nav>

              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">Status</div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            {/* Topbar */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Admin / Flags
                  </div>
                  <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                    Flag administration
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Tilføj, rediger eller fjern flag til konfiguratoren.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Total: <span className="ml-2 text-slate-900">{flags.length}</span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchFlags}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Opdaterer…' : 'Opdater'}
                  </button>
                </div>
              </div>
            </div>

            {/* Content cards */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-base font-semibold text-slate-900">Tilføj nyt flag</h2>
                <p className="mt-1 text-sm text-slate-500">Opret et nyt flag og angiv ekstra pris.</p>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-7">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Navn</label>
                    <input
                      type="text"
                      value={newFlag.name}
                      onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      placeholder="f.eks. Sverige"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Ekstra pris (DKK)</label>
                    <input
                      type="number"
                      value={newFlag.price}
                      onChange={(e) => setNewFlag(prev => ({ ...prev, price: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      placeholder="0"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      onClick={handleAdd}
                      disabled={saving}
                      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {saving ? 'Gemmer…' : 'Tilføj'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Nuværende flag <span className="text-slate-500 font-normal">({flags.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={fetchFlags}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Opdater
                </button>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-500">Henter flag…</div>
              ) : flags.length === 0 ? (
                <div className="py-16 text-center text-slate-500">Ingen flag fundet. Tilføj det første ovenfor.</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-3 font-semibold">#</th>
                        <th className="px-6 py-3 font-semibold">Navn</th>
                        <th className="px-6 py-3 text-right font-semibold">Pris</th>
                        <th className="px-6 py-3 text-right font-semibold">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {flags.map((flag, index) => (
                        <tr
                          key={flag.id}
                          className={editingId === flag.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}
                        >
                          <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>

                          {editingId === flag.id ? (
                            <>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={editValues.name}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdate(flag.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  autoFocus
                                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  value={editValues.price}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdate(flag.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  min="0"
                                  className="ml-auto block w-32 rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-right text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdate(flag.id)}
                                    disabled={saving}
                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                  >
                                    Gem
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                                  >
                                    Annuller
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-900">{flag.name}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {Number(flag.price) > 0 ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                                    {formatDkk(flag.price)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                                    Inkluderet
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(flag)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                  >
                                    Rediger
                                  </button>
                                  <button
                                    onClick={() => handleDelete(flag.id, flag.name)}
                                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                                  >
                                    Slet
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Ændringer træder i kraft øjeblikkeligt for alle nye ordrer.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminFlags;