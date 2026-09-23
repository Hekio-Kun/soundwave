import { useMemo, useState, type ReactNode } from "react";
import { tracks } from "../data";
import {
  ActivityIcon,
  AlertIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  DashboardIcon,
  DiscIcon,
  EyeIcon,
  FlagIcon,
  ShieldIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from "../icons";

type DashboardProps = {
  onNavigate: (route: string) => void;
};

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  change: string;
  note: string;
  tone?: "cyan" | "violet" | "green" | "amber" | "red";
};

type ReviewStatus = "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";

type ReviewSubmission = {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  genre: string;
  submittedAt: string;
  ageMinutes: number;
  priority: "NORMAL" | "HIGH";
  status: ReviewStatus;
};

const initialSubmissions: ReviewSubmission[] = [
  {
    id: 401,
    title: "Chạm Vào Khoảng Không",
    artist: "Yên Chi",
    coverUrl: tracks[6].coverUrl,
    genre: "R&B",
    submittedAt: "08:42 today",
    ageMinutes: 138,
    priority: "HIGH",
    status: "PENDING",
  },
  {
    id: 402,
    title: "Gọi Nắng Về",
    artist: "Kai Vũ",
    coverUrl: tracks[7].coverUrl,
    genre: "Rap / Hip-hop",
    submittedAt: "09:15 today",
    ageMinutes: 105,
    priority: "NORMAL",
    status: "REVIEWING",
  },
  {
    id: 403,
    title: "Một Khoảng Bình Yên",
    artist: "Minh An",
    coverUrl: tracks[5].coverUrl,
    genre: "Acoustic",
    submittedAt: "09:48 today",
    ageMinutes: 72,
    priority: "NORMAL",
    status: "PENDING",
  },
  {
    id: 404,
    title: "Đêm Trôi Rất Khẽ",
    artist: "Lâm Mộc",
    coverUrl: tracks[4].coverUrl,
    genre: "Ballad",
    submittedAt: "10:12 today",
    ageMinutes: 48,
    priority: "NORMAL",
    status: "PENDING",
  },
];

function DashboardMetric({ icon, label, value, change, note, tone = "cyan" }: MetricProps) {
  return (
    <article className={`ops-metric ops-metric--${tone}`}>
      <div className="ops-metric-top">
        <span className="ops-metric-icon">{icon}</span>
        <span className="ops-metric-change"><TrendingUpIcon width={13} height={13} />{change}</span>
      </div>
      <strong>{value}</strong>
      <span className="ops-metric-label">{label}</span>
      <small>{note}</small>
    </article>
  );
}

