package org.example.soundwavebackend.catalog.entity;

/**
 * ===================================================================================================
 * [TRACK LIFECYCLE - OOP STATE PATTERN]
 * Enum định nghĩa các trạng thái trong toàn bộ vòng đời phát hành (Publication Lifecycle) của một bài hát (Track).
 *
 * <h3>Nguyên lý thiết kế hướng đối tượng (OOP Design):</h3>
 * <ul>
 *   <li><b>State Machine Representation:</b> Đại diện cho các trạng thái rời rạc và hợp lệ của một Track Entity.
 *       Mỗi trạng thái quyết định hành vi, quyền hạn thao tác (Read/Write/Delete) và khả năng hiển thị của bài hát.</li>
 *   <li><b>Encapsulation & Data Invariants:</b> Phối hợp cùng Entity {@link Track} để bảo vệ tính toàn vẹn trạng thái,
 *       ngăn chặn việc bài hát bị thay đổi dữ liệu bất hợp lệ khi đang trong hàng đợi xét duyệt hoặc đã phát hành.</li>
 * </ul>
 *
 * <h3>Sơ đồ chuyển đổi trạng thái vòng đời (State Transition Flow):</h3>
 * <pre>
 *   [Upload Track]
 *          |
 *          v
 *      +---------+       submitForReview()      +-----------+
 *      |  DRAFT  | ---------------------------> |  PENDING  |
 *      +---------+                              +-----------+
 *        ^     ^                                  |       |
 *        |     |         cancelSubmission()       |       |
 *        |     +----------------------------------+       |
 *        |                                                |
 *        | (Chỉnh sửa lại)        reject()                | approve()
 *        +-----------------------------------+            |
 *        |                                   |            v
 *  +------------+                            |     +-------------+
 *  |  REJECTED  | <--------------------------+     |  PUBLISHED  |
 *  +------------+                                  +-------------+
 *                                                         |
 *                                                         | takeDown()
 *                                                         v
 *                                                  +-------------+
 *                                                  | TAKEN_DOWN  |
 *                                                  +-------------+
 * </pre>
 * ===================================================================================================
 */
public enum TrackPublicationStatus {

    /**
     * [GIAI ĐOẠN 1: BẢN NHÁP - DRAFT]
     * Trạng thái khởi tạo mặc định ngay sau khi Creator thực hiện chức năng "Upload Track".
     * <ul>
     *   <li><b>Quyền hạn:</b> Cho phép Creator chỉnh sửa toàn diện (Metadata, file audio, file ảnh cover) hoặc xóa bỏ.</li>
     *   <li><b>Phạm vi hiển thị:</b> Chỉ hiển thị trong trang Content Studio riêng của Creator; hoàn toàn ẩn khỏi Catalog công chúng.</li>
     * </ul>
     */
    DRAFT,

    /**
     * [GIAI ĐOẠN 2: CHỜ DUYỆT - PENDING]
     * Trạng thái khi Creator chủ động nộp bài hát (Submit for Review) vào hàng đợi kiểm duyệt của Staff.
     * <ul>
     *   <li><b>Quyền hạn:</b> Bị khóa chỉnh sửa nội dung để bảo đảm tính toàn vẹn trong quá trình Staff đánh giá.</li>
     *   <li><b>Thao tác khả dụng:</b> Creator có thể rút lại bản nộp (Withdraw/Cancel Submission) để quay về trạng thái DRAFT.</li>
     *   <li><b>Phạm vi hiển thị:</b> Hiển thị trong hàng đợi Moderation Queue của Staff; chưa xuất hiện ở Catalog công chúng.</li>
     * </ul>
     */
    PENDING,

    /**
     * [GIAI ĐOẠN 3A: ĐÃ PHÁT HÀNH - PUBLISHED]
     * Trạng thái đạt được sau khi Nhân viên kiểm duyệt (Staff) phê duyệt (Approve) bản nộp của bài hát.
     * <ul>
     *   <li><b>Quyền hạn:</b> Bài hát chính thức có hiệu lực trên toàn hệ thống. Tự động kích hoạt phát hành Album tương ứng nếu là Draft.</li>
     *   <li><b>Phạm vi hiển thị:</b> Hiển thị công khai trong toàn bộ Catalog, bảng xếp hạng, tìm kiếm, phát nhạc trực tuyến.</li>
     *   <li><b>Thông báo:</b> Hệ thống tự động gửi Email và In-app Notification chúc mừng đến Creator.</li>
     * </ul>
     */
    PUBLISHED,

    /**
     * [GIAI ĐOẠN 3B: BỊ TỪ CHỐI - REJECTED]
     * Trạng thái khi Staff từ chối (Reject) bản nộp do không đáp ứng tiêu chuẩn cộng đồng hoặc vi phạm bản quyền/chất lượng.
     * <ul>
     *   <li><b>Quyền hạn:</b> Cho phép Creator xem chi tiết lý do từ chối (latestRejectionReason) cùng ghi chú của Reviewer,
     *       cho phép chỉnh sửa lại thông tin/media hoặc xóa bỏ bài hát.</li>
     *   <li><b>Phạm vi hiển thị:</b> Chỉ hiển thị trong Studio của Creator cùng thông báo lý do; không xuất hiện ở Catalog công chúng.</li>
     *   <li><b>Thông báo:</b> Hệ thống tự động gửi Email và In-app Notification thông báo từ chối kèm lý do cho Creator.</li>
     * </ul>
     */
    REJECTED,

    /**
     * [GIAI ĐOẠN 4: GỠ BỎ KHẨN CẤP - TAKEN_DOWN]
     * Trạng thái xử lý vi phạm áp dụng cho các bài hát đã từng PUBLISHED nhưng bị phát hiện vi phạm bản quyền, pháp lý hoặc báo cáo xấu.
     * <ul>
     *   <li><b>Quyền hạn:</b> Ngay lập tức thu hồi bài hát khỏi Catalog công chúng, ngắt phát nhạc trực tuyến; lưu trữ lý do gỡ bài.</li>
     *   <li><b>Phạm vi hiển thị:</b> Creator nhận được thông báo giải trình trong Studio; Creator có quyền chỉnh sửa để nộp lại hoặc xóa vĩnh viễn.</li>
     *   <li><b>Thông báo:</b> Hệ thống tự động gửi Email và In-app Notification cảnh báo gỡ bài đến Creator.</li>
     * </ul>
     */
    TAKEN_DOWN
}

