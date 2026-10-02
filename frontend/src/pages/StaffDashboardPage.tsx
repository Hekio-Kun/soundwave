import { ClockIcon, DiscIcon, ShieldIcon } from "../icons";
import { ModeratePendingTracks } from "../components/ModeratePendingTracks";

type Props = {
  onNavigate: (route: string) => void;
  initialSubmissionId?: number | null;
};

export function StaffDashboardPage({ onNavigate, initialSubmissionId }: Props) {
  return (
    <div className="ops-dashboard ops-dashboard--staff">
      {/* Executive Hero Banner */}
      <header className="staff-hero-banner">
        <div className="staff-hero-copy">
          <div className="staff-hero-eyebrow">
            <span className="staff-hero-eyebrow-pill">
              <ShieldIcon width={13} height={13} />
              <span>CONTENT MODERATION WORKSPACE</span>
            </span>
            <span className="staff-hero-live-indicator">
              <span className="staff-pulse-dot" />
              <span>FIFO Queue Active</span>
            </span>
          </div>

          <h1 className="staff-hero-title">Moderate Pending Tracks</h1>

          <p className="staff-hero-description">
            Audit music submissions in strict arrival sequence (FIFO). Listen to high-fidelity audio streams, inspect release metadata and creator notes, and approve to instantly publish to the SoundWave catalog or reject with actionable feedback.
          </p>
        </div>

        <div className="staff-hero-badges">
          <div className="staff-hero-badge-card">
            <div className="staff-hero-badge-icon">
              <ClockIcon width={16} height={16} />
            </div>
            <div className="staff-hero-badge-text">
              <strong>FIFO Priority</strong>
              <small>Oldest wait-time first</small>
            </div>
          </div>

          <div className="staff-hero-badge-card">
            <div className="staff-hero-badge-icon is-green">
              <DiscIcon width={16} height={16} />
            </div>
            <div className="staff-hero-badge-text">
              <strong>Instant Catalog Push</strong>
              <small>Auto-sync to streaming</small>
            </div>
          </div>
        </div>
      </header>

      {/* Main Review Center */}
      <ModeratePendingTracks
        onNavigate={onNavigate}
        initialSubmissionId={initialSubmissionId}
      />
    </div>
  );
}
