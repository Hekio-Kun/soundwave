# SoundWave Entity Ownership

Tài liệu này quy định module duy nhất sở hữu mỗi bảng/entity. Thành viên không được tạo entity thứ hai ánh xạ cùng một bảng.

| Database table | Owning module | Entity |
| --- | --- | --- |
| `roles` | `authentication` | `Role` |
| `app_users` | `authentication` | `AppUser` |
| `user_profiles` | `authentication` | `UserProfile` |
| `email_verification_tokens` | `authentication` | `EmailVerificationToken` |
| `password_reset_tokens` | `authentication` | `PasswordResetToken` |
| `refresh_tokens` | `authentication` | `RefreshToken` |
| `genres` | `catalog` | `Genre` |
| `albums` | `catalog` | `Album` |
| `tracks` | `catalog` | `Track` |
| `favorites` | `library` | `Favorite` |
| `listening_history` | `library` | `ListeningHistory` |
| `playlists` | `library` | `Playlist` |
| `playlist_tracks` | `library` | `PlaylistTrack` |
| `track_submissions` | `moderation` | `TrackSubmission` |
| `content_reports` | `moderation` | `ContentReport` |
| `official_lyrics` | `lyrics` | `OfficialLyric` |
| `personal_lyrics` | `lyrics` | `PersonalLyric` |
| `notifications` | `notification` | `Notification` |

## Quy tắc sử dụng

- Mỗi bảng chỉ có đúng một `@Entity` trong module sở hữu.
- Module khác không tạo lại entity và không truy cập repository nội bộ của module sở hữu.
- Module khác lấy dữ liệu qua public service/facade và DTO.
- Khóa ngoại sang module khác được ánh xạ bằng trường ID, không tạo quan hệ JPA xuyên module.
- Quan hệ JPA chỉ được dùng giữa các entity thuộc cùng module khi thực sự cần.
- Playback và Administration không sở hữu bảng riêng; hai module này điều phối public service của các module sở hữu dữ liệu.
- Khi database schema thay đổi, cập nhật entity của module sở hữu và bảng này trong cùng pull request.
