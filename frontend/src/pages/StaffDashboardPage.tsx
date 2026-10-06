import { ShieldIcon } from "../icons";
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
              <span>TRACK MODERATION</span>
            </span>
          </div>

          <h1 className="staff-hero-title">Moderate Pending Tracks</h1>

          <p className="staff-hero-description">
            Review pending submissions and record an approval or rejection decision.
          </p>
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
