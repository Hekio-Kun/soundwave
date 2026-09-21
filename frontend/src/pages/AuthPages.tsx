import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertIcon,
  CheckIcon,
  ChevronLeftIcon,
  HeadphonesIcon,
  LockIcon,
  MailIcon,
  PlayIcon,
  ShieldIcon,
  UserIcon,
} from "../icons";

type AuthProps = {
  onLoginSuccess: (credentials: { email: string; password: string }) => void;
  onNavigate: (route: string) => void;
};

type AuthMode = "login" | "register" | "recovery";
type FieldErrors = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function focusFirstInvalid(errors: FieldErrors) {
  const firstInvalidId = Object.keys(errors).find((key) => errors[key]);
  if (firstInvalidId) {
    window.requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
  }
}

function AuthErrorNotice({ message }: { message: string }) {
  return (
    <div className="auth-v2-error" role="alert" aria-live="polite">
      <span><AlertIcon width={17} height={17} /></span>
      <div><b>Thông tin chưa đầy đủ</b><small>{message}</small></div>
    </div>
  );
}

function AuthExperience({
  children,
  mode,
  eyebrow,
  title,
  description,
  onNavigate,
}: {
  children: ReactNode;
  mode: AuthMode;
  eyebrow: string;
  title: string;
  description: string;
  onNavigate: (route: string) => void;
}) {
  return (
    <main className="auth-v2-experience">
      <section className="auth-v2-story" aria-label="Giới thiệu SoundWave">
        <div className="auth-v2-orbit auth-v2-orbit--one" />
        <div className="auth-v2-orbit auth-v2-orbit--two" />
        <button className="auth-v2-brand" onClick={() => onNavigate("/")} aria-label="Về trang khám phá SoundWave">
          <img src="/soundwave-logo.png" alt="" />
          <span>SoundWave</span>
        </button>
        <div className="auth-v2-story-content">
          <span className="auth-v2-story-tag"><HeadphonesIcon width={15} height={15} /> ÂM NHẠC KẾT NỐI CỘNG ĐỒNG</span>
          <h2>Mỗi khoảnh khắc<br />đều có một <span>giai điệu.</span></h2>
          <p>Nghe nhạc từ cộng đồng nghệ sĩ độc lập, lưu lại những điều bạn yêu thích và chia sẻ tác phẩm của riêng mình.</p>

          <div className="auth-v2-now-playing">
            <span className="auth-v2-cover"><i /><i /><i /><i /></span>
            <span><small>ĐANG PHÁT TRÊN SOUNDWAVE</small><strong>Sớm Mai Dịu Dàng</strong><em>Minh An · Acoustic</em></span>
            <b><PlayIcon width={17} height={17} /></b>
          </div>

          <div className="auth-v2-trust-row">
            <span><ShieldIcon width={16} height={16} /><b>Không quảng cáo chen ngang</b><small>Tập trung vào âm nhạc</small></span>
            <span><HeadphonesIcon width={16} height={16} /><b>Âm thanh chất lượng</b><small>Trải nghiệm liền mạch</small></span>
          </div>
        </div>
      </section>

      <section className="auth-v2-workspace">
        <button className="auth-v2-back-home" onClick={() => onNavigate("/")}>
          <ChevronLeftIcon width={16} height={16} />
          Về trang khám phá
        </button>
        <div className="auth-v2-card">
          {mode !== "recovery" ? (
            <nav className="auth-v2-tabs" aria-label="Chuyển đổi đăng nhập và đăng ký">
              <button className={mode === "login" ? "is-active" : ""} onClick={() => onNavigate("/login")} aria-current={mode === "login" ? "page" : undefined}>Đăng nhập</button>
              <button className={mode === "register" ? "is-active" : ""} onClick={() => onNavigate("/register")} aria-current={mode === "register" ? "page" : undefined}>Đăng ký</button>
            </nav>
          ) : null}

          <div className="auth-v2-heading">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  icon,
  minLength,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email";
  autoComplete?: string;
  icon: ReactNode;
  minLength?: number;
  error?: string;
}) {
  return (
    <div className={`auth-v2-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className={`auth-v2-input ${error ? "is-invalid" : ""}`}>
        <span>{icon}</span>
        <input id={id} type={type} required minLength={minLength} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      </div>
      {error ? <small className="auth-v2-field-error" id={`${id}-error`}><AlertIcon width={12} height={12} />{error}</small> : null}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  action,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  action?: ReactNode;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`auth-v2-field ${error ? "has-error" : ""}`}>
      <div className="auth-v2-label-row"><label htmlFor={id}>{label}</label>{action}</div>
      <div className={`auth-v2-input auth-v2-input--password ${error ? "is-invalid" : ""}`}>
        <span><LockIcon width={17} height={17} /></span>
        <input id={id} type={visible ? "text" : "password"} required minLength={8} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Nhập tối thiểu 8 ký tự" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{visible ? "Ẩn" : "Hiện"}</button>
      </div>
      {error ? <small className="auth-v2-field-error" id={`${id}-error`}><AlertIcon width={12} height={12} />{error}</small> : null}
    </div>
  );
}

export function LoginPage({ onLoginSuccess, onNavigate }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors["login-email"] = "Bạn chưa nhập địa chỉ email.";
    else if (!emailPattern.test(email.trim())) nextErrors["login-email"] = "Địa chỉ email chưa đúng định dạng.";
    if (!password) nextErrors["login-password"] = "Bạn chưa nhập mật khẩu.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    onLoginSuccess({ email: email.trim(), password });
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="login" eyebrow="CHÀO MỪNG TRỞ LẠI" title="Tiếp tục cùng SoundWave" description="Đăng nhập để mở thư viện cá nhân và tiếp tục nghe từ nơi bạn đã dừng." onNavigate={onNavigate}>
      <form onSubmit={handleSubmit} className="auth-v2-form" noValidate>
        {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Vui lòng kiểm tra các trường được đánh dấu bên dưới." /> : null}
        <TextField id="login-email" type="email" label="Địa chỉ email" value={email} onChange={updateField("login-email", setEmail)} placeholder="ban@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["login-email"]} />
        <PasswordField id="login-password" label="Mật khẩu" value={password} onChange={updateField("login-password", setPassword)} autoComplete="current-password" action={<button type="button" className="auth-v2-text-button" onClick={() => onNavigate("/forgot-password")}>Quên mật khẩu?</button>} error={errors["login-password"]} />

        <div className="auth-v2-form-options">
          <label><input type="checkbox" defaultChecked /><span>Ghi nhớ đăng nhập</span></label>
          <span><ShieldIcon width={13} height={13} /> Kết nối được bảo vệ</span>
        </div>

        <button type="submit" className="button button-primary button-large auth-v2-submit">Đăng nhập SoundWave</button>
      </form>

      <div className="auth-v2-access-note">
        <ShieldIcon width={17} height={17} />
        <span><b>Quyền truy cập được xác định tự động</b><small>Hệ thống sẽ kiểm tra vai trò của tài khoản sau khi đăng nhập.</small></span>
      </div>

      <p className="auth-v2-switch">Chưa có tài khoản? <button onClick={() => onNavigate("/register")}>Tạo tài khoản miễn phí</button></p>
    </AuthExperience>
  );
}

export function RegisterPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const passwordRules = [
    { label: "8+ ký tự", valid: password.length >= 8 },
    { label: "Có chữ hoa", valid: /[A-Z]/.test(password) },
    { label: "Có chữ số", valid: /\d/.test(password) },
  ];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!displayName.trim()) nextErrors["reg-name"] = "Bạn chưa nhập tên hiển thị.";
    else if (displayName.trim().length < 2) nextErrors["reg-name"] = "Tên hiển thị cần có ít nhất 2 ký tự.";
    if (!email.trim()) nextErrors["reg-email"] = "Bạn chưa nhập địa chỉ email.";
    else if (!emailPattern.test(email.trim())) nextErrors["reg-email"] = "Địa chỉ email chưa đúng định dạng.";
    if (!password) nextErrors["reg-password"] = "Bạn chưa tạo mật khẩu.";
    else if (!passwordRules.every((rule) => rule.valid)) nextErrors["reg-password"] = "Mật khẩu chưa đáp ứng đủ yêu cầu bảo mật.";
    if (!confirmPassword) nextErrors["reg-confirm"] = "Bạn chưa xác nhận mật khẩu.";
    else if (password !== confirmPassword) nextErrors["reg-confirm"] = "Mật khẩu xác nhận chưa trùng khớp.";
    if (!termsAccepted) nextErrors["reg-terms"] = "Bạn cần đồng ý với điều khoản để tiếp tục.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="register" eyebrow="BẮT ĐẦU MIỄN PHÍ" title="Tạo không gian âm nhạc của bạn" description="Một tài khoản cho nghe nhạc, lưu playlist và chia sẻ những sáng tác mới." onNavigate={onNavigate}>
      {submitted ? (
        <div className="auth-v2-success">
          <span><CheckIcon width={28} height={28} /></span>
          <small>ĐĂNG KÝ THÀNH CÔNG</small>
          <h2>Kiểm tra hộp thư của bạn</h2>
          <p>Liên kết xác thực đã được gửi đến <b>{email}</b>. Hãy xác thực email trước khi đăng nhập.</p>
          <button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Đến trang đăng nhập</button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="auth-v2-form" noValidate>
            {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Hãy bổ sung các thông tin bắt buộc trước khi tạo tài khoản." /> : null}
            <div className="auth-v2-two-columns">
              <TextField id="reg-name" label="Tên hiển thị" value={displayName} onChange={updateField("reg-name", setDisplayName)} placeholder="Ví dụ: Lê An" autoComplete="name" minLength={2} icon={<UserIcon width={17} height={17} />} error={errors["reg-name"]} />
              <TextField id="reg-email" type="email" label="Địa chỉ email" value={email} onChange={updateField("reg-email", setEmail)} placeholder="ban@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["reg-email"]} />
            </div>
            <PasswordField id="reg-password" label="Mật khẩu" value={password} onChange={updateField("reg-password", setPassword)} autoComplete="new-password" error={errors["reg-password"]} />
            <div className="auth-v2-password-rules">
              {passwordRules.map((rule) => <span key={rule.label} className={rule.valid ? "is-valid" : ""}><i>{rule.valid ? <CheckIcon width={10} height={10} /> : null}</i>{rule.label}</span>)}
            </div>
            <PasswordField id="reg-confirm" label="Xác nhận mật khẩu" value={confirmPassword} onChange={updateField("reg-confirm", setConfirmPassword)} autoComplete="new-password" error={errors["reg-confirm"]} />
            <div className={`auth-v2-terms-wrap ${errors["reg-terms"] ? "has-error" : ""}`}>
              <label className="auth-v2-terms"><input id="reg-terms" type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setErrors((current) => ({ ...current, "reg-terms": "" })); }} aria-invalid={Boolean(errors["reg-terms"])} aria-describedby={errors["reg-terms"] ? "reg-terms-error" : undefined} /><span>Tôi đồng ý với <button type="button">Điều khoản sử dụng</button> và <button type="button">Chính sách cộng đồng</button> của SoundWave.</span></label>
              {errors["reg-terms"] ? <small className="auth-v2-field-error" id="reg-terms-error"><AlertIcon width={12} height={12} />{errors["reg-terms"]}</small> : null}
            </div>
            <button type="submit" className="button button-primary button-large auth-v2-submit">Tạo tài khoản miễn phí</button>
          </form>
          <p className="auth-v2-switch">Đã có tài khoản? <button onClick={() => onNavigate("/login")}>Đăng nhập ngay</button></p>
        </>
      )}
    </AuthExperience>
  );
}

export function ForgotPasswordPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors["forgot-email"] = "Bạn chưa nhập địa chỉ email.";
    else if (!emailPattern.test(email.trim())) nextErrors["forgot-email"] = "Địa chỉ email chưa đúng định dạng.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  return (
    <AuthExperience mode="recovery" eyebrow="KHÔI PHỤC TÀI KHOẢN" title="Quên mật khẩu?" description="Nhập email đã đăng ký, SoundWave sẽ gửi hướng dẫn đặt lại mật khẩu." onNavigate={onNavigate}>
      {submitted ? (
        <div className="auth-v2-success"><span><CheckIcon width={28} height={28} /></span><h2>Email đã được gửi</h2><p>Nếu <b>{email}</b> thuộc một tài khoản, bạn sẽ nhận được liên kết trong vài phút.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Quay lại đăng nhập</button></div>
      ) : (
        <form className="auth-v2-form" onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Nhập email đã dùng để đăng ký tài khoản SoundWave." /> : null}
          <TextField id="forgot-email" type="email" label="Email đã đăng ký" value={email} onChange={(value) => { setEmail(value); setErrors({}); }} placeholder="ban@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["forgot-email"]} />
          <button className="button button-primary button-large auth-v2-submit">Gửi liên kết khôi phục</button>
          <button type="button" className="auth-v2-back" onClick={() => onNavigate("/login")}>← Quay lại đăng nhập</button>
        </form>
      )}
    </AuthExperience>
  );
}

export function ResetPasswordPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!newPassword) nextErrors["new-password"] = "Bạn chưa nhập mật khẩu mới.";
    else if (newPassword.length < 8) nextErrors["new-password"] = "Mật khẩu mới cần có ít nhất 8 ký tự.";
    if (!confirmPassword) nextErrors["confirm-password"] = "Bạn chưa xác nhận mật khẩu mới.";
    else if (newPassword !== confirmPassword) nextErrors["confirm-password"] = "Mật khẩu xác nhận chưa trùng khớp.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="recovery" eyebrow="BẢO MẬT TÀI KHOẢN" title="Tạo mật khẩu mới" description="Chọn mật khẩu khác với những mật khẩu bạn đã sử dụng trước đây." onNavigate={onNavigate}>
      {submitted ? (
        <div className="auth-v2-success"><span><CheckIcon width={28} height={28} /></span><h2>Đã cập nhật mật khẩu</h2><p>Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Đăng nhập ngay</button></div>
      ) : (
        <form className="auth-v2-form" onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Vui lòng kiểm tra mật khẩu mới và phần xác nhận." /> : null}
          <PasswordField id="new-password" label="Mật khẩu mới" value={newPassword} onChange={updateField("new-password", setNewPassword)} autoComplete="new-password" error={errors["new-password"]} />
          <PasswordField id="confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={updateField("confirm-password", setConfirmPassword)} autoComplete="new-password" error={errors["confirm-password"]} />
          <button className="button button-primary button-large auth-v2-submit">Lưu mật khẩu mới</button>
        </form>
      )}
    </AuthExperience>
  );
}
