import { useState, type FormEvent, type ReactNode } from "react";
import { CheckIcon, HeadphonesIcon, PlayIcon } from "../icons";

type AuthProps = {
  onLoginSuccess: (role: "USER" | "STAFF" | "ADMIN") => void;
  onNavigate: (route: string) => void;
};

function AuthExperience({ children, eyebrow, title, description }: { children: ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <main className="auth-experience">
      <section className="auth-story" aria-label="Giới thiệu SoundWave">
        <div className="auth-story-orbit auth-story-orbit--one" />
        <div className="auth-story-orbit auth-story-orbit--two" />
        <div className="auth-story-content">
          <span className="auth-story-tag"><HeadphonesIcon width={15} height={15} /> KHÔNG GIAN ÂM NHẠC VIỆT</span>
          <h2>Nghe điều bạn thích.<br /><span>Chia sẻ điều bạn tạo.</span></h2>
          <p>Khám phá âm nhạc từ cộng đồng creator độc lập, xây dựng thư viện và mang những sáng tác của bạn đến gần hơn với người nghe.</p>
          <div className="auth-story-player">
            <span className="auth-story-cover"><i /><i /><i /></span>
            <span><small>ĐANG PHÁT TRÊN SOUNDWAVE</small><strong>Sớm Mai Dịu Dàng</strong><em>Minh An</em></span>
            <b><PlayIcon width={17} height={17} /></b>
          </div>
          <div className="auth-story-stats"><span><b>24K+</b><small>bài hát</small></span><span><b>1.2K+</b><small>creator</small></span><span><b>Miễn phí</b><small>để bắt đầu</small></span></div>
        </div>
      </section>
      <section className="auth-workspace">
        <div className="auth-panel">
          <div className="auth-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
          {children}
        </div>
      </section>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, placeholder = "••••••••", action }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; action?: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      {action ? <div className="form-label-row"><label htmlFor={id}>{label}</label>{action}</div> : <label htmlFor={id}>{label}</label>}
      <div className="auth-input-wrap">
        <input id={id} type={visible ? "text" : "password"} required minLength={8} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        <button type="button" onClick={() => setVisible((current) => !current)}>{visible ? "Ẩn" : "Hiện"}</button>
      </div>
    </div>
  );
}

export function LoginPage({ onLoginSuccess, onNavigate }: AuthProps) {
  const [email, setEmail] = useState("lean@soundwave.vn");
  const [password, setPassword] = useState("12345678");
  const [role, setRole] = useState<"USER" | "STAFF" | "ADMIN">("USER");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onLoginSuccess(role);
  };

  return (
    <AuthExperience eyebrow="CHÀO MỪNG TRỞ LẠI" title="Đăng nhập SoundWave" description="Tiếp tục hành trình âm nhạc của riêng bạn.">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group"><label htmlFor="login-email">Email</label><input id="login-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" /></div>
        <PasswordField id="login-password" label="Mật khẩu" value={password} onChange={setPassword} action={<button type="button" className="forgot-pw-link" onClick={() => onNavigate("/forgot-password")}>Quên mật khẩu?</button>} />
        <label className="auth-check"><input type="checkbox" defaultChecked /><span>Ghi nhớ đăng nhập trên thiết bị này</span></label>
        <button type="submit" className="button button-primary button-large auth-submit-btn">Đăng nhập</button>
      </form>
      <div className="auth-divider"><span>Truy cập bản trình diễn</span></div>
      <div className="demo-role-grid">
        {(["USER", "STAFF", "ADMIN"] as const).map((item) => <button key={item} className={role === item ? "is-active" : ""} onClick={() => setRole(item)}><b>{item === "USER" ? "Người nghe" : item === "STAFF" ? "Kiểm duyệt" : "Quản trị"}</b><small>{item}</small></button>)}
      </div>
      <div className="auth-footer"><span>Chưa có tài khoản?</span><button className="text-link" onClick={() => onNavigate("/register")}>Đăng ký miễn phí</button></div>
    </AuthExperience>
  );
}

