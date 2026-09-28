import { useState, type FormEvent } from "react";
import { authApi, getAuthErrorMessage } from "../api/auth";
import { AlertIcon, CheckIcon, MailIcon, ShieldIcon } from "../icons";
import { AuthExperience } from "./AuthPages";

type VerifyEmailPageProps = {
  email: string;
  onNavigate: (route: string) => void;
};

export function VerifyEmailPage({ email, onNavigate }: VerifyEmailPageProps) {
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setFieldError("Enter the 6-digit code from your email.");
      requestAnimationFrame(() => document.getElementById("verify-otp")?.focus());
      return;
    }
    setApiError("");
    setSubmitting(true);
    try {
      const result = await authApi.verifyEmail(email, otp);
      setMessage(result.message);
      setVerified(true);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Email verification failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setApiError("");
    setMessage("");
    setResending(true);
    try {
      const result = await authApi.resendVerificationOtp(email);
      setMessage(result.message);
    } catch (error) {
      setApiError(getAuthErrorMessage(error, "Unable to send another OTP right now."));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthExperience mode="verification" eyebrow="VERIFY YOUR EMAIL" title="Enter your verification code" description={`We sent a 6-digit OTP to ${email}. The code expires shortly and can only be used once.`} onNavigate={onNavigate}>
      {verified ? (
        <div className="auth-v2-success" role="status">
          <span><CheckIcon width={28} height={28} /></span>
          <small>EMAIL VERIFIED</small>
          <h2>Your account is ready</h2>
          <p>{message}</p>
          <button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Go to Login</button>
        </div>
      ) : (
        <form className="auth-v2-form" onSubmit={handleSubmit} noValidate>
          {apiError ? <div className="auth-v2-error" role="alert"><span><AlertIcon width={17} height={17} /></span><div><b>Verification failed</b><small>{apiError}</small></div></div> : null}
          {message ? <div className="auth-v2-verification-resend" role="status"><CheckIcon width={17} height={17} /><span><b>OTP sent</b><small>{message}</small></span></div> : null}
          <div className={`auth-v2-field ${fieldError ? "has-error" : ""}`}>
            <label htmlFor="verify-otp">6-digit OTP</label>
            <div className={`auth-v2-input ${fieldError ? "is-invalid" : ""}`}>
              <span><MailIcon width={17} height={17} /></span>
              <input id="verify-otp" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setFieldError(""); setApiError(""); }} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? "verify-otp-error" : undefined} />
            </div>
            {fieldError ? <small className="auth-v2-field-error" id="verify-otp-error"><AlertIcon width={12} height={12} />{fieldError}</small> : null}
          </div>
          <button className="button button-primary button-large auth-v2-submit" disabled={submitting}>{submitting ? "Verifying…" : "Verify Email"}</button>
          <button type="button" className="button button-secondary" disabled={resending} onClick={handleResend}>{resending ? "Sending…" : "Resend OTP"}</button>
          <div className="auth-v2-verification-security"><ShieldIcon width={17} height={17} /><span><b>Keep this code private</b><small>SoundWave staff will never ask for your OTP.</small></span></div>
        </form>
      )}
    </AuthExperience>
  );
}
