USE soundwave;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/*
 * Dữ liệu kiểm thử cục bộ cho SoundWave.
 * Chỉ chạy ở môi trường development/test, không chạy trên production.
 *
 * Mật khẩu chung của các tài khoản bên dưới: Test@123456
 * - listener.test@soundwave.local        ACTIVE / LISTENER
 * - creator.test@soundwave.local         ACTIVE / LISTENER
 * - pending.test@soundwave.local         PENDING / LISTENER
 * - banned.test@soundwave.local          BANNED / LISTENER
 * - staff.test@soundwave.local           ACTIVE / STAFF
 * - admin.test@soundwave.local           ACTIVE / ADMIN
 *
 * Audio và hình ảnh sử dụng media demo công khai của Cloudinary.
 * Script có thể chạy lại mà không tạo trùng dữ liệu.
 */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME2(3) = SYSUTCDATETIME();
    DECLARE @PasswordHash VARCHAR(255) = '$2a$10$SKikCyl4aWTIoFeG3ZKpHuiSFnvGCLbsxqEhCXXqTzwzc0daPLdM.';
    DECLARE @DemoAudioUrl NVARCHAR(2048) = N'https://res.cloudinary.com/demo/video/upload/dog.mp3';
    DECLARE @DemoCoverUrl NVARCHAR(2048) = N'https://res.cloudinary.com/demo/image/upload/sample.jpg';

    /* Roles */
    IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'LISTENER')
        INSERT INTO dbo.roles (code, name, description)
        VALUES ('LISTENER', N'Listener', N'Standard user for streaming and managing personal library.');

    IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'STAFF')
        INSERT INTO dbo.roles (code, name, description)
        VALUES ('STAFF', N'Staff', N'Content moderation staff managing tracks, reports, and official lyrics.');

    IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE code = 'ADMIN')
        INSERT INTO dbo.roles (code, name, description)
        VALUES ('ADMIN', N'Administrator', N'System administrator managing users, roles, genres, and platform analytics.');

    DECLARE @ListenerRoleId SMALLINT = (SELECT id FROM dbo.roles WHERE code = 'LISTENER');
    DECLARE @StaffRoleId SMALLINT = (SELECT id FROM dbo.roles WHERE code = 'STAFF');
    DECLARE @AdminRoleId SMALLINT = (SELECT id FROM dbo.roles WHERE code = 'ADMIN');

    /* Tài khoản ACTIVE dành cho Listener/Creator. */
    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'listener.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@ListenerRoleId, N'listener.test@soundwave.local', @PasswordHash,
             'ACTIVE', DATEADD(DAY, -30, @Now), DATEADD(DAY, -30, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @ListenerRoleId,
            password_hash = @PasswordHash,
            status = 'ACTIVE',
            email_verified_at = COALESCE(email_verified_at, DATEADD(DAY, -30, @Now)),
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'listener.test@soundwave.local';

    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'creator.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@ListenerRoleId, N'creator.test@soundwave.local', @PasswordHash,
             'ACTIVE', DATEADD(DAY, -25, @Now), DATEADD(DAY, -25, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @ListenerRoleId,
            password_hash = @PasswordHash,
            status = 'ACTIVE',
            email_verified_at = COALESCE(email_verified_at, DATEADD(DAY, -25, @Now)),
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'creator.test@soundwave.local';

    /* Tài khoản dùng để kiểm tra xác thực email và tài khoản bị cấm. */
    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'pending.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@ListenerRoleId, N'pending.test@soundwave.local', @PasswordHash,
             'PENDING', NULL, DATEADD(DAY, -2, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @ListenerRoleId,
            password_hash = @PasswordHash,
            status = 'PENDING',
            email_verified_at = NULL,
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'pending.test@soundwave.local';

    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'banned.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@ListenerRoleId, N'banned.test@soundwave.local', @PasswordHash,
             'BANNED', DATEADD(DAY, -20, @Now), DATEADD(DAY, -20, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @ListenerRoleId,
            password_hash = @PasswordHash,
            status = 'BANNED',
            email_verified_at = COALESCE(email_verified_at, DATEADD(DAY, -20, @Now)),
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'banned.test@soundwave.local';

    /* Tài khoản dành cho màn hình Staff và Admin. */
    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'staff.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@StaffRoleId, N'staff.test@soundwave.local', @PasswordHash,
             'ACTIVE', DATEADD(DAY, -40, @Now), DATEADD(DAY, -40, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @StaffRoleId,
            password_hash = @PasswordHash,
            status = 'ACTIVE',
            email_verified_at = COALESCE(email_verified_at, DATEADD(DAY, -40, @Now)),
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'staff.test@soundwave.local';

    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = N'admin.test@soundwave.local')
        INSERT INTO dbo.app_users
            (role_id, email, password_hash, status, email_verified_at, created_at, updated_at)
        VALUES
            (@AdminRoleId, N'admin.test@soundwave.local', @PasswordHash,
             'ACTIVE', DATEADD(DAY, -45, @Now), DATEADD(DAY, -45, @Now), @Now);
    ELSE
        UPDATE dbo.app_users
        SET role_id = @AdminRoleId,
            password_hash = @PasswordHash,
            status = 'ACTIVE',
            email_verified_at = COALESCE(email_verified_at, DATEADD(DAY, -45, @Now)),
            deleted_at = NULL,
            updated_at = @Now
        WHERE email = N'admin.test@soundwave.local';

    DECLARE @ListenerId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'listener.test@soundwave.local');
    DECLARE @CreatorId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'creator.test@soundwave.local');
    DECLARE @PendingId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'pending.test@soundwave.local');
    DECLARE @BannedId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'banned.test@soundwave.local');
    DECLARE @StaffId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'staff.test@soundwave.local');
    DECLARE @AdminId BIGINT = (SELECT id FROM dbo.app_users WHERE email = N'admin.test@soundwave.local');

    /* Hồ sơ người dùng */
    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @ListenerId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, bio, date_of_birth, country_code, created_at, updated_at)
        VALUES
            (@ListenerId, N'test_listener', N'Người nghe thử nghiệm',
             N'Tài khoản dùng để kiểm tra thư viện, playlist và yêu thích.', '2002-05-15', 'VN', @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @CreatorId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, bio, avatar_url, date_of_birth, country_code, created_at, updated_at)
        VALUES
            (@CreatorId, N'test_creator', N'Minh An Test',
             N'Creator thử nghiệm của SoundWave.', @DemoCoverUrl, '2000-09-21', 'VN', @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @PendingId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, country_code, created_at, updated_at)
        VALUES
            (@PendingId, N'test_pending', N'Tài khoản chưa xác thực', 'VN', @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @BannedId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, country_code, created_at, updated_at)
        VALUES
            (@BannedId, N'test_banned', N'Tài khoản bị cấm', 'VN', @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @StaffId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, bio, country_code, created_at, updated_at)
        VALUES
            (@StaffId, N'test_staff', N'Nhân viên kiểm duyệt Test',
             N'Tài khoản kiểm tra chức năng Staff.', 'VN', @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @AdminId)
        INSERT INTO dbo.user_profiles
            (user_id, username, display_name, bio, country_code, created_at, updated_at)
        VALUES
            (@AdminId, N'test_admin', N'Quản trị viên Test',
             N'Tài khoản kiểm tra chức năng Admin.', 'VN', @Now, @Now);

    /* Thể loại */
    IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE slug = 'pop')
        INSERT INTO dbo.genres (name, slug, description, is_active, created_by_user_id, created_at, updated_at)
        VALUES (N'Pop', 'pop', N'Nhạc Pop hiện đại và dễ nghe.', 1, @AdminId, @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE slug = 'acoustic')
        INSERT INTO dbo.genres (name, slug, description, is_active, created_by_user_id, created_at, updated_at)
        VALUES (N'Acoustic', 'acoustic', N'Âm nhạc mộc với nhạc cụ tự nhiên.', 1, @AdminId, @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE slug = 'edm')
        INSERT INTO dbo.genres (name, slug, description, is_active, created_by_user_id, created_at, updated_at)
        VALUES (N'EDM', 'edm', N'Nhạc điện tử dành cho không khí sôi động.', 1, @AdminId, @Now, @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE slug = 'lo-fi')
        INSERT INTO dbo.genres (name, slug, description, is_active, created_by_user_id, created_at, updated_at)
        VALUES (N'Lo-fi', 'lo-fi', N'Giai điệu nhẹ nhàng phù hợp học tập và thư giãn.', 1, @AdminId, @Now, @Now);

    DECLARE @PopGenreId BIGINT = (SELECT id FROM dbo.genres WHERE slug = 'pop');
    DECLARE @AcousticGenreId BIGINT = (SELECT id FROM dbo.genres WHERE slug = 'acoustic');
    DECLARE @EdmGenreId BIGINT = (SELECT id FROM dbo.genres WHERE slug = 'edm');
    DECLARE @LofiGenreId BIGINT = (SELECT id FROM dbo.genres WHERE slug = 'lo-fi');

    /* Album của Creator */
    IF NOT EXISTS (SELECT 1 FROM dbo.albums WHERE slug = 'seed-nhung-ngay-binh-yen')
        INSERT INTO dbo.albums
            (created_by_user_id, title, slug, description, status,
             cover_public_id, cover_url, release_date, published_at, created_at, updated_at)
        VALUES
            (@CreatorId, N'Những Ngày Bình Yên (Seed)', 'seed-nhung-ngay-binh-yen',
             N'Album dữ liệu mẫu để kiểm tra trang chi tiết và quản lý album.', 'PUBLISHED',
             N'seed/album-cover', @DemoCoverUrl, CAST(DATEADD(DAY, -14, @Now) AS DATE),
             DATEADD(DAY, -14, @Now), DATEADD(DAY, -20, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.albums WHERE slug = 'seed-album-dang-soan')
        INSERT INTO dbo.albums
            (created_by_user_id, title, slug, description, status,
             cover_public_id, cover_url, created_at, updated_at)
        VALUES
            (@CreatorId, N'Album Đang Soạn (Seed)', 'seed-album-dang-soan',
             N'Album ở trạng thái bản nháp.', 'DRAFT',
             N'seed/draft-album-cover', @DemoCoverUrl, DATEADD(DAY, -3, @Now), @Now);

    DECLARE @PublishedAlbumId BIGINT = (SELECT id FROM dbo.albums WHERE slug = 'seed-nhung-ngay-binh-yen');

    /* Track bao phủ các trạng thái quản lý và kiểm duyệt. */
    IF NOT EXISTS (SELECT 1 FROM dbo.tracks WHERE slug = 'seed-som-mai-diu-dang')
        INSERT INTO dbo.tracks
            (uploader_user_id, album_id, genre_id, title, slug, description, track_number,
             publication_status, approved_at, audio_public_id, audio_url, audio_format,
             duration_ms, cover_public_id, cover_url, play_count_cache, created_at, updated_at)
        VALUES
            (@CreatorId, @PublishedAlbumId, @PopGenreId, N'Sớm Mai Dịu Dàng (Seed)',
             'seed-som-mai-diu-dang', N'Bài hát đã xuất bản để kiểm tra catalog và playback.', 1,
             'PUBLISHED', DATEADD(DAY, -12, @Now), N'seed/audio-published', @DemoAudioUrl, 'mp3',
             5000, N'seed/cover-published', @DemoCoverUrl, 1240, DATEADD(DAY, -18, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.tracks WHERE slug = 'seed-phia-sau-con-mua')
        INSERT INTO dbo.tracks
            (uploader_user_id, album_id, genre_id, title, slug, description, track_number,
             publication_status, audio_public_id, audio_url, audio_format, duration_ms,
             cover_public_id, cover_url, play_count_cache, created_at, updated_at)
        VALUES
            (@CreatorId, @PublishedAlbumId, @AcousticGenreId, N'Phía Sau Cơn Mưa (Seed)',
             'seed-phia-sau-con-mua', N'Bài hát đang chờ Staff kiểm duyệt.', 2,
             'PENDING', N'seed/audio-pending', @DemoAudioUrl, 'mp3', 5000,
             N'seed/cover-pending', @DemoCoverUrl, 0, DATEADD(DAY, -4, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.tracks WHERE slug = 'seed-cham-vao-khoang-khong')
        INSERT INTO dbo.tracks
            (uploader_user_id, genre_id, title, slug, description,
             publication_status, audio_public_id, audio_url, audio_format, duration_ms,
             cover_public_id, cover_url, play_count_cache, created_at, updated_at)
        VALUES
            (@CreatorId, @LofiGenreId, N'Chạm Vào Khoảng Không (Seed)',
             'seed-cham-vao-khoang-khong', N'Bản nháp dùng để kiểm tra cập nhật và xóa track.',
             'DRAFT', N'seed/audio-draft', @DemoAudioUrl, 'mp3', 5000,
             N'seed/cover-draft', @DemoCoverUrl, 0, DATEADD(DAY, -2, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.tracks WHERE slug = 'seed-vu-dieu-dem-he')
        INSERT INTO dbo.tracks
            (uploader_user_id, genre_id, title, slug, description,
             publication_status, latest_rejection_reason, audio_public_id, audio_url,
             audio_format, duration_ms, cover_public_id, cover_url, play_count_cache, created_at, updated_at)
        VALUES
            (@CreatorId, @EdmGenreId, N'Vũ Điệu Đêm Hè (Seed)',
             'seed-vu-dieu-dem-he', N'Bài hát bị từ chối để kiểm tra phản hồi và gửi duyệt lại.',
             'REJECTED', N'Âm lượng bị vỡ và metadata chưa đầy đủ.', N'seed/audio-rejected', @DemoAudioUrl,
             'mp3', 5000, N'seed/cover-rejected', @DemoCoverUrl, 0, DATEADD(DAY, -8, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.tracks WHERE slug = 'seed-ban-thu-vi-pham')
        INSERT INTO dbo.tracks
            (uploader_user_id, genre_id, title, slug, description,
             publication_status, approved_at, audio_public_id, audio_url, audio_format,
             duration_ms, cover_public_id, cover_url, play_count_cache, created_at, updated_at)
        VALUES
            (@CreatorId, @PopGenreId, N'Bản Thu Vi Phạm (Seed)',
             'seed-ban-thu-vi-pham', N'Bài hát đã bị gỡ để kiểm tra xử lý báo cáo.',
             'TAKEN_DOWN', DATEADD(DAY, -20, @Now), N'seed/audio-taken-down', @DemoAudioUrl, 'mp3',
             5000, N'seed/cover-taken-down', @DemoCoverUrl, 320, DATEADD(DAY, -25, @Now), @Now);

    DECLARE @PublishedTrackId BIGINT = (SELECT id FROM dbo.tracks WHERE slug = 'seed-som-mai-diu-dang');
    DECLARE @PendingTrackId BIGINT = (SELECT id FROM dbo.tracks WHERE slug = 'seed-phia-sau-con-mua');
    DECLARE @DraftTrackId BIGINT = (SELECT id FROM dbo.tracks WHERE slug = 'seed-cham-vao-khoang-khong');
    DECLARE @RejectedTrackId BIGINT = (SELECT id FROM dbo.tracks WHERE slug = 'seed-vu-dieu-dem-he');
    DECLARE @TakenDownTrackId BIGINT = (SELECT id FROM dbo.tracks WHERE slug = 'seed-ban-thu-vi-pham');

    /* Lịch sử nộp duyệt */
    IF NOT EXISTS (SELECT 1 FROM dbo.track_submissions WHERE track_id = @PublishedTrackId AND status = 'APPROVED')
        INSERT INTO dbo.track_submissions
            (track_id, submitted_by_user_id, reviewer_user_id, status,
             submitter_note, reviewer_note, submitted_at, reviewed_at)
        VALUES
            (@PublishedTrackId, @CreatorId, @StaffId, 'APPROVED',
             N'Xin kiểm duyệt bản phát hành chính thức.', N'Chất lượng đạt yêu cầu.',
             DATEADD(DAY, -13, @Now), DATEADD(DAY, -12, @Now));

    IF NOT EXISTS (SELECT 1 FROM dbo.track_submissions WHERE track_id = @PendingTrackId AND status = 'PENDING')
        INSERT INTO dbo.track_submissions
            (track_id, submitted_by_user_id, status, submitter_note, submitted_at)
        VALUES
            (@PendingTrackId, @CreatorId, 'PENDING',
             N'Phiên bản mix đã hoàn thiện, chờ kiểm duyệt.', DATEADD(DAY, -1, @Now));

    IF NOT EXISTS (SELECT 1 FROM dbo.track_submissions WHERE track_id = @RejectedTrackId AND status = 'REJECTED')
        INSERT INTO dbo.track_submissions
            (track_id, submitted_by_user_id, reviewer_user_id, status,
             submitter_note, reviewer_note, rejection_reason, submitted_at, reviewed_at)
        VALUES
            (@RejectedTrackId, @CreatorId, @StaffId, 'REJECTED',
             N'Bản EDM mới.', N'Vui lòng cân bằng lại âm lượng và bổ sung mô tả.',
             N'Âm lượng bị vỡ và metadata chưa đầy đủ.',
             DATEADD(DAY, -7, @Now), DATEADD(DAY, -6, @Now));

    /* Ngôn ngữ và lyrics */
    IF NOT EXISTS (SELECT 1 FROM dbo.lyric_languages WHERE code = 'vi')
        INSERT INTO dbo.lyric_languages (code, name) VALUES ('vi', N'Vietnamese');

    IF NOT EXISTS (SELECT 1 FROM dbo.lyric_languages WHERE code = 'en')
        INSERT INTO dbo.lyric_languages (code, name) VALUES ('en', N'English');

    DECLARE @VietnameseLanguageId SMALLINT = (SELECT id FROM dbo.lyric_languages WHERE code = 'vi');
    DECLARE @EnglishLanguageId SMALLINT = (SELECT id FROM dbo.lyric_languages WHERE code = 'en');

    IF NOT EXISTS (
        SELECT 1 FROM dbo.official_lyrics
        WHERE track_id = @PublishedTrackId AND language_id = @VietnameseLanguageId
    )
        INSERT INTO dbo.official_lyrics
            (track_id, language_id, lyric_content, status, created_by_user_id, created_at, updated_at)
        VALUES
            (@PublishedTrackId, @VietnameseLanguageId,
             N'[00:00.00]Sớm mai dịu dàng qua ô cửa\n[00:03.00]Mang theo một ngày thật bình yên',
             'PUBLISHED', @StaffId, DATEADD(DAY, -12, @Now), @Now);

    IF NOT EXISTS (
        SELECT 1 FROM dbo.personal_lyrics
        WHERE user_id = @ListenerId AND track_id = @PublishedTrackId
          AND language_id = @EnglishLanguageId AND lyric_type = 'TRANSLATION'
    )
        INSERT INTO dbo.personal_lyrics
            (user_id, track_id, language_id, lyric_type, lyric_content, created_at, updated_at)
        VALUES
            (@ListenerId, @PublishedTrackId, @EnglishLanguageId, 'TRANSLATION',
             N'[00:00.00]A gentle morning passes by the window\n[00:03.00]Bringing a peaceful new day',
             DATEADD(DAY, -3, @Now), @Now);

    /* Favorites, lịch sử nghe và playlist */
    IF NOT EXISTS (SELECT 1 FROM dbo.favorites WHERE user_id = @ListenerId AND track_id = @PublishedTrackId)
        INSERT INTO dbo.favorites (user_id, track_id, created_at)
        VALUES (@ListenerId, @PublishedTrackId, DATEADD(DAY, -5, @Now));

    IF NOT EXISTS (
        SELECT 1 FROM dbo.listening_history
        WHERE user_id = @ListenerId AND track_id = @PublishedTrackId
          AND played_at >= DATEADD(DAY, -1, @Now)
    )
        INSERT INTO dbo.listening_history
            (user_id, track_id, listened_duration_ms, completed, played_at)
        VALUES
            (@ListenerId, @PublishedTrackId, 5000, 1, DATEADD(HOUR, -2, @Now));

    IF NOT EXISTS (SELECT 1 FROM dbo.playlists WHERE owner_user_id = @ListenerId AND name = N'Nhạc yêu thích (Seed)')
        INSERT INTO dbo.playlists
            (owner_user_id, name, description, visibility, cover_public_id, cover_url, created_at, updated_at)
        VALUES
            (@ListenerId, N'Nhạc yêu thích (Seed)',
             N'Playlist công khai dùng để kiểm tra trang danh sách phát.', 'PUBLIC',
             N'seed/playlist-cover', @DemoCoverUrl, DATEADD(DAY, -6, @Now), @Now);

    IF NOT EXISTS (SELECT 1 FROM dbo.playlists WHERE owner_user_id = @ListenerId AND name = N'Nghe sau (Seed)')
        INSERT INTO dbo.playlists
            (owner_user_id, name, description, visibility, created_at, updated_at)
        VALUES
            (@ListenerId, N'Nghe sau (Seed)',
             N'Playlist riêng tư dùng để kiểm tra quyền truy cập.', 'PRIVATE',
             DATEADD(DAY, -2, @Now), @Now);

    DECLARE @PublicPlaylistId BIGINT = (
        SELECT id FROM dbo.playlists
        WHERE owner_user_id = @ListenerId AND name = N'Nhạc yêu thích (Seed)'
    );

    IF NOT EXISTS (
        SELECT 1 FROM dbo.playlist_tracks
        WHERE playlist_id = @PublicPlaylistId AND track_id = @PublishedTrackId
    )
        INSERT INTO dbo.playlist_tracks (playlist_id, track_id, added_by_user_id, position, added_at)
        VALUES (@PublicPlaylistId, @PublishedTrackId, @ListenerId, 1, DATEADD(DAY, -5, @Now));

    /* Content report ở nhiều trạng thái để kiểm tra Staff. */
    IF NOT EXISTS (
        SELECT 1 FROM dbo.content_reports
        WHERE track_id = @PublishedTrackId
          AND submitted_by_user_id = @ListenerId
          AND description = N'[SEED] Báo cáo metadata cần được kiểm tra.'
    )
        INSERT INTO dbo.content_reports
            (track_id, submitted_by_user_id, category, description, status, created_at, updated_at)
        VALUES
            (@PublishedTrackId, @ListenerId, 'INCORRECT_METADATA',
             N'[SEED] Báo cáo metadata cần được kiểm tra.', 'PENDING',
             DATEADD(HOUR, -5, @Now), @Now);

    IF NOT EXISTS (
        SELECT 1 FROM dbo.content_reports
        WHERE track_id = @TakenDownTrackId
          AND submitted_by_user_id = @ListenerId
          AND description = N'[SEED] Nội dung vi phạm bản quyền đã được xác nhận.'
    )
        INSERT INTO dbo.content_reports
            (track_id, submitted_by_user_id, handled_by_user_id, category, description,
             status, resolution_note, created_at, handled_at, updated_at)
        VALUES
            (@TakenDownTrackId, @ListenerId, @StaffId, 'COPYRIGHT',
             N'[SEED] Nội dung vi phạm bản quyền đã được xác nhận.', 'RESOLVED',
             N'Đã xác nhận vi phạm và gỡ bài hát.', DATEADD(DAY, -4, @Now),
             DATEADD(DAY, -3, @Now), @Now);

    IF NOT EXISTS (
        SELECT 1 FROM dbo.content_reports
        WHERE track_id = @PublishedTrackId
          AND submitted_by_user_id = @CreatorId
          AND description = N'[SEED] Báo cáo không có bằng chứng hợp lệ.'
    )
        INSERT INTO dbo.content_reports
            (track_id, submitted_by_user_id, handled_by_user_id, category, description,
             status, resolution_note, created_at, handled_at, updated_at)
        VALUES
            (@PublishedTrackId, @CreatorId, @StaffId, 'OTHER',
             N'[SEED] Báo cáo không có bằng chứng hợp lệ.', 'REJECTED',
             N'Không tìm thấy nội dung vi phạm.', DATEADD(DAY, -7, @Now),
             DATEADD(DAY, -6, @Now), @Now);

    /* Notification */
    IF NOT EXISTS (
        SELECT 1 FROM dbo.notifications
        WHERE user_id = @CreatorId AND title = N'[SEED] Bài hát đã được duyệt'
    )
        INSERT INTO dbo.notifications
            (user_id, type, title, message, action_url, read_at, created_at)
        VALUES
            (@CreatorId, 'TRACK_APPROVED', N'[SEED] Bài hát đã được duyệt',
             N'Sớm Mai Dịu Dàng đã được xuất bản.',
             N'/track/' + CONVERT(NVARCHAR(30), @PublishedTrackId), DATEADD(DAY, -10, @Now), DATEADD(DAY, -12, @Now));

    IF NOT EXISTS (
        SELECT 1 FROM dbo.notifications
        WHERE user_id = @CreatorId AND title = N'[SEED] Bài hát cần chỉnh sửa'
    )
        INSERT INTO dbo.notifications
            (user_id, type, title, message, action_url, created_at)
        VALUES
            (@CreatorId, 'TRACK_REJECTED', N'[SEED] Bài hát cần chỉnh sửa',
             N'Vũ Điệu Đêm Hè chưa đạt yêu cầu chất lượng.',
             N'/studio/tracks/' + CONVERT(NVARCHAR(30), @RejectedTrackId), DATEADD(DAY, -6, @Now));

    IF NOT EXISTS (
        SELECT 1 FROM dbo.notifications
        WHERE user_id = @ListenerId AND title = N'[SEED] Báo cáo đã được tiếp nhận'
    )
        INSERT INTO dbo.notifications
            (user_id, type, title, message, action_url, created_at)
        VALUES
            (@ListenerId, 'SYSTEM', N'[SEED] Báo cáo đã được tiếp nhận',
             N'Báo cáo nội dung của bạn đang chờ Staff xử lý.', N'/library/reports', DATEADD(HOUR, -4, @Now));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

/* Tóm tắt nhanh sau khi seed. */
SELECT u.email, r.code AS role_code, u.status, p.username, p.display_name
FROM dbo.app_users AS u
JOIN dbo.roles AS r ON r.id = u.role_id
LEFT JOIN dbo.user_profiles AS p ON p.user_id = u.id
WHERE u.email LIKE N'%.test@soundwave.local'
ORDER BY r.code, u.email;

SELECT publication_status, COUNT(*) AS track_count
FROM dbo.tracks
WHERE slug LIKE 'seed-%'
GROUP BY publication_status
ORDER BY publication_status;
GO