export function RegisterPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận chưa trùng khớp."); return; }
    setError("");
    setSubmitted(true);
  };

  return (
    <AuthExperience eyebrow="THAM GIA CỘNG ĐỒNG" title="Tạo tài khoản mới" description="Một tài khoản cho nghe nhạc, lưu playlist và đăng tải sáng tác.">
      {submitted ? <div className="auth-success-box"><span className="auth-success-icon"><CheckIcon width={30} height={30} /></span><h2>Kiểm tra hộp thư của bạn</h2><p>Liên kết xác thực đã được gửi đến <b>{email}</b>. Hãy xác thực email trước khi đăng nhập.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Đến trang đăng nhập</button></div> : <>
        <form onSubmit={handleSubmit} className="auth-form">
          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          <div className="form-group"><label htmlFor="reg-name">Tên hiển thị</label><input id="reg-name" type="text" required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ví dụ: Lê An" /></div>
          <div className="form-group"><label htmlFor="reg-email">Email</label><input id="reg-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" /></div>
          <div className="auth-field-grid"><PasswordField id="reg-password" label="Mật khẩu" value={password} onChange={setPassword} /><PasswordField id="reg-confirm" label="Xác nhận" value={confirmPassword} onChange={setConfirmPassword} /></div>
          <div className="auth-password-strength"><i className={password.length >= 4 ? "on" : ""} /><i className={password.length >= 8 ? "on" : ""} /><i className={password.length >= 12 ? "on" : ""} /><span>{password.length < 8 ? "Tối thiểu 8 ký tự" : password.length < 12 ? "Mật khẩu khá tốt" : "Mật khẩu mạnh"}</span></div>
          <label className="auth-check"><input type="checkbox" required /><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách cộng đồng của SoundWave.</span></label>
          <button type="submit" className="button button-primary button-large auth-submit-btn">Tạo tài khoản</button>
        </form>
        <div className="auth-footer"><span>Đã có tài khoản?</span><button className="text-link" onClick={() => onNavigate("/login")}>Đăng nhập</button></div>
      </>}
    </AuthExperience>
  );
}

export function ForgotPasswordPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <AuthExperience eyebrow="KHÔI PHỤC TÀI KHOẢN" title="Quên mật khẩu?" description="Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn cho bạn.">
      {submitted ? <div className="auth-success-box"><span className="auth-success-icon"><CheckIcon width={30} height={30} /></span><h2>Email đã được gửi</h2><p>Nếu <b>{email}</b> thuộc một tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Quay lại đăng nhập</button></div> : <form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div className="form-group"><label htmlFor="forgot-email">Email đã đăng ký</label><input id="forgot-email" type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" /></div><button className="button button-primary button-large auth-submit-btn">Gửi liên kết khôi phục</button><button type="button" className="auth-back-link" onClick={() => onNavigate("/login")}>← Quay lại đăng nhập</button></form>}
    </AuthExperience>
  );
}

export function ResetPasswordPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận chưa trùng khớp."); return; }
    setError(""); setSubmitted(true);
  };

  return (
    <AuthExperience eyebrow="BẢO MẬT TÀI KHOẢN" title="Tạo mật khẩu mới" description="Chọn mật khẩu khác với những mật khẩu bạn đã dùng trước đây.">
      {submitted ? <div className="auth-success-box"><span className="auth-success-icon"><CheckIcon width={30} height={30} /></span><h2>Đã cập nhật mật khẩu</h2><p>Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Đăng nhập ngay</button></div> : <form className="auth-form" onSubmit={handleSubmit}>{error ? <div className="auth-error" role="alert">{error}</div> : null}<PasswordField id="new-password" label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} /><PasswordField id="confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={setConfirmPassword} /><button className="button button-primary button-large auth-submit-btn">Lưu mật khẩu mới</button></form>}
    </AuthExperience>
  );
}
