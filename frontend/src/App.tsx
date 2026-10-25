import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Server,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";

type Severity = "CRITICAL" | "WARNING";
type AlertStatus = "ACTIVE" | "RESOLVED";

type Alert = {
  id: number;
  api_name: string;
  anomaly_type: string;
  severity: Severity;
  status: AlertStatus;
  message: string;
  ai_title?: string | null;
  ai_explanation?: string | null;
  ai_recommendation?: string | null;
  ai_status?: string | null;
  response_time_ms: number;
  status_code: number;
  records_returned: number;
  created_at: string;
};

type AlertResponse = {
  success: boolean;
  total: number;
  pagination: { page: number; limit: number; total_pages: number };
  alerts: Alert[];
};

type MonitorRecord = {
  api_name: string;
  response_time_ms: number;
  status_code: number;
  records_returned: number;
};

const API_BASE = "/api";

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [apiName, setApiName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recordForm, setRecordForm] = useState<MonitorRecord>({
    api_name: "",
    response_time_ms: 0,
    status_code: 200,
    records_returned: 0,
  });

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "10", sort: "desc" });
    if (severity) params.set("severity", severity);
    if (status) params.set("status", status);
    if (apiName) params.set("api_name", apiName);

    try {
      const response = await fetch(`${API_BASE}/alerts?${params}`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = (await response.json()) as AlertResponse;
      setAlerts(data.alerts);
      setTotal(data.total);
      setTotalPages(data.pagination.total_pages);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load alerts");
    } finally {
      setLoading(false);
    }
  }, [apiName, page, severity, status]);

  useEffect(() => void loadAlerts(), [loadAlerts]);

  async function handleJsonUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setError("");

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const records = (Array.isArray(parsed) ? parsed : [parsed]) as MonitorRecord[];
      if (records.length === 0 || records.length > 100) {
        throw new Error("Upload between 1 and 100 monitoring records.");
      }

      const response = await fetch(`${API_BASE}/monitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Array.isArray(parsed) ? records : records[0]),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || `Upload failed with status ${response.status}`);

      setUploadMessage(`${records.length} record${records.length === 1 ? "" : "s"} processed successfully.`);
      setPage(1);
      await loadAlerts();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to process JSON file");
    } finally {
      setUploading(false);
    }
  }

  async function handleRecordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setUploadMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/monitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordForm),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || `Request failed with status ${response.status}`);

      setUploadMessage("Monitoring record processed successfully.");
      setRecordForm({ api_name: "", response_time_ms: 0, status_code: 200, records_returned: 0 });
      setPage(1);
      await loadAlerts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit monitoring record");
    } finally {
      setUploading(false);
    }
  }

  const criticalCount = useMemo(() => alerts.filter((alert) => alert.severity === "CRITICAL").length, [alerts]);
  const warningCount = useMemo(() => alerts.filter((alert) => alert.severity === "WARNING").length, [alerts]);
  const apiCount = useMemo(() => new Set(alerts.map((alert) => alert.api_name)).size, [alerts]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setPage(1);
    setter(value);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={21} /></div><div><strong>API PATRON</strong><span>Intelligent monitoring</span></div></div>
        <nav><a className="nav-link active"><ShieldAlert size={18} /> Alert center</a><a className="nav-link"><Activity size={18} /> Live activity</a><a className="nav-link"><Server size={18} /> API services</a></nav>
        <div className="sidebar-footer"><div className="status-dot"><span /> System operational</div><small>Monitoring workspace</small></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">Operations / Alert center</p><h1>Keep every API in sight.</h1><p className="subtitle">Real-time anomaly detection and AI-guided response insights.</p></div><div className="topbar-actions"><input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleJsonUpload} hidden /><button className="upload-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload size={16} /> {uploading ? "Processing..." : "Upload JSON"}</button><button className="refresh-button" onClick={loadAlerts} disabled={loading || uploading}><RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh</button></div></header>

        {uploadMessage && <div className="upload-success"><CheckCircle2 size={16} /> {uploadMessage}</div>}

        <form className="record-form" onSubmit={handleRecordSubmit}>
          <div className="record-form-heading"><div><h2>Add single observation</h2><p>Send one API response directly into the monitoring pipeline.</p></div><span>POST /monitor</span></div>
          <div className="record-fields">
            <label>API name<input required value={recordForm.api_name} onChange={(event) => setRecordForm({ ...recordForm, api_name: event.target.value })} placeholder="AppointmentAPI" /></label>
            <label>Response time (ms)<input required type="number" min="0" step="any" value={recordForm.response_time_ms} onChange={(event) => setRecordForm({ ...recordForm, response_time_ms: Number(event.target.value) })} /></label>
            <label>Status code<input required type="number" min="100" max="599" step="1" value={recordForm.status_code} onChange={(event) => setRecordForm({ ...recordForm, status_code: Number(event.target.value) })} /></label>
            <label>Records returned<input required type="number" min="0" step="1" value={recordForm.records_returned} onChange={(event) => setRecordForm({ ...recordForm, records_returned: Number(event.target.value) })} /></label>
            <button className="submit-record" type="submit" disabled={uploading}><Activity size={16} /> {uploading ? "Processing..." : "Submit observation"}</button>
          </div>
        </form>

        <section className="stat-grid">
          <StatCard icon={<ShieldAlert />} label="Active alerts" value={total} tone="purple" detail="Needs attention" />
          <StatCard icon={<AlertCircle />} label="Critical" value={criticalCount} tone="red" detail="On this page" />
          <StatCard icon={<Clock3 />} label="Warnings" value={warningCount} tone="amber" detail="On this page" />
          <StatCard icon={<Server />} label="APIs affected" value={apiCount} tone="blue" detail="On this page" />
        </section>

        <section className="content-card">
          <div className="section-heading"><div><h2>Active anomalies</h2><p>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Fetching latest monitoring data"}</p></div><div className="live-pill"><span /> Live</div></div>
          <div className="filters"><label>Severity<select value={severity} onChange={(event) => updateFilter(setSeverity, event.target.value)}><option value="">All severities</option><option value="CRITICAL">Critical</option><option value="WARNING">Warning</option></select></label><label>Status<select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)}><option value="ACTIVE">Active</option><option value="RESOLVED">Resolved</option><option value="">All statuses</option></select></label><label className="api-filter">API name<input value={apiName} onChange={(event) => updateFilter(setApiName, event.target.value)} placeholder="Search API..." /></label></div>

          {loading ? <div className="empty-state"><RefreshCw className="spin" size={25} /><p>Loading alert stream...</p></div> : error ? <div className="empty-state error-state"><AlertCircle size={25} /><p>{error}</p><button onClick={loadAlerts}>Try again</button></div> : alerts.length === 0 ? <div className="empty-state"><CheckCircle2 size={30} /><p>No alerts match these filters.</p><span>Everything looks clear for this view.</span></div> : <div className="alert-list">{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>}

          <div className="pagination"><span>Showing {alerts.length} of {total} alerts</span><div><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17} /></button><b>Page {page} of {totalPages}</b><button aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}><ChevronRight size={17} /></button></div></div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, tone, detail }: { icon: React.ReactNode; label: string; value: number; tone: string; detail: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><ArrowUpRight className="stat-arrow" size={16} /></div>;
}

function AlertCard({ alert }: { alert: Alert }) {
  return <article className={`alert-card ${alert.severity.toLowerCase()}`}><div className="alert-accent" /><div className="alert-main"><div className="alert-topline"><div className="alert-title"><span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span><h3>{alert.ai_title || `${alert.api_name} alert`}</h3></div><time>{formatTime(alert.created_at)}</time></div><div className="alert-meta"><span className="api-chip"><Server size={14} />{alert.api_name}</span><span>{alert.anomaly_type.replaceAll("_", " ")}</span><span>HTTP {alert.status_code}</span><span>{alert.response_time_ms} ms</span></div><p className="alert-message">{alert.message}</p>{alert.ai_explanation && <div className="ai-insight"><Sparkles size={16} /><div><strong>AI insight</strong><p>{alert.ai_explanation}</p>{alert.ai_recommendation && <small>Recommendation: {alert.ai_recommendation}</small>}</div></div>}</div></article>;
}

export default App;
