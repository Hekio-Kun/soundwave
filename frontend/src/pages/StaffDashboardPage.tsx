import { ClockIcon, ShieldIcon } from "../icons";
import { ModeratePendingTracks } from "../components/ModeratePendingTracks";

type Props = {
  onNavigate: (route: string) => void;
  initialSubmissionId?: number | null;
};

export function StaffDashboardPage({ onNavigate, initialSubmissionId }: Props) {
  return (
    <div className="ops-dashboard ops-dashboard--staff">
      <header className="ops-dashboard-heading staff-heading">
        <div className="ops-dashboard-heading-copy">
          <span className="ops-role-mark">
            <ShieldIcon width={14} height={14} />
            STAFF MODERATOR WORKSPACE
          </span>
          <h1>Moderate Pending Tracks</h1>
          <p>
            Review track submissions prioritized by wait time (FIFO). Verify audio stream quality, inspect creator notes &amp; metadata, and approve or reject submissions with actionable feedback.
          </p>
        </div>
        <div className="ops-heading-actions">
          <div className="staff-shift-badge">
            <span className="staff-pulse-dot" />
            <ClockIcon width={14} height={14} />
            <span>Active Shift · FIFO Priority Queue</span>
          </div>
        </div>
      </header>

      <ModeratePendingTracks onNavigate={onNavigate} initialSubmissionId={initialSubmissionId} />
    </div>
  );
}
