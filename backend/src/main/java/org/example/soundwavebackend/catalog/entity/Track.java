package org.example.soundwavebackend.catalog.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * ===================================================================================================
 * [CORE DOMAIN ENTITY - OOP RICH DOMAIN MODEL]
 * Thực thể biểu diễn một bài hát (Track) trong hệ thống âm nhạc SoundWave.
 *
 * <h3>Các nguyên lý thiết kế hướng đối tượng (OOP Principles áp dụng):</h3>
 * <ul>
 *   <li><b>Encapsulation (Đóng gói):</b> Toàn bộ thuộc tính nội tại (fields) đều được khai báo {@code private}.
 *       Tuyệt đối không sử dụng các setter tự do làm phá vỡ tính toàn vẹn dữ liệu (Anemic Model).
 *       Mọi sự thay đổi về trạng thái hoặc dữ liệu bắt buộc phải thông qua các phương thức nghiệp vụ (Business Methods)
 *       có kiểm tra điều kiện ràng buộc (Invariants).</li>
 *   <li><b>Information Expert (Chuyên gia thông tin - GRASP):</b> Entity {@code Track} nắm giữ thông tin về
 *       trạng thái xuất bản ({@link #publicationStatus}). Do đó, chính đối tượng này là chuyên gia tự quyết định
 *       liệu bản thân có được phép chỉnh sửa ({@link #isEditable()}), xóa ({@link #isDeletable()}), hay nộp duyệt
 *       ({@link #submitForReview(LocalDateTime)}).</li>
 *   <li><b>State Pattern / Lifecycle Management:</b> Quản lý nghiêm ngặt sự biến thiên trạng thái bài hát từ lúc
 *       mới tải lên (Upload Track) cho đến khi phát hành ra công chúng hoặc xử lý vi phạm bản quyền (Track Lifecycle).</li>
 * </ul>
 *
 * <h3>Vai trò trong 2 chức năng chính:</h3>
 * <ol>
 *   <li><b>Upload Track (Tải lên bài hát):</b> Khởi tạo đối tượng với dữ liệu Media từ Cloudinary (audio, cover),
 *       thể loại (Genre), Album liên kết, sinh slug duy nhất, gán trạng thái ban đầu là {@link TrackPublicationStatus#DRAFT}.</li>
 *   <li><b>Track Lifecycle (Vòng đời bài hát):</b> Điều phối và lưu vết trạng thái duyệt:
 *       DRAFT (nháp) -> PENDING (chờ duyệt) -> PUBLISHED (phát hành) / REJECTED (từ chối) -> TAKEN_DOWN (gỡ bài).</li>
 * </ol>
 * ===================================================================================================
 */
@Getter
@Entity
@Table(name = "tracks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Track {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID của người dùng (Creator / Listener) tải bài hát lên. */
    @Column(name = "uploader_user_id", nullable = false)
    private Long uploaderUserId;

    /** Quan hệ liên kết Nhiều-Một (Many-to-One) với Album (nếu bài hát thuộc về một Album). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id")
    private Album album;

    /** Quan hệ liên kết Nhiều-Một (Many-to-One) với Thể loại nhạc (Genre). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "genre_id", nullable = false)
    private Genre genre;

    /** Tên tiêu đề bài hát. */
    @Column(nullable = false, length = 200)
    private String title;

    /** Đường dẫn thân thiện (SEO slug), duy nhất trên toàn hệ thống. */
    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    /** Mô tả chi tiết hoặc thông điệp bài hát. */
    @Column(length = 2000)
    private String description;

    /** Thứ tự bài hát trong Album. */
    @Column(name = "track_number")
    private Short trackNumber;

    /** Trạng thái vòng đời xuất bản của bài hát (DRAFT, PENDING, PUBLISHED, REJECTED, TAKEN_DOWN). */
    @Enumerated(EnumType.STRING)
    @Column(name = "publication_status", nullable = false, length = 30)
    private TrackPublicationStatus publicationStatus;

    /** Thời điểm bài hát được Staff phê duyệt xuất bản chính thức. */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /** Lý do từ chối hoặc gỡ bài gần nhất do Staff ghi nhận. */
    @Column(name = "latest_rejection_reason", length = 1000)
    private String latestRejectionReason;

    /** Định danh tệp âm thanh trên dịch vụ lưu trữ Cloudinary. */
    @Column(name = "audio_public_id", nullable = false, length = 255)
    private String audioPublicId;

    /** Đường dẫn HTTPS phát trực tuyến tệp âm thanh. */
    @Column(name = "audio_url", nullable = false, length = 2048)
    private String audioUrl;

    /** Định dạng file âm thanh (mp3, wav, flac, v.v.). */
    @Column(name = "audio_format", nullable = false, length = 20)
    private String audioFormat;

    /** Thời lượng bài hát tính theo mili-giây (ms). */
    @Column(name = "duration_ms", nullable = false)
    private Integer durationMs;

    /** Định danh ảnh bìa trên Cloudinary (nếu có). */
    @Column(name = "cover_public_id", length = 255)
    private String coverPublicId;

    /** Đường dẫn HTTPS ảnh bìa bài hát. */
    @Column(name = "cover_url", length = 2048)
    private String coverUrl;

    /** Bộ đếm số lượt nghe bài hát (caching count). */
    @Column(name = "play_count_cache", nullable = false)
    private long playCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * [UPLOAD TRACK - CONSTRUCTOR ĐƠN GIẢN]
     * Khởi tạo bài hát mới ở giai đoạn Upload cơ bản không kèm Album và Ảnh bìa.
     * Mặc định đưa bài hát vào trạng thái {@link TrackPublicationStatus#DRAFT} và lượt nghe = 0.
     *
     * @param uploaderUserId ID tài khoản tải lên
     * @param genre          Thể loại nhạc
     * @param title          Tiêu đề bài hát
     * @param slug           Slug định danh duy nhất
     * @param audioPublicId  Public ID của file âm thanh trên Cloudinary
     * @param audioUrl       Đường dẫn streaming file âm thanh
     * @param audioFormat    Định dạng tệp âm thanh (mp3, wav...)
     * @param durationMs     Thời lượng tệp âm thanh (ms)
     */
    public Track(Long uploaderUserId, Genre genre, String title, String slug, String audioPublicId,
                 String audioUrl, String audioFormat, Integer durationMs) {
        this.uploaderUserId = uploaderUserId;
        this.genre = genre;
        this.title = title;
        this.slug = slug;
        this.audioPublicId = audioPublicId;
        this.audioUrl = audioUrl;
        this.audioFormat = audioFormat;
        this.durationMs = durationMs;
        this.publicationStatus = TrackPublicationStatus.DRAFT;
        this.playCount = 0;
    }

    /**
     * [UPLOAD TRACK - CONSTRUCTOR ĐẦY ĐỦ]
     * Khởi tạo bài hát mới đầy đủ metadata, album và hình ảnh bìa trong quá trình Upload.
     * Mặc định thiết lập trạng thái ban đầu của vòng đời là {@link TrackPublicationStatus#DRAFT}.
     *
     * @param uploaderUserId ID tài khoản tải lên
     * @param genre          Thể loại nhạc
     * @param album          Album liên kết (có thể null nếu là đĩa đơn / single)
     * @param title          Tiêu đề bài hát
     * @param slug           Slug định danh duy nhất
     * @param description    Mô tả bài hát
     * @param trackNumber    Số thứ tự bài trong Album
     * @param audioPublicId  Public ID file âm thanh trên Cloudinary
     * @param audioUrl       Đường dẫn streaming âm thanh
     * @param audioFormat    Định dạng file âm thanh
     * @param durationMs     Thời lượng âm thanh (ms)
     * @param coverPublicId  Public ID file ảnh bìa trên Cloudinary
     * @param coverUrl       Đường dẫn ảnh bìa
     */
    public Track(Long uploaderUserId, Genre genre, Album album, String title, String slug,
                 String description, Short trackNumber, String audioPublicId, String audioUrl,
                 String audioFormat, Integer durationMs, String coverPublicId, String coverUrl) {
        this.uploaderUserId = uploaderUserId;
        this.genre = genre;
        this.album = album;
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.trackNumber = trackNumber;
        this.audioPublicId = audioPublicId;
        this.audioUrl = audioUrl;
        this.audioFormat = audioFormat;
        this.durationMs = durationMs != null ? durationMs : 0;
        this.coverPublicId = coverPublicId;
        this.coverUrl = coverUrl;
        this.publicationStatus = TrackPublicationStatus.DRAFT;
        this.playCount = 0;
    }

    /**
     * [TRACK LIFECYCLE - INFORMATION EXPERT BUSINESS RULE]
     * Kiểm tra điều kiện cho phép chỉnh sửa bài hát.
     * <p>
     * Theo quy tắc nghiệp vụ: Chỉ những bài hát đang ở trạng thái {@code DRAFT} (bản nháp),
     * {@code REJECTED} (bị từ chối cần sửa lại) hoặc {@code TAKEN_DOWN} (bị gỡ bài vi phạm)
     * mới được phép sửa đổi. Những bài đang {@code PENDING} (chờ duyệt) hoặc {@code PUBLISHED}
     * bị khóa chỉnh sửa để đảm bảo tính toàn vẹn dữ liệu.
     * </p>
     *
     * @return {@code true} nếu bài hát được phép chỉnh sửa, ngược lại {@code false}
     */
    public boolean isEditable() {
        return publicationStatus == TrackPublicationStatus.DRAFT
                || publicationStatus == TrackPublicationStatus.REJECTED
                || publicationStatus == TrackPublicationStatus.TAKEN_DOWN;
    }

    /**
     * [TRACK LIFECYCLE - INFORMATION EXPERT BUSINESS RULE]
     * Kiểm tra điều kiện cho phép xóa bài hát khỏi hệ thống.
     * <p>
     * Theo quy tắc nghiệp vụ: Chỉ cho phép xóa các bài hát ở trạng thái {@code DRAFT},
     * {@code REJECTED} hoặc {@code TAKEN_DOWN}. Không cho phép xóa bài đang nằm trong hàng đợi duyệt
     * hoặc đang phát hành công khai mà chưa qua quy trình gỡ bài.
     * </p>
     *
     * @return {@code true} nếu bài hát được phép xóa, ngược lại {@code false}
     */
    public boolean isDeletable() {
        return publicationStatus == TrackPublicationStatus.DRAFT
                || publicationStatus == TrackPublicationStatus.REJECTED
                || publicationStatus == TrackPublicationStatus.TAKEN_DOWN;
    }

    /**
     * [TRACK LIFECYCLE / UPLOAD - CẬP NHẬT THÔNG TIN BẢN NHÁP]
     * Cập nhật thông tin chi tiết bài hát cùng các tệp phương tiện (audio/ảnh mới nếu có).
     * Áp dụng nguyên lý Encapsulation để đảm bảo chỉ cập nhật các trường hợp lệ và ghi nhận mốc thời gian {@code updatedAt}.
     *
     * @param title         Tiêu đề mới
     * @param slug          Slug mới tương ứng với tiêu đề
     * @param genre         Thể loại nhạc mới
     * @param album         Album mới (hoặc null)
     * @param description   Mô tả mới
     * @param trackNumber   Thứ tự mới trong Album
     * @param audioPublicId Public ID tệp âm thanh mới (nếu có thay thế)
     * @param audioUrl      URL tệp âm thanh mới
     * @param audioFormat   Định dạng tệp âm thanh mới
     * @param durationMs    Thời lượng tệp âm thanh mới
     * @param coverPublicId Public ID ảnh bìa mới (nếu có thay thế)
     * @param coverUrl      URL ảnh bìa mới
     * @param updatedAt     Thời điểm cập nhật
     */
    public void updateDraftDetails(String title, String slug, Genre genre, Album album,
                                   String description, Short trackNumber,
                                   String audioPublicId, String audioUrl, String audioFormat, Integer durationMs,
                                   String coverPublicId, String coverUrl, LocalDateTime updatedAt) {
        this.title = title;
        this.slug = slug;
        this.genre = genre;
        this.album = album;
        this.description = description;
        this.trackNumber = trackNumber;
        if (audioUrl != null && !audioUrl.isBlank()) {
            this.audioPublicId = audioPublicId != null ? audioPublicId : this.audioPublicId;
            this.audioUrl = audioUrl;
            this.audioFormat = audioFormat != null ? audioFormat : this.audioFormat;
            this.durationMs = durationMs != null ? durationMs : this.durationMs;
        }
        if (coverUrl != null && !coverUrl.isBlank()) {
            this.coverPublicId = coverPublicId != null ? coverPublicId : this.coverPublicId;
            this.coverUrl = coverUrl;
        }
        this.updatedAt = updatedAt;
    }

    /**
     * [TRACK LIFECYCLE - CHUYỂN TRẠNG THÁI NỘP DUYỆT (SUBMIT FOR REVIEW)]
     * Chuyển trạng thái bài hát từ {@code DRAFT} hoặc {@code REJECTED} sang {@link TrackPublicationStatus#PENDING}.
     * Đồng thời tự động xóa lý do từ chối cũ (nếu có từ lần nộp trước) để bắt đầu chu trình đánh giá mới.
     *
     * @param submittedAt Thời điểm người dùng thực hiện nộp bài hát
     */
    public void submitForReview(LocalDateTime submittedAt) {
        this.publicationStatus = TrackPublicationStatus.PENDING;
        this.latestRejectionReason = null;
        this.updatedAt = submittedAt;
    }

    /**
     * [BUSINESS METHOD - GÁN ALBUM VÀ THỨ TỰ BÀI HÁT]
     * Thiết lập quan hệ liên kết bài hát vào một Album cụ thể.
     *
     * @param album       Album được gán
     * @param trackNumber Thứ tự trong Album
     * @param updatedAt   Thời điểm cập nhật
     */
    public void assignAlbum(Album album, Short trackNumber, LocalDateTime updatedAt) {
        this.album = album;
        this.trackNumber = trackNumber;
        this.updatedAt = updatedAt;
    }

    /**
     * [TRACK LIFECYCLE - CẬP NHẬT KẾT QUẢ KIỂM DUYỆT (MODERATION STATUS TRANSITION)]
     * Cập nhật trạng thái xuất bản mới của bài hát theo quyết định của Staff hoặc hệ thống:
     * <ul>
     *   <li>{@link TrackPublicationStatus#PUBLISHED}: Được duyệt -> Ghi nhận mốc thời gian {@code approvedAt}.</li>
     *   <li>{@link TrackPublicationStatus#REJECTED}: Bị từ chối -> Lưu trữ {@code rejectionReason}.</li>
     *   <li>{@link TrackPublicationStatus#TAKEN_DOWN}: Bị gỡ bỏ -> Lưu trữ {@code rejectionReason}.</li>
     * </ul>
     *
     * @param status          Trạng thái xuất bản đích
     * @param rejectionReason Lý do từ chối hoặc lý do gỡ bài (nếu có)
     * @param changedAt       Thời điểm quyết định kiểm duyệt có hiệu lực
     */
    public void updatePublicationStatus(TrackPublicationStatus status, String rejectionReason,
                                        LocalDateTime changedAt) {
        publicationStatus = status;
        latestRejectionReason = rejectionReason;
        approvedAt = status == TrackPublicationStatus.PUBLISHED ? changedAt : approvedAt;
        updatedAt = changedAt;
    }

    /**
     * [BUSINESS METHOD - CẬP NHẬT METADATA CƠ BẢN]
     * Cập nhật tiêu đề, mô tả và ảnh bìa bài hát.
     *
     * @param title         Tiêu đề mới
     * @param description   Mô tả mới
     * @param coverPublicId Public ID ảnh bìa mới
     * @param coverUrl      URL ảnh bìa mới
     * @param updatedAt     Thời điểm cập nhật
     */
    public void updateMetadata(String title, String description, String coverPublicId, String coverUrl, LocalDateTime updatedAt) {
        this.title = title;
        this.description = description;
        this.coverPublicId = coverPublicId;
        this.coverUrl = coverUrl;
        this.updatedAt = updatedAt;
    }

    /**
     * [BUSINESS METHOD - TĂNG LƯỢT NGHE]
     * Tăng số lượt nghe tích lũy của bài hát thêm 1 đơn vị.
     */
    public void incrementPlayCount() {
        playCount++;
    }

    /**
     * Tự động khởi tạo thời gian tạo (createdAt) và cập nhật (updatedAt) theo chuẩn UTC trước khi persist vào DB.
     */
    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
