import { useState } from "react";
import { AlertIcon, CheckIcon, ClockIcon, MailIcon, ShieldIcon } from "../icons";
import { AuthExperience } from "./AuthPages";

export type EmailVerificationStatus = "verifying" | "success" | "expired" | "invalid";

type VerifyEmailPageProps = {
  email: string;
  status: EmailVerificationStatus;
  onNavigate: (route: string) => void;
};

const verificationContent: Record<
  EmailVerificationStatus,
  {
    eyebrow: string;
    title: string;
    description: string;
    resultTitle: string;
    resultDescription: string;
    statusLabel: string;
  }
> = {
  verifying: {
    eyebrow: "VERIFYING EMAIL",
    title: "Checking your link",
    description: "SoundWave is validating the link sent to your email.",
    resultTitle: "Please wait a moment",
    resultDescription: "Verification usually takes only a few seconds.",
    statusLabel: "Verifying",
  },
  success: {
    eyebrow: "VERIFICATION SUCCESSFUL",
    title: "Your account is ready",
    description: "Your email has been verified and your SoundWave account is active.",
    resultTitle: "Welcome to SoundWave!",
    resultDescription: "You can now log in to save music, create playlists, and share your work.",
    statusLabel: "Verified",
  },
  expired: {
    eyebrow: "LINK EXPIRED",
    title: "You need a new link",
    description: "This verification link has expired to protect your account.",
    resultTitle: "You can try again",
    resultDescription: "Ask SoundWave to send a new verification link to your registered email.",
    statusLabel: "Expired",
  },
  invalid: {
    eyebrow: "VERIFICATION FAILED",
    title: "Invalid link",
    description: "This link may have already been used or may no longer exist.",
    resultTitle: "Check your email again",
    resultDescription: "You can request a new link or return to Login.",
    statusLabel: "Invalid",
  },
};

export function VerifyEmailPage({ email, status, onNavigate }: VerifyEmailPageProps) {
  const [resendSent, setResendSent] = useState(false);
  const content = verificationContent[status];
  const canResend = status === "expired" || status === "invalid";

  const renderStatusIcon = () => {
    if (status === "success") return <CheckIcon width={34} height={34} />;
    if (status === "expired") return <ClockIcon width={32} height={32} />;
    if (status === "invalid") return <AlertIcon width={30} height={30} />;
    return <ShieldIcon width={31} height={31} />;
  };

  return (
    <AuthExperience
      mode="verification"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      onNavigate={onNavigate}
    >
      <section
        className={`auth-v2-verification auth-v2-verification--${status}`}
        aria-live="polite"
        aria-busy={status === "verifying"}
      >
        <div className="auth-v2-verification-visual" aria-hidden="true">
          <span className="auth-v2-verification-mail"><MailIcon width={31} height={31} /></span>
          <span className="auth-v2-verification-badge">{renderStatusIcon()}</span>
        </div>

        <div className="auth-v2-verification-copy">
          <h2>{content.resultTitle}</h2>
          <p>{content.resultDescription}</p>
        </div>

        <dl className="auth-v2-verification-details">
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Verification Status</dt>
            <dd><span>{content.statusLabel}</span></dd>
          </div>
        </dl>

        {resendSent ? (
          <div className="auth-v2-verification-resend" role="status">
            <CheckIcon width={17} height={17} />
            <span><b>A new email was sent</b><small>Check your inbox and spam folder.</small></span>
          </div>
        ) : null}

        <div className="auth-v2-verification-actions">
          {status === "success" ? (
            <button className="button button-primary button-large" onClick={() => onNavigate("/login")}>Login</button>
          ) : canResend ? (
            <button className="button button-primary button-large" onClick={() => setResendSent(true)} disabled={resendSent}>Resend Email</button>
          ) : (
            <button className="button button-primary button-large" disabled>Verifying...</button>
          )}
          <button className="button button-secondary button-large" onClick={() => onNavigate(status === "success" ? "/" : "/login")}>
            {status === "success" ? "Back to Explore" : "Back to Login"}
          </button>
        </div>

        <div className="auth-v2-verification-security">
          <ShieldIcon width={17} height={17} />
          <span><b>Protected link</b><small>Each verification link can only be used once.</small></span>
        </div>
      </section>
    </AuthExperience>
  );
}