function DashboardHeading({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="ops-dashboard-heading">
      <div className="ops-dashboard-heading-copy">
        <span className="ops-role-mark">{icon}{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children ? <div className="ops-heading-actions">{children}</div> : null}
    </header>
  );
}

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ops-panel-heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminDashboardPage({ onNavigate }: DashboardProps) {
  const [range, setRange] = useState("7d");
  const growthBars = [38, 51, 46, 64, 58, 76, 88];

  return (
    <div className="ops-dashboard ops-dashboard--admin">
      <DashboardHeading
        eyebrow="ADMINISTRATION"
        title="System Statistics Dashboard"
        description="Monitor platform health, users, and content quality in one place."
        icon={<ShieldIcon width={15} height={15} />}
      >
        <span className="ops-live-status"><i /> System stable</span>
        <label className="ops-range-select">
          <span>Date range</span>
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Date range">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </label>
      </DashboardHeading>

      <section className="ops-metric-grid" aria-label="System statistics">
        <DashboardMetric icon={<UsersIcon />} label="Total users" value="12,480" change="8.2%" note="+946 in this period" />
        <DashboardMetric icon={<DiscIcon />} label="Published tracks" value="8,942" change="5.6%" note="312 newly approved tracks" tone="violet" />
        <DashboardMetric icon={<ActivityIcon />} label="Total plays" value="284K" change="12.4%" note="Today's peak was at 21:00" tone="green" />
        <DashboardMetric icon={<FlagIcon />} label="Pending reports" value="27" change="3 new" note="5 reports need priority review" tone="amber" />
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--hero">
        <article className="ops-panel ops-panel--chart">
          <PanelHeading
            title="User growth"
            description={range === "7d" ? "New users in the last 7 days" : `Trend over the last ${range === "30d" ? "30" : "90"} days`}
            action={<span className="ops-panel-total"><b>+1,248</b> new accounts</span>}
          />
          <div className="ops-growth-chart" aria-label="User growth chart">
            <div className="ops-chart-scale"><span>300</span><span>200</span><span>100</span><span>0</span></div>
            <div className="ops-bars">
              {growthBars.map((height, index) => (
                <div className="ops-bar-column" key={`${height}-${index}`}>
                  <div className="ops-bar-track"><i style={{ height: `${height}%` }} /></div>
                  <span>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ops-chart-summary">
            <span><i className="is-primary" />Listeners <b>78%</b></span>
            <span><i className="is-accent" />Creators <b>22%</b></span>
            <span className="ops-chart-insight"><TrendingUpIcon width={14} height={14} /> 14% higher than last week</span>
          </div>
        </article>

        <aside className="ops-panel ops-health-panel">
          <PanelHeading title="System health" description="Updated a few seconds ago" />
          <div className="ops-health-score">
            <div className="ops-score-ring"><span><b>99.98%</b><small>uptime</small></span></div>
            <p>All services are operating normally.</p>
          </div>
          <div className="ops-health-list">
            <div><span><i className="is-ok" />REST API</span><b>84 ms</b></div>
            <div><span><i className="is-ok" />SQL Server</span><b>31 ms</b></div>
            <div><span><i className="is-ok" />Cloudinary</span><b>126 ms</b></div>
            <div><span><i className="is-ok" />Email Service</span><b>Operational</b></div>
          </div>
        </aside>
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--lower">
        <article className="ops-panel ops-recent-users">
          <PanelHeading
            title="Recent accounts"
            description="Accounts that recently completed verification"
            action={<button className="ops-text-button" onClick={() => onNavigate("/admin/dashboard")}>View all <span>→</span></button>}
          />
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {[
                  ["Nguyễn Hải", "hai.nguyen@example.com", "Listener", "Verified", "5 minutes ago", "NH"],
                  ["Mộc Miên", "mocmien.music@example.com", "Creator", "Verified", "24 minutes ago", "MM"],
                  ["Trần Khải", "khai.tran@example.com", "Listener", "Pending verification", "1 hour ago", "TK"],
                  ["An Nhiên", "annhien@example.com", "Creator", "Verified", "2 hours ago", "AN"],
                ].map(([name, email, role, status, time, initials]) => (
                  <tr key={email}>
                    <td><div className="ops-user-cell"><span>{initials}</span><div><b>{name}</b><small>{email}</small></div></div></td>
                    <td><span className="ops-role-chip">{role}</span></td>
                    <td><span className={`ops-status ${status === "Verified" ? "is-success" : "is-warning"}`}><i />{status}</span></td>
                    <td>{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="ops-panel ops-activity-feed">
          <PanelHeading title="Administration activity" description="Recent important changes" />
          <div className="ops-timeline">
            <div><span className="is-cyan"><UserIcon width={14} height={14} /></span><p><b>Admin Lê An</b> assigned the Staff role to Thu Hà.<small>12 minutes ago</small></p></div>
            <div><span className="is-violet"><DiscIcon width={14} height={14} /></span><p><b>Genre “City Pop”</b> was created.<small>46 minutes ago</small></p></div>
            <div><span className="is-amber"><FlagIcon width={14} height={14} /></span><p><b>5 reports</b> were marked as priority.<small>1 hour ago</small></p></div>
            <div><span className="is-green"><CheckIcon width={14} height={14} /></span><p>Daily data backup completed.<small>3 hours ago</small></p></div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export function StaffDashboardPage({ onNavigate }: DashboardProps) {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>(initialSubmissions);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "REVIEWING">("ALL");
  const [rejectionTarget, setRejectionTarget] = useState<ReviewSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState("");
  const [resolvedReports, setResolvedReports] = useState<number[]>([]);

  const pendingSubmissions = useMemo(
    () => submissions.filter((item) => item.status === "PENDING" || item.status === "REVIEWING"),
    [submissions],
  );

  const visibleSubmissions = pendingSubmissions.filter((item) => {
    if (filter === "HIGH") return item.priority === "HIGH";
    if (filter === "REVIEWING") return item.status === "REVIEWING";
    return true;
  });

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const updateSubmission = (submission: ReviewSubmission, status: ReviewStatus) => {
    setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status } : item));
    notify(status === "APPROVED" ? `Approved “${submission.title}”.` : `Rejected “${submission.title}”.`);
  };

  const reports = [
    { id: 701, category: "Copyright", title: "Thành Phố Sau Mưa", reporter: "Ngọc Anh", age: "18 minutes", priority: "High" },
    { id: 702, category: "Inappropriate content", title: "Đêm Trôi Rất Khẽ", reporter: "Minh Tú", age: "52 minutes", priority: "Normal" },
    { id: 703, category: "Incorrect information", title: "Gọi Nắng Về", reporter: "Thu Trang", age: "1 hour", priority: "Normal" },
  ].filter((report) => !resolvedReports.includes(report.id));

  return (
    <div className="ops-dashboard ops-dashboard--staff">
      <DashboardHeading
        eyebrow="CONTENT MODERATION"
        title="Good morning, Staff"
        description="Prioritize older submissions, assess reports accurately, and keep SoundWave safe."
        icon={<DashboardIcon width={15} height={15} />}
      >
        <span className="ops-shift-chip"><ClockIcon width={15} height={15} /> Morning shift · 08:00–16:00</span>
        <button className="button button-primary button-small" onClick={() => document.getElementById("review-queue")?.scrollIntoView({ behavior: "smooth" })}>
          Start review
        </button>
      </DashboardHeading>

      <section className="ops-metric-grid" aria-label="Moderation statistics">
        <DashboardMetric icon={<ClockIcon />} label="Pending reviews" value={String(pendingSubmissions.length + 14)} change="4 new" note="Oldest waiting time: 2 hours 18 minutes" tone="amber" />
        <DashboardMetric icon={<CheckIcon />} label="Approved today" value="24" change="16.7%" note="Average: 6 minutes per submission" tone="green" />
        <DashboardMetric icon={<FlagIcon />} label="Pending reports" value={String(reports.length + 9)} change="3 priority" note="Resolution target: under 4 hours" tone="red" />
        <DashboardMetric icon={<ChartIcon />} label="Weekly SLA" value="92%" change="3.4%" note="Team target: 90%" tone="violet" />
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--staff-main">
        <article className="ops-panel ops-review-panel" id="review-queue">
          <PanelHeading
            title="Pending Track List"
            description="Sorted by priority and waiting time"
            action={<span className="ops-queue-count">{pendingSubmissions.length} pending submissions</span>}
          />
          <div className="ops-filter-row" role="group" aria-label="Filter submissions">
            <button className={filter === "ALL" ? "is-active" : ""} onClick={() => setFilter("ALL")}>All</button>
            <button className={filter === "HIGH" ? "is-active" : ""} onClick={() => setFilter("HIGH")}>High priority</button>
            <button className={filter === "REVIEWING" ? "is-active" : ""} onClick={() => setFilter("REVIEWING")}>Reviewing</button>
          </div>
          <div className="ops-review-list">
            {visibleSubmissions.length ? visibleSubmissions.map((submission) => (
              <article className={`ops-review-row ${submission.priority === "HIGH" ? "is-priority" : ""}`} key={submission.id}>
                <img src={submission.coverUrl ?? "/soundwave-logo.png"} alt="" />
                <div className="ops-review-copy">
                  <div className="ops-review-title-line">
                    <strong>{submission.title}</strong>
                    {submission.priority === "HIGH" ? <span className="ops-priority-tag"><AlertIcon width={12} height={12} />Priority</span> : null}
                  </div>
                  <p>{submission.artist} <i /> {submission.genre}</p>
                  <small><ClockIcon width={12} height={12} /> Submitted at {submission.submittedAt} · waiting {submission.ageMinutes} minutes</small>
                </div>
                <div className="ops-review-state">
                  <span className={`ops-status ${submission.status === "REVIEWING" ? "is-info" : "is-warning"}`}><i />{submission.status === "REVIEWING" ? "Reviewing" : "Pending"}</span>
                </div>
                <div className="ops-review-actions">
                  <button className="ops-icon-action" aria-label={`Open review for ${submission.title}`} onClick={() => onNavigate(`/track/${Math.min(submission.id - 400, 8)}`)}><EyeIcon width={17} height={17} /></button>
                  <button className="ops-decision ops-decision--approve" onClick={() => updateSubmission(submission, "APPROVED")}><CheckIcon width={15} height={15} />Approve</button>
                  <button className="ops-decision ops-decision--reject" onClick={() => { setRejectionTarget(submission); setRejectionReason(""); }}><CloseIcon width={15} height={15} />Reject</button>
                </div>
              </article>
            )) : <div className="ops-empty-state"><CheckIcon width={28} height={28} /><b>No matching submissions</b><span>Try another filter.</span></div>}
          </div>
        </article>

        <aside className="ops-panel ops-shift-panel">
          <PanelHeading title="Shift progress" description="Updated from your activity" />
          <div className="ops-shift-ring"><span><b>24</b><small>/ 30 target</small></span></div>
          <div className="ops-shift-progress"><i style={{ width: "80%" }} /></div>
          <div className="ops-shift-stats">
            <div><span>Approved</span><b>19</b></div>
            <div><span>Rejected</span><b>5</b></div>
            <div><span>Average time</span><b>6 minutes</b></div>
          </div>
          <div className="ops-guideline-note"><ShieldIcon width={18} height={18} /><p><b>Quick reminder</b><span>Check audio quality, metadata, and usage rights before making a decision.</span></p></div>
        </aside>
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--lower">
        <article className="ops-panel ops-report-panel">
          <PanelHeading title="Content Report List" description="Prioritized by community impact" action={<button className="ops-text-button">Open report center <span>→</span></button>} />
          <div className="ops-report-list">
            {reports.map((report) => (
              <div className="ops-report-row" key={report.id}>
                <span className={report.priority === "High" ? "is-high" : ""}><FlagIcon width={17} height={17} /></span>
                <div><strong>{report.category}</strong><p>{report.title} · Reported by {report.reporter}</p></div>
                <small>{report.age}</small>
                <button onClick={() => { setResolvedReports((current) => [...current, report.id]); notify(`Report #${report.id} was marked complete.`); }}>Resolve</button>
              </div>
            ))}
            {!reports.length ? <div className="ops-empty-inline"><CheckIcon width={17} height={17} /> All reports in this list are resolved.</div> : null}
          </div>
        </article>

        <aside className="ops-panel ops-weekly-panel">
          <PanelHeading title="7-day performance" description="Resolved content" />
          <div className="ops-mini-chart">
            {[48, 66, 54, 83, 72, 91, 80].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span></div>)}
          </div>
          <div className="ops-weekly-total"><span>This week</span><b>164 items</b><small><TrendingUpIcon width={13} height={13} /> 11% higher than last week</small></div>
        </aside>
      </section>

      {rejectionTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setRejectionTarget(null)}>
          <div className="modal-card ops-reject-dialog" role="dialog" aria-modal="true" aria-labelledby="reject-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="ops-dialog-icon"><AlertIcon /></span><h2 id="reject-title">Reject Track</h2></div><button className="icon-button" onClick={() => setRejectionTarget(null)} aria-label="Close"><CloseIcon width={18} height={18} /></button></div>
            <p>You are rejecting <b>“{rejectionTarget.title}”</b> by {rejectionTarget.artist}. The Rejection reason will be sent to the uploader.</p>
            <label className="ops-reason-field"><span>Rejection reason</span><textarea autoFocus value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Briefly describe what needs to be corrected..." /></label>
            <div className="modal-actions"><button className="button button-ghost" onClick={() => setRejectionTarget(null)}>Cancel</button><button className="button ops-danger-button" disabled={rejectionReason.trim().length < 10} onClick={() => { updateSubmission(rejectionTarget, "REJECTED"); setRejectionTarget(null); }}>Confirm</button></div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="ops-toast" role="status"><CheckIcon width={17} height={17} />{toast}</div> : null}
    </div>
  );
}

export function DashboardAccessDenied({ onNavigate }: DashboardProps) {
  return (
    <div className="ops-access-denied">
      <span><ShieldIcon width={32} height={32} /></span>
      <small>403 · RESTRICTED AREA</small>
      <h1>Access denied</h1>
      <p>This dashboard is available only to accounts with the required role. Log in with a Staff or Admin account.</p>
      <div><button className="button button-primary" onClick={() => onNavigate("/login")}>Login with another account</button><button className="button button-secondary" onClick={() => onNavigate("/")}>Back to Explore</button></div>
    </div>
  );
}
