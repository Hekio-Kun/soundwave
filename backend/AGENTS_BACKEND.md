# Quy ước phát triển Backend SoundWave

## 1. Phạm vi áp dụng

- File này áp dụng cho toàn bộ mã nguồn trong thư mục `backend/`.
- Công nghệ chính: Java 21, Spring Boot, Spring MVC, Spring Data JPA, SQL Server và Lombok.
- Backend được tổ chức theo modular monolith: chia theo module nghiệp vụ trước, sau đó chia layer bên trong từng module.
- Ưu tiên code dễ đọc, ngắn gọn, dễ kiểm thử và đúng trách nhiệm. Không rút gọn đến mức làm mất ý nghĩa nghiệp vụ.
- Không tự ý thay đổi yêu cầu nghiệp vụ khi RDS chưa rõ; ghi chú điểm chưa rõ và xác nhận trước khi triển khai.

## 2. Luồng xử lý bắt buộc

```text
HTTP Request
    ↓
Controller
    ↓ Request DTO
Service
    ↓
Repository
    ↓
Database

Entity  ←→  Mapper  ←→  Response DTO
```

Chiều phụ thuộc hợp lệ:

```text
Controller → Service → Repository
     ↓          ↓          ↓
    DTO       Mapper      Entity
```

Các chiều phụ thuộc bị cấm:

- Controller gọi trực tiếp Repository.
- Repository gọi Service hoặc Controller.
- Entity phụ thuộc Controller, DTO, Repository hoặc Service.
- Mapper gọi Repository, Service hoặc API bên ngoài.
- Module khác truy cập trực tiếp Repository nội bộ của một module.

## 3. Tổ chức package trong module

Mỗi module nghiệp vụ sử dụng cấu trúc cơ bản sau:

```text
module-name/
├── controller/
├── dto/
│   ├── request/
│   └── response/
├── entity/
├── exception/
├── mapper/
├── repository/
├── service/
├── specification/   # Chỉ tạo khi có truy vấn động
└── validation/      # Chỉ tạo khi có custom validator
```

- Không tạo package rỗng chỉ để đủ cấu trúc.
- Một entity chỉ có một module sở hữu.
- Module khác giao tiếp thông qua public service/facade hoặc domain event, không dùng Repository của nhau.
- Package và tên thư mục phải viết thường, đúng chính tả và không dùng từ viết tắt khó hiểu.

## 4. Quy tắc cho từng layer

### 4.1. Controller

Controller chỉ xử lý giao thức HTTP:

- Khai báo endpoint, path, query parameter và request body.
- Dùng `@Valid` để kích hoạt validation cho Request DTO.
- Lấy thông tin người dùng hiện tại từ security context khi cần.
- Gọi đúng một use case chính trong Service.
- Trả Response DTO cùng HTTP status phù hợp.

Controller không được:

- Inject hoặc gọi Repository.
- Chứa business logic, transaction hoặc truy vấn database.
- Tạo, cập nhật Entity trực tiếp.
- Bắt exception lặp lại bằng `try-catch` nếu exception có thể xử lý tập trung.
- Trả Entity trực tiếp ra API.

### 4.2. Request DTO và Response DTO

- Request DTO là hợp đồng dữ liệu nhận từ client.
- Response DTO chỉ chứa dữ liệu được phép trả về client.
- Không dùng chung Entity làm DTO.
- Không trả dữ liệu nhạy cảm như `passwordHash`, `tokenHash` hoặc thông tin nội bộ.
- Validation về định dạng đặt tại Request DTO bằng Bean Validation.
- Tách DTO theo use case khi dữ liệu create, update và response khác nhau.

### 4.3. Service

Service là nơi điều phối use case và chứa business logic:

- Kiểm tra sự tồn tại, quyền sở hữu, quyền thao tác và điều kiện nghiệp vụ.
- Điều phối nhiều Repository, Mapper hoặc public service của module khác.
- Quản lý transaction.
- Chuyển Entity sang Response DTO thông qua Mapper.
- Ném exception nghiệp vụ cụ thể khi use case thất bại.

Service không được:

- Phụ thuộc `HttpServletRequest`, `ResponseEntity` hoặc HTTP status nếu không có lý do kỹ thuật bắt buộc.
- Chứa annotation của Controller như `@RequestBody`, `@RequestParam`.
- Viết SQL hoặc thao tác kết nối database trực tiếp.
- Gọi ngược lại Controller.

Quy tắc transaction:

- Use case ghi dữ liệu dùng `@Transactional` ở public method của Service.
- Use case chỉ đọc dùng `@Transactional(readOnly = true)`.
- Không đặt transaction ở Controller.

### 4.4. Entity

