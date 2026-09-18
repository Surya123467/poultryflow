import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Bird, CalendarDays, Droplets, Egg, Feather, Gauge, Plus, RefreshCw, Sprout, TriangleAlert, Wheat } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const emptyBatch = { batch_name: '', initial_birds: '', start_date: today };
const emptyLog = { batch_id: '', log_date: today, feed_consumed_kg: '', water_consumed_liters: '', mortality: '', eggs_collected: '' };

async function api(path, options = {}) {
  if (!API_BASE) throw new Error('The API URL is not configured. Add VITE_API_BASE_URL to the environment.');
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const payload = await response.json().catch(() => ({ success: false, message: 'The server returned an invalid response.' }));
  if (!response.ok || payload.success === false) throw new Error(payload.message || 'Request failed.');
  return payload;
}

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status"><span>{notice.message}</span><button onClick={onClose} aria-label="Dismiss notification">×</button></div>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon"><Icon size={21}/></div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

export default function App() {
  const [batches, setBatches] = useState([]);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [logForm, setLogForm] = useState(emptyLog);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState({ batches: true, analytics: false, submit: false });

  const loadBatches = useCallback(async () => {
    setLoading((v) => ({ ...v, batches: true }));
    try {
      const result = await api('/api/batch/list.php');
      setBatches(result.data);
      if (result.data.length) {
        setSelectedBatchId((id) => id || String(result.data[0].id));
        setLogForm((form) => ({ ...form, batch_id: form.batch_id || String(result.data[0].id) }));
      }
    } catch (error) { setNotice({ type: 'error', message: error.message }); }
    finally { setLoading((v) => ({ ...v, batches: false })); }
  }, []);

  const loadAnalytics = useCallback(async (batchId) => {
    if (!batchId) { setAnalytics(null); return; }
    setLoading((v) => ({ ...v, analytics: true }));
    try { const result = await api(`/api/analytics/summary.php?batch_id=${encodeURIComponent(batchId)}`); setAnalytics(result.data); }
    catch (error) { setNotice({ type: 'error', message: error.message }); setAnalytics(null); }
    finally { setLoading((v) => ({ ...v, analytics: false })); }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);
  useEffect(() => { loadAnalytics(selectedBatchId); }, [selectedBatchId, loadAnalytics]);

  const submitBatch = async (event) => {
    event.preventDefault(); setLoading((v) => ({ ...v, submit: true }));
    try {
      const result = await api('/api/batch/create.php', { method: 'POST', body: JSON.stringify({ ...batchForm, initial_birds: Number(batchForm.initial_birds) }) });
      setBatchForm(emptyBatch); setNotice({ type: 'success', message: result.message }); await loadBatches(); setSelectedBatchId(String(result.data.id));
    } catch (error) { setNotice({ type: 'error', message: error.message }); }
    finally { setLoading((v) => ({ ...v, submit: false })); }
  };

  const submitLog = async (event) => {
    event.preventDefault(); setLoading((v) => ({ ...v, submit: true }));
    try {
      const result = await api('/api/logs/create.php', { method: 'POST', body: JSON.stringify({ batch_id: Number(logForm.batch_id), log_date: logForm.log_date, feed_consumed_kg: Number(logForm.feed_consumed_kg), water_consumed_liters: Number(logForm.water_consumed_liters), mortality: Number(logForm.mortality), eggs_collected: Number(logForm.eggs_collected) }) });
      setLogForm((form) => ({ ...emptyLog, batch_id: form.batch_id })); setSelectedBatchId(logForm.batch_id); setNotice({ type: 'success', message: result.message }); await loadAnalytics(logForm.batch_id);
    } catch (error) { setNotice({ type: 'error', message: error.message }); }
    finally { setLoading((v) => ({ ...v, submit: false })); }
  };

  const maxEggs = useMemo(() => Math.max(1, ...(analytics?.trends || []).map((item) => item.eggs_collected)), [analytics]);
  const performance = analytics?.performance;
  const totals = analytics?.totals;

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="PoultryFlow home"><span><Feather size={22}/></span><div>PoultryFlow<small>Farm intelligence</small></div></a><div className="system-state"><i></i> Operations dashboard</div></header>
    <main id="top">
      <section className="intro"><div><span className="eyebrow"><Sprout size={14}/> Flock performance, made visible</span><h1>Make every farm day<br/><em>count.</em></h1><p>Launch batches, capture daily production data, and spot operational trends from one focused workspace.</p></div><div className="intro-stat"><span>Active batches</span><strong>{batches.length.toString().padStart(2, '0')}</strong><small>Currently monitored</small></div></section>
      <Notice notice={notice} onClose={() => setNotice(null)}/>

      <section className="analytics-section" aria-labelledby="analytics-title">
        <div className="section-heading"><div><span>01 / Overview</span><h2 id="analytics-title">Performance snapshot</h2></div><label className="batch-picker">Viewing batch<select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} disabled={!batches.length}>{!batches.length && <option value="">No batches yet</option>}{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_name}</option>)}</select></label></div>
        {loading.analytics ? <div className="loading-card"><RefreshCw className="spin"/> Calculating farm performance…</div> : analytics ? <>
          <div className="metrics-grid">
            <MetricCard icon={Bird} label="Current live birds" value={performance.current_live_birds.toLocaleString()} detail={`From ${analytics.batch.initial_birds.toLocaleString()} placed`} />
            <MetricCard icon={Activity} label="Mortality rate" value={`${performance.mortality_rate_percent}%`} detail={`${performance.total_mortality} total mortality`} tone="amber"/>
            <MetricCard icon={Gauge} label="Feed per egg" value={performance.feed_conversion_ratio == null ? '—' : performance.feed_conversion_ratio.toFixed(4)} detail="kg feed / egg collected" tone="blue"/>
          </div>
          <div className="trend-panel"><div className="trend-header"><div><span>Operational trend</span><h3>Daily egg production</h3></div><div className="total-chip"><Egg size={16}/>{totals.eggs_collected.toLocaleString()} eggs total</div></div>
            {analytics.trends.length ? <div className="bars" aria-label="Daily egg production chart">{analytics.trends.map((item) => <div className="bar-column" key={item.log_date}><span className="bar-value">{item.eggs_collected}</span><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(7, item.eggs_collected / maxEggs * 100)}%` }}></div></div><time>{new Date(`${item.log_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</time></div>)}</div> : <div className="empty-state"><Egg/><strong>No production logs yet</strong><span>Add the first daily record below to begin tracking trends.</span></div>}
          </div>
        </> : <div className="empty-state large"><TriangleAlert/><strong>Analytics will appear here</strong><span>Create a batch to start monitoring farm performance.</span></div>}
      </section>

      <section className="workspace-grid">
        <div className="panel"><div className="section-heading compact"><div><span>02 / Setup</span><h2>Batch management</h2></div><Plus/></div>
          <form onSubmit={submitBatch} className="form-grid"><label className="wide">Batch name<input required maxLength="100" placeholder="e.g. Layer Batch A" value={batchForm.batch_name} onChange={(e) => setBatchForm({ ...batchForm, batch_name: e.target.value })}/></label><label>Initial birds<input required type="number" min="1" placeholder="5000" value={batchForm.initial_birds} onChange={(e) => setBatchForm({ ...batchForm, initial_birds: e.target.value })}/></label><label>Start date<input required type="date" value={batchForm.start_date} onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}/></label><button className="primary-button wide" disabled={loading.submit}><Plus size={18}/> Launch new batch</button></form>
          <div className="batch-list"><div className="list-label">Active batches <span>{batches.length}</span></div>{loading.batches ? <div className="loading-row"><RefreshCw className="spin"/> Loading batches…</div> : batches.map((batch) => <button key={batch.id} className={`batch-row ${String(batch.id) === selectedBatchId ? 'selected' : ''}`} onClick={() => setSelectedBatchId(String(batch.id))}><span className="bird-mark"><Bird size={18}/></span><span><strong>{batch.batch_name}</strong><small><CalendarDays size={13}/>{batch.start_date}</small></span><b>{batch.initial_birds.toLocaleString()}<small>birds</small></b></button>)}</div>
        </div>

        <div className="panel log-panel"><div className="section-heading compact"><div><span>03 / Daily input</span><h2>Record farm activity</h2></div><Wheat/></div>
          <form onSubmit={submitLog} className="form-grid"><label className="wide">Batch<select required value={logForm.batch_id} onChange={(e) => setLogForm({ ...logForm, batch_id: e.target.value })}><option value="">Select a batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_name}</option>)}</select></label><label className="wide">Log date<input required type="date" value={logForm.log_date} onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}/></label><label><span className="label-icon"><Wheat size={14}/> Feed (kg)</span><input required type="number" min="0" step="0.01" placeholder="320.50" value={logForm.feed_consumed_kg} onChange={(e) => setLogForm({ ...logForm, feed_consumed_kg: e.target.value })}/></label><label><span className="label-icon"><Droplets size={14}/> Water (L)</span><input required type="number" min="0" step="0.01" placeholder="580" value={logForm.water_consumed_liters} onChange={(e) => setLogForm({ ...logForm, water_consumed_liters: e.target.value })}/></label><label><span className="label-icon"><Activity size={14}/> Mortality</span><input required type="number" min="0" placeholder="4" value={logForm.mortality} onChange={(e) => setLogForm({ ...logForm, mortality: e.target.value })}/></label><label><span className="label-icon"><Egg size={14}/> Eggs</span><input required type="number" min="0" placeholder="4250" value={logForm.eggs_collected} onChange={(e) => setLogForm({ ...logForm, eggs_collected: e.target.value })}/></label><button className="primary-button wide" disabled={loading.submit || !batches.length}><Activity size={18}/> Save daily record</button></form>
        </div>
      </section>
    </main>
    <footer><span>PoultryFlow</span><p>Operational clarity for modern poultry farms.</p></footer>
  </div>;
}
