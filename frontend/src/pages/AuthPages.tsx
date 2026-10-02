import { useState, type FormEvent, type ReactNode } from "react";
import { AuthApiError, authApi, getAuthErrorMessage, type AuthSession } from "../api/auth";
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
  onLoginSuccess: (session: AuthSession, rememberMe: boolean) => void;
  onNavigate: (route: string) => void;
};

type AuthMode = "login" | "register" | "recovery" | "verification";
type FieldErrors = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function focusFirstInvalid(errors: FieldErrors) {
  const firstInvalidId = Object.keys(errors).find((key) => errors[key]);
  if (firstInvalidId) {
    window.requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
  }
}

function AuthErrorNotice({
  message,
  title = "Incomplete information",
  action,
}: {
  message: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="auth-v2-error" role="alert" aria-live="polite">
      <span><AlertIcon width={17} height={17} /></span>
      <div><b>{title}</b><small>{message}</small>{action}</div>
    </div>
  );
}

export function AuthExperience({
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
      <section className="auth-v2-story" aria-label="About SoundWave">
        <div className="auth-v2-orbit auth-v2-orbit--one" />
        <div className="auth-v2-orbit auth-v2-orbit--two" />
        <button className="auth-v2-brand" onClick={() => onNavigate("/")} aria-label="Return to SoundWave Explore">
          <img src="/soundwave-logo.png" alt="" />
          <span>SoundWave</span>
        </button>
        <div className="auth-v2-story-content">
          <span className="auth-v2-story-tag"><HeadphonesIcon width={15} height={15} /> MUSIC CONNECTS THE COMMUNITY</span>
          <h2>Every moment<br />has its own <span>soundtrack.</span></h2>
          <p>Listen to independent creators, save what you love, and share your own music.</p>

          <div className="auth-v2-now-playing">
            <span className="auth-v2-cover"><i /><i /><i /><i /></span>
            <span><small>NOW PLAYING ON SOUNDWAVE</small><strong>Sớm Mai Dịu Dàng</strong><em>Minh An · Acoustic</em></span>
            <b><PlayIcon width={17} height={17} /></b>
          </div>

          <div className="auth-v2-trust-row">
            <span><ShieldIcon width={16} height={16} /><b>No interrupting ads</b><small>Stay focused on the music</small></span>
            <span><HeadphonesIcon width={16} height={16} /><b>Quality audio</b><small>A seamless listening experience</small></span>
          </div>
        </div>
      </section>

      <section className="auth-v2-workspace">
        <button className="auth-v2-back-home" onClick={() => onNavigate("/")}>
          <ChevronLeftIcon width={16} height={16} />
          Back to Explore
        </button>
        <div className="auth-v2-card">
          {mode === "login" || mode === "register" ? (
            <nav className="auth-v2-tabs" aria-label="Switch between Login and Register">
              <button className={mode === "login" ? "is-active" : ""} onClick={() => onNavigate("/login")} aria-current={mode === "login" ? "page" : undefined}>Login</button>
              <button className={mode === "register" ? "is-active" : ""} onClick={() => onNavigate("/register")} aria-current={mode === "register" ? "page" : undefined}>Register</button>
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
        <input id={id} type={visible ? "text" : "password"} required minLength={8} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter at least 8 characters" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide Password" : "Show Password"}>{visible ? "Hide" : "Show"}</button>
      </div>
      {error ? <small className="auth-v2-field-error" id={`${id}-error`}><AlertIcon width={12} height={12} />{error}</small> : null}
    </div>
  );
}

export function LoginPage({ onLoginSuccess, onNavigate }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [apiErrorCode, setApiErrorCode] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors["login-email"] = "Please enter your email address.";
    else if (!emailPattern.test(email.trim())) nextErrors["login-email"] = "Please enter a valid email address.";
    if (!password) nextErrors["login-password"] = "Please enter your password.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    setApiError("");
    setApiErrorCode("");
    setResendMessage("");
    setSubmitting(true);
    try {
      const session = await authApi.login(email.trim(), password, rememberMe);
      onLoginSuccess(session, rememberMe);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Login failed. Please try again."));
      setApiErrorCode(error instanceof AuthApiError ? error.code ?? "" : "");
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerificationOtp = async () => {
    setResendingVerification(true);
    setResendMessage("");
    try {
      const result = await authApi.resendVerificationOtp(email.trim());
      setApiError("");
      setApiErrorCode("");
      setResendMessage(result.message);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Unable to resend the verification OTP."));
      setApiErrorCode(error instanceof AuthApiError ? error.code ?? "" : "");
    } finally {
      setResendingVerification(false);
    }
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setApiError("");
    setApiErrorCode("");
    setResendMessage("");
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="login" eyebrow="WELCOME BACK" title="Continue with SoundWave" description="Log in to open your personal library and continue listening where you left off." onNavigate={onNavigate}>
      <form onSubmit={handleSubmit} className="auth-v2-form" noValidate>
        {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Please review the fields marked below." /> : null}
        {apiError ? (
          <AuthErrorNotice
            title={apiErrorCode === "ACCOUNT_BANNED" ? "Account banned" : "Unable to log in"}
            message={apiError}
            action={apiErrorCode === "EMAIL_NOT_VERIFIED" ? (
              <button
                type="button"
                className="auth-v2-error-action"
                onClick={resendVerificationOtp}
                disabled={resendingVerification}
              >
                {resendingVerification ? "Sending…" : "Resend verification OTP"}
              </button>
            ) : undefined}
          />
        ) : null}
        {resendMessage ? (
          <div className="auth-v2-verification-resend" role="status">
            <CheckIcon width={17} height={17} />
            <span><b>OTP sent</b><small>{resendMessage}</small></span>
          </div>
        ) : null}
        <TextField id="login-email" type="email" label="Email" value={email} onChange={updateField("login-email", setEmail)} placeholder="you@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["login-email"]} />
        <PasswordField id="login-password" label="Password" value={password} onChange={updateField("login-password", setPassword)} autoComplete="current-password" action={<button type="button" className="auth-v2-text-button" onClick={() => onNavigate("/forgot-password")}>Forgot Password?</button>} error={errors["login-password"]} />

        <div className="auth-v2-form-options">
          <label><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Remember Me</span></label>
          <span><ShieldIcon width={13} height={13} /> Secure connection</span>
        </div>

        <button type="submit" className="button button-primary button-large auth-v2-submit" disabled={submitting}>{submitting ? "Logging in…" : "Login"}</button>
      </form>

      <div className="auth-v2-access-note">
        <ShieldIcon width={17} height={17} />
        <span><b>Access is assigned automatically</b><small>The system checks the account role after login.</small></span>
      </div>

      <p className="auth-v2-switch">Do not have an account? <button onClick={() => onNavigate("/register")}>Register</button></p>
    </AuthExperience>
  );
}

export function RegisterPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!displayName.trim()) nextErrors["reg-name"] = "Please enter your display name.";
    else if (displayName.trim().length < 2) nextErrors["reg-name"] = "Display Name must contain at least 2 characters.";
    if (!email.trim()) nextErrors["reg-email"] = "Please enter your email address.";
    else if (!emailPattern.test(email.trim())) nextErrors["reg-email"] = "Please enter a valid email address.";
    if (!password) nextErrors["reg-password"] = "Please create a password.";
    else if (!passwordRules.every((rule) => rule.valid)) nextErrors["reg-password"] = "Password does not meet all security requirements.";
    if (!confirmPassword) nextErrors["reg-confirm"] = "Please confirm your password.";
    else if (password !== confirmPassword) nextErrors["reg-confirm"] = "Confirm Password does not match.";
    if (!termsAccepted) nextErrors["reg-terms"] = "Please accept the terms to continue.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    setApiError("");
    setSubmitting(true);
    try {
      await authApi.register({ displayName: displayName.trim(), email: email.trim(), password, confirmPassword });
      onNavigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Registration failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setApiError("");
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="register" eyebrow="START FOR FREE" title="Create your music space" description="One account to listen, save playlists, and share new music." onNavigate={onNavigate}>
      <>
          <form onSubmit={handleSubmit} className="auth-v2-form" noValidate>
            {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Complete all required information before registering." /> : null}
            {apiError ? <AuthErrorNotice title="Unable to register" message={apiError} /> : null}
            <div className="auth-v2-two-columns">
              <TextField id="reg-name" label="Display Name" value={displayName} onChange={updateField("reg-name", setDisplayName)} placeholder="For example: Le An" autoComplete="name" minLength={2} icon={<UserIcon width={17} height={17} />} error={errors["reg-name"]} />
              <TextField id="reg-email" type="email" label="Email" value={email} onChange={updateField("reg-email", setEmail)} placeholder="you@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["reg-email"]} />
            </div>
            <PasswordField id="reg-password" label="Password" value={password} onChange={updateField("reg-password", setPassword)} autoComplete="new-password" error={errors["reg-password"]} />
            <div className="auth-v2-password-rules">
              {passwordRules.map((rule) => <span key={rule.label} className={rule.valid ? "is-valid" : ""}><i>{rule.valid ? <CheckIcon width={10} height={10} /> : null}</i>{rule.label}</span>)}
            </div>
            <PasswordField id="reg-confirm" label="Confirm Password" value={confirmPassword} onChange={updateField("reg-confirm", setConfirmPassword)} autoComplete="new-password" error={errors["reg-confirm"]} />
            <div className={`auth-v2-terms-wrap ${errors["reg-terms"] ? "has-error" : ""}`}>
              <label className="auth-v2-terms"><input id="reg-terms" type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setErrors((current) => ({ ...current, "reg-terms": "" })); }} aria-invalid={Boolean(errors["reg-terms"])} aria-describedby={errors["reg-terms"] ? "reg-terms-error" : undefined} /><span>I accept SoundWave's <button type="button">Terms of Use</button> and <button type="button">Community Policy</button>.</span></label>
              {errors["reg-terms"] ? <small className="auth-v2-field-error" id="reg-terms-error"><AlertIcon width={12} height={12} />{errors["reg-terms"]}</small> : null}
            </div>
            <button type="submit" className="button button-primary button-large auth-v2-submit" disabled={submitting}>{submitting ? "Creating account…" : "Register"}</button>
          </form>
          <p className="auth-v2-switch">Already have an account? <button onClick={() => onNavigate("/login")}>Login</button></p>
      </>
    </AuthExperience>
  );
}

