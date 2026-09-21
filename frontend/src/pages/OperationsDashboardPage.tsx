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
    submittedAt: "08:42 hôm nay",
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
    submittedAt: "09:15 hôm nay",
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
    submittedAt: "09:48 hôm nay",
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
    submittedAt: "10:12 hôm nay",
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
        eyebrow="KHÔNG GIAN QUẢN TRỊ"
        title="Tổng quan SoundWave"
        description="Theo dõi sức khỏe nền tảng, người dùng và chất lượng nội dung trong một màn hình."
        icon={<ShieldIcon width={15} height={15} />}
      >
        <span className="ops-live-status"><i /> Hệ thống ổn định</span>
        <label className="ops-range-select">
          <span>Khoảng thời gian</span>
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Khoảng thời gian thống kê">
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
          </select>
        </label>
      </DashboardHeading>

      <section className="ops-metric-grid" aria-label="Chỉ số hệ thống">
        <DashboardMetric icon={<UsersIcon />} label="Tổng người dùng" value="12.480" change="8,2%" note="+946 trong kỳ này" />
        <DashboardMetric icon={<DiscIcon />} label="Bài hát công khai" value="8.942" change="5,6%" note="312 bài mới được duyệt" tone="violet" />
        <DashboardMetric icon={<ActivityIcon />} label="Lượt nghe hôm nay" value="284K" change="12,4%" note="Đỉnh lúc 21:00" tone="green" />
        <DashboardMetric icon={<FlagIcon />} label="Báo cáo đang mở" value="27" change="3 mới" note="5 báo cáo cần ưu tiên" tone="amber" />
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--hero">
        <article className="ops-panel ops-panel--chart">
          <PanelHeading
            title="Tăng trưởng người dùng"
            description={range === "7d" ? "Người dùng mới trong 7 ngày gần nhất" : `Xu hướng trong ${range === "30d" ? "30" : "90"} ngày gần nhất`}
            action={<span className="ops-panel-total"><b>+1.248</b> tài khoản mới</span>}
          />
          <div className="ops-growth-chart" aria-label="Biểu đồ tăng trưởng người dùng">
            <div className="ops-chart-scale"><span>300</span><span>200</span><span>100</span><span>0</span></div>
            <div className="ops-bars">
              {growthBars.map((height, index) => (
                <div className="ops-bar-column" key={`${height}-${index}`}>
                  <div className="ops-bar-track"><i style={{ height: `${height}%` }} /></div>
                  <span>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ops-chart-summary">
            <span><i className="is-primary" />Người nghe <b>78%</b></span>
            <span><i className="is-accent" />Nhà sáng tạo <b>22%</b></span>
            <span className="ops-chart-insight"><TrendingUpIcon width={14} height={14} /> Cao hơn 14% so với tuần trước</span>
          </div>
        </article>

        <aside className="ops-panel ops-health-panel">
          <PanelHeading title="Sức khỏe hệ thống" description="Cập nhật vài giây trước" />
          <div className="ops-health-score">
            <div className="ops-score-ring"><span><b>99,98%</b><small>uptime</small></span></div>
            <p>Mọi dịch vụ đang vận hành bình thường.</p>
          </div>
          <div className="ops-health-list">
            <div><span><i className="is-ok" />REST API</span><b>84 ms</b></div>
            <div><span><i className="is-ok" />SQL Server</span><b>31 ms</b></div>
            <div><span><i className="is-ok" />Cloudinary</span><b>126 ms</b></div>
            <div><span><i className="is-ok" />Email Service</span><b>Hoạt động</b></div>
          </div>
        </aside>
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--lower">
        <article className="ops-panel ops-recent-users">
          <PanelHeading
            title="Tài khoản mới gần đây"
            description="Các tài khoản vừa hoàn tất xác thực"
            action={<button className="ops-text-button" onClick={() => onNavigate("/admin/dashboard")}>Xem tất cả <span>→</span></button>}
          />
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Tham gia</th></tr></thead>
              <tbody>
                {[
                  ["Nguyễn Hải", "hai.nguyen@example.com", "Người nghe", "Đã xác thực", "5 phút trước", "NH"],
                  ["Mộc Miên", "mocmien.music@example.com", "Nhà sáng tạo", "Đã xác thực", "24 phút trước", "MM"],
                  ["Trần Khải", "khai.tran@example.com", "Người nghe", "Chờ xác thực", "1 giờ trước", "TK"],
                  ["An Nhiên", "annhien@example.com", "Nhà sáng tạo", "Đã xác thực", "2 giờ trước", "AN"],
                ].map(([name, email, role, status, time, initials]) => (
                  <tr key={email}>
                    <td><div className="ops-user-cell"><span>{initials}</span><div><b>{name}</b><small>{email}</small></div></div></td>
                    <td><span className="ops-role-chip">{role}</span></td>
                    <td><span className={`ops-status ${status === "Đã xác thực" ? "is-success" : "is-warning"}`}><i />{status}</span></td>
                    <td>{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="ops-panel ops-activity-feed">
          <PanelHeading title="Hoạt động quản trị" description="Các thay đổi quan trọng gần đây" />
          <div className="ops-timeline">
            <div><span className="is-cyan"><UserIcon width={14} height={14} /></span><p><b>Admin Lê An</b> đã cấp vai trò Staff cho Thu Hà.<small>12 phút trước</small></p></div>
            <div><span className="is-violet"><DiscIcon width={14} height={14} /></span><p><b>Thể loại “City Pop”</b> vừa được tạo mới.<small>46 phút trước</small></p></div>
            <div><span className="is-amber"><FlagIcon width={14} height={14} /></span><p><b>5 báo cáo</b> đã được chuyển sang mức ưu tiên.<small>1 giờ trước</small></p></div>
            <div><span className="is-green"><CheckIcon width={14} height={14} /></span><p>Hoàn tất tác vụ sao lưu dữ liệu hàng ngày.<small>3 giờ trước</small></p></div>
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
    notify(status === "APPROVED" ? `Đã duyệt “${submission.title}”.` : `Đã từ chối “${submission.title}”.`);
  };

  const reports = [
    { id: 701, category: "Bản quyền", title: "Thành Phố Sau Mưa", reporter: "Ngọc Anh", age: "18 phút", priority: "Cao" },
    { id: 702, category: "Nội dung không phù hợp", title: "Đêm Trôi Rất Khẽ", reporter: "Minh Tú", age: "52 phút", priority: "Bình thường" },
    { id: 703, category: "Sai thông tin", title: "Gọi Nắng Về", reporter: "Thu Trang", age: "1 giờ", priority: "Bình thường" },
  ].filter((report) => !resolvedReports.includes(report.id));

  return (
    <div className="ops-dashboard ops-dashboard--staff">
      <DashboardHeading
        eyebrow="TRUNG TÂM KIỂM DUYỆT"
        title="Chào buổi sáng, Staff"
        description="Ưu tiên nội dung chờ lâu, xử lý báo cáo chính xác và giữ trải nghiệm SoundWave an toàn."
        icon={<DashboardIcon width={15} height={15} />}
      >
        <span className="ops-shift-chip"><ClockIcon width={15} height={15} /> Ca sáng · 08:00–16:00</span>
        <button className="button button-primary button-small" onClick={() => document.getElementById("review-queue")?.scrollIntoView({ behavior: "smooth" })}>
          Bắt đầu kiểm duyệt
        </button>
      </DashboardHeading>

      <section className="ops-metric-grid" aria-label="Chỉ số kiểm duyệt">
        <DashboardMetric icon={<ClockIcon />} label="Bài hát chờ duyệt" value={String(pendingSubmissions.length + 14)} change="4 mới" note="Cũ nhất đã chờ 2 giờ 18 phút" tone="amber" />
        <DashboardMetric icon={<CheckIcon />} label="Đã duyệt hôm nay" value="24" change="16,7%" note="Trung bình 6 phút / hồ sơ" tone="green" />
        <DashboardMetric icon={<FlagIcon />} label="Báo cáo đang mở" value={String(reports.length + 9)} change="3 ưu tiên" note="Mục tiêu xử lý dưới 4 giờ" tone="red" />
        <DashboardMetric icon={<ChartIcon />} label="Đúng SLA tuần này" value="92%" change="3,4%" note="Mục tiêu của nhóm là 90%" tone="violet" />
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--staff-main">
        <article className="ops-panel ops-review-panel" id="review-queue">
          <PanelHeading
            title="Hàng chờ kiểm duyệt"
            description="Được sắp xếp theo mức ưu tiên và thời gian chờ"
            action={<span className="ops-queue-count">{pendingSubmissions.length} hồ sơ đang chờ</span>}
          />
          <div className="ops-filter-row" role="group" aria-label="Lọc hàng chờ">
            <button className={filter === "ALL" ? "is-active" : ""} onClick={() => setFilter("ALL")}>Tất cả</button>
            <button className={filter === "HIGH" ? "is-active" : ""} onClick={() => setFilter("HIGH")}>Ưu tiên cao</button>
            <button className={filter === "REVIEWING" ? "is-active" : ""} onClick={() => setFilter("REVIEWING")}>Đang xem</button>
          </div>
          <div className="ops-review-list">
            {visibleSubmissions.length ? visibleSubmissions.map((submission) => (
              <article className={`ops-review-row ${submission.priority === "HIGH" ? "is-priority" : ""}`} key={submission.id}>
                <img src={submission.coverUrl ?? "/soundwave-logo.png"} alt="" />
                <div className="ops-review-copy">
                  <div className="ops-review-title-line">
                    <strong>{submission.title}</strong>
                    {submission.priority === "HIGH" ? <span className="ops-priority-tag"><AlertIcon width={12} height={12} />Ưu tiên</span> : null}
                  </div>
                  <p>{submission.artist} <i /> {submission.genre}</p>
                  <small><ClockIcon width={12} height={12} /> Nộp lúc {submission.submittedAt} · chờ {submission.ageMinutes} phút</small>
                </div>
                <div className="ops-review-state">
                  <span className={`ops-status ${submission.status === "REVIEWING" ? "is-info" : "is-warning"}`}><i />{submission.status === "REVIEWING" ? "Đang xem" : "Chờ duyệt"}</span>
                </div>
                <div className="ops-review-actions">
                  <button className="ops-icon-action" aria-label={`Xem chi tiết ${submission.title}`} onClick={() => onNavigate(`/track/${Math.min(submission.id - 400, 8)}`)}><EyeIcon width={17} height={17} /></button>
                  <button className="ops-decision ops-decision--approve" onClick={() => updateSubmission(submission, "APPROVED")}><CheckIcon width={15} height={15} />Duyệt</button>
                  <button className="ops-decision ops-decision--reject" onClick={() => { setRejectionTarget(submission); setRejectionReason(""); }}><CloseIcon width={15} height={15} />Từ chối</button>
                </div>
              </article>
            )) : <div className="ops-empty-state"><CheckIcon width={28} height={28} /><b>Không có hồ sơ phù hợp</b><span>Hãy thử chọn bộ lọc khác.</span></div>}
          </div>
        </article>

        <aside className="ops-panel ops-shift-panel">
          <PanelHeading title="Tiến độ ca làm" description="Cập nhật theo hoạt động của bạn" />
          <div className="ops-shift-ring"><span><b>24</b><small>/ 30 mục tiêu</small></span></div>
          <div className="ops-shift-progress"><i style={{ width: "80%" }} /></div>
          <div className="ops-shift-stats">
            <div><span>Đã duyệt</span><b>19</b></div>
            <div><span>Đã từ chối</span><b>5</b></div>
            <div><span>Thời gian TB</span><b>6 phút</b></div>
          </div>
          <div className="ops-guideline-note"><ShieldIcon width={18} height={18} /><p><b>Nhắc nhanh</b><span>Kiểm tra chất lượng âm thanh, metadata và quyền sử dụng trước khi đưa ra quyết định.</span></p></div>
        </aside>
      </section>

      <section className="ops-dashboard-grid ops-dashboard-grid--lower">
        <article className="ops-panel ops-report-panel">
          <PanelHeading title="Báo cáo nội dung cần xử lý" description="Ưu tiên theo mức độ ảnh hưởng đến cộng đồng" action={<button className="ops-text-button">Mở trung tâm báo cáo <span>→</span></button>} />
          <div className="ops-report-list">
            {reports.map((report) => (
              <div className="ops-report-row" key={report.id}>
                <span className={report.priority === "Cao" ? "is-high" : ""}><FlagIcon width={17} height={17} /></span>
                <div><strong>{report.category}</strong><p>{report.title} · Báo cáo bởi {report.reporter}</p></div>
                <small>{report.age}</small>
                <button onClick={() => { setResolvedReports((current) => [...current, report.id]); notify(`Đã đánh dấu báo cáo #${report.id} hoàn tất.`); }}>Xử lý</button>
              </div>
            ))}
            {!reports.length ? <div className="ops-empty-inline"><CheckIcon width={17} height={17} /> Đã xử lý hết báo cáo trong danh sách.</div> : null}
          </div>
        </article>

        <aside className="ops-panel ops-weekly-panel">
          <PanelHeading title="Hiệu suất 7 ngày" description="Số nội dung đã xử lý" />
          <div className="ops-mini-chart">
            {[48, 66, 54, 83, 72, 91, 80].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}</span></div>)}
          </div>
          <div className="ops-weekly-total"><span>Tổng tuần này</span><b>164 nội dung</b><small><TrendingUpIcon width={13} height={13} /> 11% so với tuần trước</small></div>
        </aside>
      </section>

      {rejectionTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setRejectionTarget(null)}>
          <div className="modal-card ops-reject-dialog" role="dialog" aria-modal="true" aria-labelledby="reject-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="ops-dialog-icon"><AlertIcon /></span><h2 id="reject-title">Từ chối bài hát</h2></div><button className="icon-button" onClick={() => setRejectionTarget(null)} aria-label="Đóng"><CloseIcon width={18} height={18} /></button></div>
            <p>Bạn đang từ chối <b>“{rejectionTarget.title}”</b> của {rejectionTarget.artist}. Lý do sẽ được gửi đến người đăng tải.</p>
            <label className="ops-reason-field"><span>Lý do từ chối</span><textarea autoFocus value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Mô tả ngắn gọn vấn đề cần chỉnh sửa..." /></label>
            <div className="modal-actions"><button className="button button-ghost" onClick={() => setRejectionTarget(null)}>Hủy</button><button className="button ops-danger-button" disabled={rejectionReason.trim().length < 10} onClick={() => { updateSubmission(rejectionTarget, "REJECTED"); setRejectionTarget(null); }}>Xác nhận từ chối</button></div>
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
      <small>403 · KHU VỰC GIỚI HẠN</small>
      <h1>Bạn không có quyền truy cập</h1>
      <p>Dashboard này chỉ dành cho tài khoản được phân quyền phù hợp. Hãy đăng nhập bằng tài khoản Staff hoặc Admin.</p>
      <div><button className="button button-primary" onClick={() => onNavigate("/login")}>Đăng nhập tài khoản khác</button><button className="button button-secondary" onClick={() => onNavigate("/")}>Về trang khám phá</button></div>
    </div>
  );
}
