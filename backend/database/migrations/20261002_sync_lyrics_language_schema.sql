USE soundwave;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* Đồng bộ dữ liệu nền để các khóa ngoại lyrics luôn có ngôn ngữ hợp lệ. */
    IF NOT EXISTS (SELECT 1 FROM dbo.lyric_languages WHERE code = 'vi')
        INSERT INTO dbo.lyric_languages (code, name) VALUES ('vi', N'Vietnamese');

    IF NOT EXISTS (SELECT 1 FROM dbo.lyric_languages WHERE code = 'en')
        INSERT INTO dbo.lyric_languages (code, name) VALUES ('en', N'English');

    IF NOT EXISTS (SELECT 1 FROM dbo.lyric_languages WHERE code = 'ja')
        INSERT INTO dbo.lyric_languages (code, name) VALUES ('ja', N'Japanese');

    /* Thêm language_id khi nâng cấp từ schema lyrics cũ. */
    IF COL_LENGTH('dbo.official_lyrics', 'language_id') IS NULL
        ALTER TABLE dbo.official_lyrics ADD language_id SMALLINT NULL;

    IF COL_LENGTH('dbo.personal_lyrics', 'language_id') IS NULL
        ALTER TABLE dbo.personal_lyrics ADD language_id SMALLINT NULL;

    /* Chuyển dữ liệu từ mã ngôn ngữ cũ sang bảng danh mục ngôn ngữ. */
    IF COL_LENGTH('dbo.official_lyrics', 'language_code') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            UPDATE lyric
            SET language_id = language.id
            FROM dbo.official_lyrics AS lyric
            JOIN dbo.lyric_languages AS language ON language.code = lyric.language_code
            WHERE lyric.language_id IS NULL;';
    END;

    IF COL_LENGTH('dbo.personal_lyrics', 'language_code') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            UPDATE lyric
            SET language_id = language.id
            FROM dbo.personal_lyrics AS lyric
            JOIN dbo.lyric_languages AS language ON language.code = lyric.language_code
            WHERE lyric.language_id IS NULL;';
    END;

    IF EXISTS (SELECT 1 FROM dbo.official_lyrics WHERE language_id IS NULL)
        THROW 51001, 'Cannot migrate official_lyrics because a language code is not registered.', 1;

    IF EXISTS (SELECT 1 FROM dbo.personal_lyrics WHERE language_id IS NULL)
        THROW 51002, 'Cannot migrate personal_lyrics because a language code is not registered.', 1;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.official_lyrics')
          AND name = 'language_id'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.official_lyrics ALTER COLUMN language_id SMALLINT NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.personal_lyrics')
          AND name = 'language_id'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.personal_lyrics ALTER COLUMN language_id SMALLINT NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_official_lyrics_languages')
        ALTER TABLE dbo.official_lyrics WITH CHECK
            ADD CONSTRAINT FK_official_lyrics_languages
            FOREIGN KEY (language_id) REFERENCES dbo.lyric_languages(id);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_personal_lyrics_languages')
        ALTER TABLE dbo.personal_lyrics WITH CHECK
            ADD CONSTRAINT FK_personal_lyrics_languages
            FOREIGN KEY (language_id) REFERENCES dbo.lyric_languages(id);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = 'UQ_official_lyrics_track_language'
          AND parent_object_id = OBJECT_ID('dbo.official_lyrics')
    )
        ALTER TABLE dbo.official_lyrics
            ADD CONSTRAINT UQ_official_lyrics_track_language UNIQUE (track_id, language_id);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = 'UQ_personal_lyrics_user_track_lang_type'
          AND parent_object_id = OBJECT_ID('dbo.personal_lyrics')
    )
        ALTER TABLE dbo.personal_lyrics
            ADD CONSTRAINT UQ_personal_lyrics_user_track_lang_type
            UNIQUE (user_id, track_id, language_id, lyric_type);

    /* Loại bỏ unique constraint và cột ngôn ngữ của schema cũ. */
    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = 'UQ_personal_lyrics_user_track_language'
          AND parent_object_id = OBJECT_ID('dbo.personal_lyrics')
    )
        ALTER TABLE dbo.personal_lyrics
            DROP CONSTRAINT UQ_personal_lyrics_user_track_language;

    IF COL_LENGTH('dbo.official_lyrics', 'language_code') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.official_lyrics DROP COLUMN language_code;';

    IF COL_LENGTH('dbo.personal_lyrics', 'language_code') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.personal_lyrics DROP COLUMN language_code;';

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.official_lyrics')
          AND name = 'IX_official_lyrics_public'
    )
        CREATE INDEX IX_official_lyrics_public
            ON dbo.official_lyrics(track_id, status, language_id);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.personal_lyrics')
          AND name = 'IX_personal_lyrics_user_track'
    )
        CREATE INDEX IX_personal_lyrics_user_track
            ON dbo.personal_lyrics(user_id, track_id);

    /* Đồng bộ nội dung role với schema chuẩn, không đổi id đang được tham chiếu. */
    UPDATE dbo.roles
    SET name = N'Listener',
        description = N'Standard user for streaming and managing personal library.'
    WHERE code = 'LISTENER';

    UPDATE dbo.roles
    SET name = N'Staff',
        description = N'Content moderation staff managing tracks, reports, and official lyrics.'
    WHERE code = 'STAFF';

    UPDATE dbo.roles
    SET name = N'Administrator',
        description = N'System administrator managing users, roles, genres, and platform analytics.'
    WHERE code = 'ADMIN';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