export function ForgotPasswordPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors["forgot-email"] = "Please enter your email address.";
    else if (!emailPattern.test(email.trim())) nextErrors["forgot-email"] = "Please enter a valid email address.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }
    setErrors({});
    setApiError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      onNavigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Unable to send the reset OTP. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthExperience mode="recovery" eyebrow="ACCOUNT RECOVERY" title="Forgot Password?" description="Enter your registered email and SoundWave will send password-reset instructions." onNavigate={onNavigate}>
      <form className="auth-v2-form" onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Enter the email used to register your SoundWave account." /> : null}
          {apiError ? <AuthErrorNotice title="Unable to send OTP" message={apiError} /> : null}
          <TextField id="forgot-email" type="email" label="Email" value={email} onChange={(value) => { setEmail(value); setErrors({}); setApiError(""); }} placeholder="you@example.com" autoComplete="email" icon={<MailIcon width={17} height={17} />} error={errors["forgot-email"]} />
          <button className="button button-primary button-large auth-v2-submit" disabled={submitting}>{submitting ? "Sending OTP…" : "Send Reset OTP"}</button>
          <button type="button" className="auth-v2-back" onClick={() => onNavigate("/login")}>← Back to Login</button>
      </form>
    </AuthExperience>
  );
}

export function ResetPasswordPage({ email, onNavigate }: { email: string; onNavigate: (route: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!/^\d{6}$/.test(otp)) nextErrors["reset-otp"] = "Enter the 6-digit code from your email.";
    if (!newPassword) nextErrors["new-password"] = "Please enter a new password.";
    else if (newPassword.length < 8) nextErrors["new-password"] = "New Password must contain at least 8 characters.";
    if (!confirmPassword) nextErrors["confirm-password"] = "Please confirm your new password.";
    else if (newPassword !== confirmPassword) nextErrors["confirm-password"] = "Confirm Password does not match.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setErrors({});
    setApiError("");
    setSubmitting(true);
    try {
      await authApi.resetPassword(email, otp, newPassword, confirmPassword);
      setSubmitted(true);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Unable to reset your password. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (id: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setApiError("");
    setErrors((current) => ({ ...current, [id]: "" }));
  };

  return (
    <AuthExperience mode="recovery" eyebrow="ACCOUNT SECURITY" title="Create a new password" description={`Enter the OTP sent to ${email || "your email"} and choose a secure password.`} onNavigate={onNavigate}>
      {submitted ? (
        <div className="auth-v2-success"><span><CheckIcon width={28} height={28} /></span><h2>Password updated</h2><p>You can now log in with your new password.</p><button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Login</button></div>
      ) : (
        <form className="auth-v2-form" onSubmit={handleSubmit} noValidate>
          {Object.values(errors).some(Boolean) ? <AuthErrorNotice message="Review the New Password and Confirm Password fields." /> : null}
          {apiError ? <AuthErrorNotice title="Unable to reset password" message={apiError} /> : null}
          <TextField id="reset-otp" label="6-digit OTP" value={otp} onChange={updateField("reset-otp", setOtp)} placeholder="000000" autoComplete="one-time-code" icon={<ShieldIcon width={17} height={17} />} error={errors["reset-otp"]} />
          <PasswordField id="new-password" label="New Password" value={newPassword} onChange={updateField("new-password", setNewPassword)} autoComplete="new-password" error={errors["new-password"]} />
          <PasswordField id="confirm-password" label="Confirm Password" value={confirmPassword} onChange={updateField("confirm-password", setConfirmPassword)} autoComplete="new-password" error={errors["confirm-password"]} />
          <button className="button button-primary button-large auth-v2-submit" disabled={submitting}>{submitting ? "Saving…" : "Save Password"}</button>
        </form>
      )}
    </AuthExperience>
  );
}