- Entity ánh xạ dữ liệu JPA và bảo vệ trạng thái hợp lệ của chính nó.
- Có thể chứa hành vi nghiệp vụ gắn trực tiếp với entity, ví dụ `approve()`, `reject(reason)` hoặc `publish()`.
- Service điều phối use case; Entity bảo vệ invariant và chuyển trạng thái nội tại.
- Quan hệ JPA mặc định ưu tiên `LAZY` khi phù hợp để tránh tải dữ liệu không cần thiết.
- Enum lưu bằng `@Enumerated(EnumType.STRING)`.
- Không expose setter công khai cho mọi field nếu trạng thái cần được kiểm soát.
- Không gọi Repository, Service, HTTP API hoặc Cloudinary từ Entity.

### 4.5. Repository

- Repository chỉ chịu trách nhiệm đọc và ghi dữ liệu.
- Dùng Spring Data query method, JPQL, projection hoặc Specification tùy trường hợp.
- Truy vấn danh sách phải cân nhắc pagination và sorting.
- Tránh N+1 query; dùng fetch join hoặc entity graph khi thực sự cần.
- Repository không chứa quyết định nghiệp vụ, kiểm tra quyền, gửi email hoặc notification.

### 4.6. Mapper

- Mapper chỉ chuyển đổi Request DTO, Entity và Response DTO.
- Mapper phải là phép chuyển đổi thuần túy, không truy vấn database và không thay đổi trạng thái nghiệp vụ.
- Không đặt logic kiểm tra quyền hoặc business rule trong Mapper.

### 4.7. Specification

- Chỉ dùng cho điều kiện tìm kiếm, lọc và sắp xếp động.
- Không đặt logic phân quyền hoặc chuyển trạng thái nghiệp vụ trong Specification.

### 4.8. Config

- Chỉ chứa cấu hình kỹ thuật và khai báo Bean.
- Cấu hình dùng chung đặt tại package `config` hoặc package hạ tầng tương ứng.
- Chỉ tạo config trong module khi module thật sự có Bean hoặc thiết lập riêng.
- Không chứa business logic hoặc truy vấn database trong lớp Config.

### 4.9. Exception

- Dùng exception có tên và ý nghĩa nghiệp vụ rõ ràng; không dùng `RuntimeException` chung chung.
- Exception riêng của module đặt trong `module/exception`.
- `GlobalExceptionHandler` dùng `@RestControllerAdvice` để chuyển exception thành response thống nhất.
- Không để lộ stack trace, câu SQL, credential hoặc thông tin nội bộ cho client.
- Response lỗi tối thiểu gồm: `timestamp`, `status`, `code`, `message`, `path` và `fieldErrors` khi có lỗi validation.

### 4.10. Validation

- Validation cú pháp đặt ở Request DTO: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Positive`, `@Pattern`.
- Validation cần database hoặc ngữ cảnh nghiệp vụ đặt ở Service.
- Quy tắc bảo vệ trạng thái nội tại đặt trong Entity.
- Chỉ tạo custom annotation/validator khi Bean Validation có sẵn không đáp ứng được.
- Không tin các trường định danh người dùng do client gửi; ưu tiên lấy user ID từ security context.

## 5. Quy tắc sử dụng Lombok

Ưu tiên Lombok để giảm boilerplate nhưng không che giấu luồng nghiệp vụ:

- Ưu tiên constructor injection bằng `@RequiredArgsConstructor` và field `final`.
- Dùng `@Getter`, `@Builder`, `@Value`, `@NoArgsConstructor` và `@AllArgsConstructor` có chọn lọc.
- Entity JPA nên dùng `@Getter` và `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.
- Không dùng `@Data` cho Entity JPA vì tự sinh setter, `equals`, `hashCode` và `toString` có thể gây lỗi với quan hệ JPA.
- Không dùng `@Setter` ở cấp class cho Entity; chỉ cung cấp method thay đổi trạng thái có ý nghĩa nghiệp vụ.
- Loại trừ field nhạy cảm và quan hệ hai chiều khỏi `toString`.
- Cẩn thận khi dùng `@EqualsAndHashCode` với Entity; không đưa collection hoặc quan hệ lazy vào phép so sánh.

## 6. Comment và JavaDoc

- Method public thể hiện endpoint hoặc use case phải có JavaDoc tiếng Việt ngắn gọn mô tả chức năng chính.
- Method private có xử lý không hiển nhiên phải có comment tiếng Việt ngắn gọn.
- Không comment lại từng dòng code hoặc mô tả điều đã rõ từ tên method.
- Comment phải giải thích mục đích hoặc lý do, không dùng để che giấu code khó đọc.
- Getter, setter, constructor và method do Lombok sinh không cần comment.
- Khi code thay đổi, comment liên quan phải được cập nhật cùng lúc.

Ví dụ:

```java
/**
 * Tạo bài hát mới ở trạng thái bản nháp cho người dùng hiện tại.
 */
@Transactional
public TrackResponse createTrack(CreateTrackRequest request, Long userId) {
    // ...
}
```

## 7. Quy tắc code sạch

- Class và method chỉ nên có một trách nhiệm chính.
- Tên class, method và biến phải thể hiện rõ ý nghĩa nghiệp vụ bằng tiếng Anh.
- Không dùng tên mơ hồ như `data`, `obj`, `temp`, `processData` nếu có thể đặt tên cụ thể.
- Hạn chế method dài; tách private method khi một khối xử lý có ý nghĩa độc lập.
- Dùng early return để giảm lồng `if` khi phù hợp.
- Không để magic number hoặc magic string; dùng constant hoặc enum.
- Không copy-paste logic giữa các module.
- Không dùng `null` làm kết quả tìm kiếm khi có thể dùng `Optional` ở Repository.
- Không dùng `System.out.println`; dùng SLF4J và log đúng mức `debug`, `info`, `warn`, `error`.
- Không log password, token, credential, dữ liệu riêng tư hoặc URL có chữ ký.
- Không bắt `Exception` chung nếu có thể xử lý bằng exception cụ thể.
- Không bỏ trống catch block.

## 8. Quy ước API

- Endpoint dùng danh từ số nhiều và kebab-case khi có nhiều từ, ví dụ `/api/v1/tracks`.
- HTTP method phải đúng mục đích: GET đọc, POST tạo, PUT/PATCH cập nhật, DELETE xóa.
- Dùng HTTP status nhất quán: 200, 201, 204, 400, 401, 403, 404, 409 và 500.
- API danh sách phải cân nhắc pagination; không trả toàn bộ bảng không giới hạn.
- Format response và error phải nhất quán giữa các module.
- Không trả stack trace hoặc message từ database ra client.

## 9. Database và JPA

- Tên bảng và cột dùng `snake_case`, tên class và field Java dùng `PascalCase`/`camelCase`.
- Không lưu secret trong `application.properties` hoặc commit secret vào Git.
- Dùng biến môi trường cho URL, username và password database.
- Môi trường production không dùng `ddl-auto=create`, `create-drop` hoặc `update`.
- Ưu tiên migration bằng Flyway khi bắt đầu quản lý schema chính thức; production dùng `ddl-auto=validate`.
- Thời gian lưu trong database phải thống nhất theo UTC; chỉ chuyển múi giờ tại biên hiển thị.
- Trường tạo/cập nhật nên được quản lý nhất quán bằng JPA Auditing hoặc cơ chế chung.
- Xóa mềm phải được xử lý nhất quán với trường `deleted_at` nếu entity có hỗ trợ.
- Index, unique constraint và foreign key phải được định nghĩa ở database, không chỉ kiểm tra bằng code.
- Khi chạy local có thể dùng `trustServerCertificate=true`; production phải dùng chứng chỉ tin cậy và không bỏ qua xác thực certificate.

Các biến môi trường cần thiết:

```text
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=soundwave;encrypt=true;trustServerCertificate=true
DB_USERNAME=sa
DB_PASSWORD=<mật khẩu SQL Server>
JPA_DDL_AUTO=validate
```

## 10. Bảo mật

- Password phải được hash bằng thuật toán phù hợp, không lưu hoặc log plaintext.
- JWT secret, email credential và Cloudinary secret phải lấy từ biến môi trường hoặc secret manager.
- Kiểm tra authorization trong Service hoặc method security, không chỉ ẩn nút ở frontend.
- Không nhận `ownerUserId`, `uploaderUserId` hoặc `createdByUserId` từ client khi có thể lấy từ người đăng nhập.
- Validate loại file, dung lượng và quyền truy cập trước khi lưu metadata upload.
- CORS phải giới hạn origin theo môi trường, không dùng wildcard với credential trong production.

## 11. Kiểm thử

- Service: unit test cho business rule, trạng thái và exception.
- Controller: web slice test cho request validation, HTTP status và response format.
- Repository: integration test cho query phức tạp.
- Luồng quan trọng: integration test từ Controller đến database test.
- Test phải bao gồm cả happy path, validation failure, not found, conflict và forbidden.
- Không phụ thuộc database production hoặc credential thật trong test.

## 12. Definition of Done

Một chức năng backend chỉ được xem là hoàn thành khi:

- Đúng flow Controller → Service → Repository.
- Không để lộ Entity ra API.
- Có validation đầu vào và exception phù hợp.
- Transaction được đặt đúng tại Service.
- Có comment/JavaDoc tiếng Việt theo quy ước.
- Không có secret hard-code và không log dữ liệu nhạy cảm.
- Có test tương xứng với rủi ro của chức năng.
- Compile và test liên quan chạy thành công.
- Không phát sinh warning nghiêm trọng, N+1 rõ ràng hoặc query danh sách không giới hạn.

