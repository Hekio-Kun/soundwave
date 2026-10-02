# MagiSound - Use Case Descriptions

This document is written for Section **II.5.2.2 - Use Case Descriptions** of the SWD392 Course Project Report.

> Replace `[Member name]` and `[dd/mm/yyyy]` before submitting the report.

## A. Use Case Summary

| ID | Use Case | Actors | Use Case Description |
|---|---|---|---|
| UC-01 | Register Account | Guest | Creates a new MagiSound account with an email address and password. |
| UC-02 | Verify Email | Guest, Email Service | Verifies the registered email address and activates the account. |
| UC-03 | Login | Guest, Staff, Admin | Authenticates an account and starts a session with the appropriate role. |
| UC-04 | Reset Forgotten Password | Guest, Email Service | Resets a forgotten password through a time-limited email link. |
| UC-05 | Browse Music Catalog | Guest, User | Displays approved public tracks and albums. |
| UC-06 | Search and Filter Music | Guest, User | Searches tracks, albums, and uploaders and filters results by genre. |
| UC-07 | Play Public Music | Guest, User | Streams an approved public track and provides playback controls. |
| UC-08 | Manage Personal Profile | User | Views and updates the authenticated user's personal profile. |
| UC-09 | Manage Favorites | User | Views, adds, and removes favorite tracks. |
| UC-10 | Manage Playlists | User | Creates, views, updates, deletes playlists, and manages their tracks. |
| UC-11 | View Lyrics | User | Displays the read-only lyrics available for a track. |
| UC-12 | Submit Content Report | User | Reports a public track that may violate content rules. |
| UC-13 | Logout | User, Staff, Admin | Ends the current authenticated session. |
| UC-14 | Upload Track for Review | User | Uploads a track and its metadata as a pending review submission. |
| UC-15 | View Track Review Result | User | Shows the review status and rejection reason for the user's submission. |
| UC-16 | Manage My Albums | User | Creates, views, updates, deletes albums, and organizes the user's tracks. |
| UC-17 | Review Pending Track | Staff | Examines the metadata and audio of a pending track. |
| UC-18 | Approve Track | Staff | Approves a reviewed track and makes it publicly available. |
| UC-19 | Reject Track | Staff | Rejects a reviewed track that does not satisfy content requirements. |
| UC-20 | Enter Rejection Reason | Staff | Records the mandatory reason for rejecting a track. |
| UC-21 | Review Content Report | Staff | Examines a submitted report and the reported track. |
| UC-22 | Resolve Content Report | Staff | Records the final decision and closes a reviewed report. |
| UC-23 | Remove Violating Track | Staff | Removes a confirmed violating track from the public catalog. |
| UC-24 | Manage User Accounts | Admin | Views, locks, and unlocks user accounts. |
| UC-25 | Assign User Roles | Admin | Assigns an authorized role to a selected account. |
| UC-26 | Manage Genres | Admin | Creates, views, updates, and deletes eligible music genres. |
| UC-27 | View System Statistics | Admin | Displays basic statistics about accounts, tracks, and listening activity. |

## B. Detailed Use Case Descriptions

## UC-01 - Register Account

| Field | Content |
|---|---|
| UC ID and Name | UC-01 - Register Account |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest |
| Secondary Actors | None |
| Trigger | The Guest selects **Register**. |
| Description | The Guest creates a MagiSound account. The account is stored in a pending-verification state until its email address is verified. |
| Preconditions | PRE-1: The Guest is not authenticated. PRE-2: The Guest has access to a valid email address. |
| Postconditions | POST-1: A new pending account is stored. POST-2: A verification request is created for the registered email address. |
| Normal Flow | 1.0.1 The Guest opens the registration page. 1.0.2 The system displays the registration form. 1.0.3 The Guest enters the required information and submits the form. 1.0.4 The system validates the information. 1.0.5 The system creates a pending account and prepares an email verification request. 1.0.6 The system informs the Guest to verify the email address. |
| Alternative Flows | 1.1 The Guest cancels registration; the system returns to the previous page without creating an account. |
| Exceptions | 1.0.E1 The email is already registered; the system rejects the request and displays an error. 1.0.E2 The input is invalid; the system identifies the invalid fields. 1.0.E3 The verification email cannot be sent; the account remains pending and the system allows the email to be resent later. |
| Priority | High - Must Have |
| Frequency of Use | Several times per day. |
| Business Rules | BR-01, BR-02, BR-03 |
| Other Information | Passwords must never be stored as plain text. Account creation must be rolled back if the account record cannot be saved. |
| Assumptions | The Guest provides truthful and accessible registration information. |

## UC-02 - Verify Email

| Field | Content |
|---|---|
| UC ID and Name | UC-02 - Verify Email |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest |
| Secondary Actors | Email Service |
| Trigger | The Guest opens the verification link received by email. |
| Description | The system validates the verification token and activates the corresponding pending account. |
| Preconditions | PRE-1: A pending account exists. PRE-2: A verification token has been issued for the account. |
| Postconditions | POST-1: The account email is marked as verified. POST-2: The account becomes eligible to log in. POST-3: The token is marked as used. |
| Normal Flow | 2.0.1 The Email Service delivers the verification message. 2.0.2 The Guest opens the verification link. 2.0.3 The system validates the token. 2.0.4 The system activates the account and invalidates the token. 2.0.5 The system displays a successful verification message. |
| Alternative Flows | 2.1 If the account is already verified, the system displays that no further verification is required. 2.2 The Guest requests a new verification email; the system invalidates the previous active token and issues a new one. |
| Exceptions | 2.0.E1 The token is invalid, expired, or already used; the system refuses activation and provides a resend option. 2.0.E2 The account no longer exists; the system displays an invalid request message. |
| Priority | High - Must Have |
| Frequency of Use | Once for each newly registered account, with occasional retries. |
| Business Rules | BR-03, BR-04 |
| Other Information | Token validation and account activation must be completed consistently in one transaction. |
| Assumptions | The Guest can access the registered email inbox. |

## UC-03 - Login

| Field | Content |
|---|---|
| UC ID and Name | UC-03 - Login |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest, Staff, or Admin before authentication |
| Secondary Actors | None |
| Trigger | The actor submits the login form. |
| Description | The system authenticates the account and grants access according to its active role. |
| Preconditions | PRE-1: The actor is not authenticated. PRE-2: A registered account exists. |
| Postconditions | POST-1: A valid authenticated session is established. POST-2: The actor is redirected to an authorized page. |
| Normal Flow | 3.0.1 The actor opens the login page. 3.0.2 The actor enters an email address and password. 3.0.3 The system validates the credentials and account status. 3.0.4 The system creates an authenticated session. 3.0.5 The system redirects the actor based on the assigned role. |
| Alternative Flows | 3.1 The actor selects **Forgot Password**; the system starts UC-04. |
| Exceptions | 3.0.E1 The credentials are incorrect; the system displays a generic authentication error. 3.0.E2 The email is not verified; the system denies access and offers to resend verification. 3.0.E3 The account is locked; the system denies access and displays the account status. |
| Priority | High - Must Have |
| Frequency of Use | Many times per day. |
| Business Rules | BR-03, BR-05, BR-06 |
| Other Information | Authentication errors must not reveal whether a specific email address exists. |
| Assumptions | The actor remembers valid credentials or can access the reset-password function. |

## UC-04 - Reset Forgotten Password

| Field | Content |
|---|---|
| UC ID and Name | UC-04 - Reset Forgotten Password |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest |
| Secondary Actors | Email Service |
| Trigger | The Guest selects **Forgot Password**. |
| Description | The Guest requests a reset link and sets a new password using a valid, time-limited token. |
| Preconditions | PRE-1: The Guest is not authenticated. PRE-2: A registered account exists for the supplied email address. |
| Postconditions | POST-1: The password is replaced with a securely encoded new password. POST-2: The reset token is marked as used. |
| Normal Flow | 4.0.1 The Guest enters the registered email address. 4.0.2 The system creates a reset token and asks the Email Service to send the reset link. 4.0.3 The Guest opens the link and enters a new password. 4.0.4 The system validates the token and password. 4.0.5 The system updates the password and invalidates the token. 4.0.6 The system confirms the reset and redirects to Login. |
| Alternative Flows | 4.1 The Guest requests another reset email; the system invalidates the previous active token and issues a new one. |
| Exceptions | 4.0.E1 The token is invalid, expired, or used; the system rejects the reset. 4.0.E2 The new password does not meet policy; the system requests a different password. 4.0.E3 Email delivery fails; the system shows a retry message without exposing account existence. |
| Priority | High - Must Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-02, BR-04, BR-06 |
| Other Information | All active sessions may be invalidated after a successful password reset. |
| Assumptions | The Guest can access the registered email inbox. |

## UC-05 - Browse Music Catalog

| Field | Content |
|---|---|
| UC ID and Name | UC-05 - Browse Music Catalog |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest or User |
| Secondary Actors | None |
| Trigger | The actor opens the Explore page or another public catalog page. |
| Description | The system displays public tracks and albums that are available for listening. |
| Preconditions | PRE-1: The MagiSound website is available. |
| Postconditions | POST-1: The selected catalog content is displayed. No persistent data is changed. |
| Normal Flow | 5.0.1 The actor opens the catalog. 5.0.2 The system retrieves approved public content. 5.0.3 The system displays tracks and albums with summary information. 5.0.4 The actor browses the list and may open an item detail page. |
| Alternative Flows | 5.1 The actor chooses a genre; the system displays public content for that genre. 5.2 No content is available; the system displays an empty-state message. |
| Exceptions | 5.0.E1 Catalog data cannot be loaded; the system displays an error and a retry option. |
| Priority | High - Must Have |
| Frequency of Use | Very frequently. |
| Business Rules | BR-07 |
| Other Information | Catalog results should be paginated or loaded incrementally. |
| Assumptions | Only approved tracks are marked as public in the database. |

## UC-06 - Search and Filter Music

| Field | Content |
|---|---|
| UC ID and Name | UC-06 - Search and Filter Music |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest or User |
| Secondary Actors | None |
| Trigger | The actor submits a keyword or selects a search filter. |
| Description | The system searches public tracks, albums, and uploaders and optionally filters the results by genre. |
| Preconditions | PRE-1: The MagiSound website is available. |
| Postconditions | POST-1: Matching public results are displayed. No persistent data is changed. |
| Normal Flow | 6.0.1 The actor enters a keyword. 6.0.2 The actor optionally selects a genre or content type. 6.0.3 The system validates the search criteria. 6.0.4 The system retrieves matching approved public content. 6.0.5 The system displays grouped search results. |
| Alternative Flows | 6.1 The keyword is empty but a filter is selected; the system displays all public content matching the filter. 6.2 No result matches; the system displays an empty-state message. |
| Exceptions | 6.0.E1 The search service or database is unavailable; the system displays an error and allows retrying. |
| Priority | High - Must Have |
| Frequency of Use | Very frequently. |
| Business Rules | BR-07 |
| Other Information | Search should be case-insensitive and ignore unnecessary surrounding spaces. |
| Assumptions | Searchable metadata has been stored correctly. |

## UC-07 - Play Public Music

| Field | Content |
|---|---|
| UC ID and Name | UC-07 - Play Public Music |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Guest or User |
| Secondary Actors | None |
| Trigger | The actor selects **Play** on an approved public track. |
| Description | The system streams the selected track and provides play, pause, seek, next, previous, and volume controls. |
| Preconditions | PRE-1: The track exists. PRE-2: The track is approved and publicly available. PRE-3: The actor's device can play the supported audio format. |
| Postconditions | POST-1: Playback is stopped or completed. POST-2: Listening statistics may be updated after the configured counting condition is met. |
| Normal Flow | 7.0.1 The actor selects a track. 7.0.2 The system verifies that the track is public. 7.0.3 The system loads the audio data and starts playback. 7.0.4 The actor controls playback. 7.0.5 The system updates the player state and continues streaming. 7.0.6 The system records a valid play when the counting rule is satisfied. |
| Alternative Flows | 7.1 The actor selects another track; the system stops the current track and starts the selected track. 7.2 The track ends; the system plays the next queued track if one exists. |
| Exceptions | 7.0.E1 The audio cannot be loaded; the system displays a playback error. 7.0.E2 The track becomes unavailable; the system stops playback and removes it from the active queue. 7.0.E3 The network is interrupted; the system pauses or retries loading. |
| Priority | High - Must Have |
| Frequency of Use | Very frequently. |
| Business Rules | BR-07, BR-08 |
| Other Information | Audio is stored and retrieved through the MagiSound backend and database; storage details are not exposed to the actor. |
| Assumptions | The actor has a stable enough connection for audio playback. |

## UC-08 - Manage Personal Profile

| Field | Content |
|---|---|
| UC ID and Name | UC-08 - Manage Personal Profile |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User opens the profile settings page. |
| Description | The User views and updates permitted personal profile information. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: The account is active. |
| Postconditions | POST-1: Valid profile changes are stored. |
| Normal Flow | 8.0.1 The User opens profile settings. 8.0.2 The system displays the current profile. 8.0.3 The User edits permitted fields and submits the form. 8.0.4 The system validates and saves the changes. 8.0.5 The system displays the updated profile. |
| Alternative Flows | 8.1 The User views the profile without editing it. 8.2 The User cancels editing; no change is saved. |
| Exceptions | 8.0.E1 The username is unavailable or input is invalid; the system identifies the affected fields. 8.0.E2 Saving fails; the system keeps the previous profile data. |
| Priority | Medium - Should Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-09, BR-10 |
| Other Information | The User can modify only the profile associated with the authenticated account. |
| Assumptions | Profile fields such as display name, biography, avatar reference, birth date, and country may be supported. |

## UC-09 - Manage Favorites

| Field | Content |
|---|---|
| UC ID and Name | UC-09 - Manage Favorites |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User opens Favorites or selects the favorite control on a track. |
| Description | The User views favorite tracks and adds or removes an approved public track from the favorites collection. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: The selected track exists and is public. |
| Postconditions | POST-1: The favorite relationship reflects the User's latest action. |
| Normal Flow | 9.0.1 The User selects a public track. 9.0.2 The User chooses **Add to Favorites**. 9.0.3 The system verifies ownership and track availability. 9.0.4 The system stores the favorite relationship and updates the interface. |
| Alternative Flows | 9.1 The track is already a favorite; the User chooses **Remove from Favorites**, and the system removes the relationship. 9.2 The User opens Favorites; the system displays all currently available favorite tracks. |
| Exceptions | 9.0.E1 The track no longer exists or is not public; the system refuses the operation and refreshes the list. 9.0.E2 The operation fails; the system keeps the previous favorite state. |
| Priority | Medium - Should Have |
| Frequency of Use | Frequently. |
| Business Rules | BR-07, BR-09, BR-11 |
| Other Information | Duplicate favorite records must not be created. |
| Assumptions | A User has one favorites collection managed by the system. |

## UC-10 - Manage Playlists

| Field | Content |
|---|---|
| UC ID and Name | UC-10 - Manage Playlists |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User opens the playlist area or selects a playlist action. |
| Description | The User creates, views, updates, and deletes owned playlists and manages the tracks and order inside them. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: Tracks added to a playlist are available to the User. |
| Postconditions | POST-1: The selected playlist operation is stored. POST-2: Playlist order and membership are consistent. |
| Normal Flow | 10.0.1 The User opens Playlists. 10.0.2 The system displays playlists owned by the User. 10.0.3 The User selects a playlist or creates a new one. 10.0.4 The User edits playlist information or its tracks. 10.0.5 The system validates and saves the changes. 10.0.6 The system displays the updated playlist. |
| Alternative Flows | 10.1 The User deletes a playlist; the system asks for confirmation and removes only the playlist, not its tracks. 10.2 The User reorders tracks; the system saves the new positions. 10.3 The User removes a track; the system removes only the playlist-track relationship. |
| Exceptions | 10.0.E1 A selected track is unavailable; the system refuses to add it. 10.0.E2 The playlist name or data is invalid; the system requests correction. 10.0.E3 Saving fails; the existing playlist remains unchanged. |
| Priority | High - Must Have |
| Frequency of Use | Frequently. |
| Business Rules | BR-09, BR-11, BR-12 |
| Other Information | A User can modify only owned playlists. |
| Assumptions | Playlist visibility may be public or private according to the supported design. |

## UC-11 - View Lyrics

| Field | Content |
|---|---|
| UC ID and Name | UC-11 - View Lyrics |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User selects the lyrics view for a track. |
| Description | The system displays the official read-only lyrics currently available for the selected track. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: The selected track is available. |
| Postconditions | POST-1: Lyrics are displayed if available. No persistent data is changed. |
| Normal Flow | 11.0.1 The User opens a track. 11.0.2 The User selects **Lyrics**. 11.0.3 The system retrieves the lyrics for the track. 11.0.4 The system displays the lyrics in read-only form. |
| Alternative Flows | 11.1 No lyrics are available; the system displays an informative empty state. |
| Exceptions | 11.0.E1 Lyrics cannot be loaded; the system displays an error and a retry option. |
| Priority | Medium - Should Have |
| Frequency of Use | Frequently. |
| Business Rules | BR-13 |
| Other Information | Custom lyrics, lyric editing, and language switching are outside the project scope. |
| Assumptions | Lyrics are supplied and maintained as system content. |

## UC-12 - Submit Content Report

| Field | Content |
|---|---|
| UC ID and Name | UC-12 - Submit Content Report |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User selects **Report** on a public track. |
| Description | The User submits a category and description explaining why a public track may violate content rules. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: The track exists and is public. |
| Postconditions | POST-1: A new pending content report is stored and available to Staff. |
| Normal Flow | 12.0.1 The User selects a track and chooses **Report**. 12.0.2 The system displays the report form. 12.0.3 The User selects a category and enters a description. 12.0.4 The system validates and stores the report as pending. 12.0.5 The system confirms submission. |
| Alternative Flows | 12.1 The User cancels the report; no data is stored. |
| Exceptions | 12.0.E1 Required information is missing; the system requests correction. 12.0.E2 An equivalent pending report from the same User already exists; the system prevents a duplicate. 12.0.E3 The track becomes unavailable; the system cancels submission. |
| Priority | Medium - Should Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-09, BR-14 |
| Other Information | The reported User must not receive the reporter's private information. |
| Assumptions | Staff members periodically review pending reports. |

## UC-13 - Logout

| Field | Content |
|---|---|
| UC ID and Name | UC-13 - Logout |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User, Staff, or Admin |
| Secondary Actors | None |
| Trigger | The authenticated actor selects **Logout**. |
| Description | The system terminates the current session and returns the actor to a public page. |
| Preconditions | PRE-1: The actor is authenticated. |
| Postconditions | POST-1: The current session or authentication token is invalidated. POST-2: Protected pages require authentication again. |
| Normal Flow | 13.0.1 The actor selects **Logout**. 13.0.2 The system invalidates the current session. 13.0.3 The system clears local authentication data. 13.0.4 The system redirects to a public page. |
| Alternative Flows | 13.1 The session has already expired; the system clears local authentication data and redirects to Login. |
| Exceptions | 13.0.E1 The server cannot process logout; the client still removes local credentials and requires a new login. |
| Priority | High - Must Have |
| Frequency of Use | Frequently. |
| Business Rules | BR-06 |
| Other Information | Protected API requests made after logout must be rejected. |
| Assumptions | The actor uses one active browser session at a time. |

## UC-14 - Upload Track for Review

| Field | Content |
|---|---|
| UC ID and Name | UC-14 - Upload Track for Review |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User selects **Upload Track**. |
| Description | The User provides an audio file and required metadata. The system stores the submission as pending and sends it to the Staff review queue. |
| Preconditions | PRE-1: The User is authenticated and active. PRE-2: The User has a supported audio file. PRE-3: At least one valid genre exists. |
| Postconditions | POST-1: The audio and metadata are stored successfully. POST-2: The track has Pending status. POST-3: The track is not publicly accessible. |
| Normal Flow | 14.0.1 The User opens the upload form. 14.0.2 The system displays required metadata and file fields. 14.0.3 The User selects an audio file and enters track information. 14.0.4 The User submits the form. 14.0.5 The system validates the file and metadata. 14.0.6 The system stores the audio and track record as Pending. 14.0.7 The system confirms that the track was submitted for review. |
| Alternative Flows | 14.1 The User cancels before submission; no track is created. 14.2 A previous submission was rejected; the User corrects it outside the system and uploads it again as a new review submission. |
| Exceptions | 14.0.E1 The audio format or size is unsupported; the system rejects the file. 14.0.E2 Required metadata is missing or invalid; the system requests correction. 14.0.E3 Audio storage fails; the system rolls back the track record and reports failure. |
| Priority | High - Must Have |
| Frequency of Use | Several times per week. |
| Business Rules | BR-09, BR-15, BR-16 |
| Other Information | Audio is stored through the backend in SQL Server. The database must not contain a completed track record without its required audio data. |
| Assumptions | Database capacity is sufficient for the configured upload limit. |

## UC-15 - View Track Review Result

| Field | Content |
|---|---|
| UC ID and Name | UC-15 - View Track Review Result |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User opens the track submission results page. |
| Description | The system displays the review status of the User's submitted tracks and the reason for a rejection when applicable. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: The User has at least one track submission. |
| Postconditions | POST-1: The review information is displayed. No review data is modified. |
| Normal Flow | 15.0.1 The User opens review results. 15.0.2 The system retrieves submissions owned by the User. 15.0.3 The system displays each status as Pending, Approved, or Rejected. 15.0.4 The User selects a submission. 15.0.5 The system displays its review details and rejection reason when applicable. |
| Alternative Flows | 15.1 The User has no submissions; the system displays an empty state and an upload option. |
| Exceptions | 15.0.E1 The User attempts to access another User's submission; the system denies access. 15.0.E2 Review data cannot be loaded; the system displays an error and retry option. |
| Priority | High - Must Have |
| Frequency of Use | Several times per week. |
| Business Rules | BR-09, BR-17 |
| Other Information | Review results are read-only for the User. |
| Assumptions | Staff records a reason for every rejected submission. |

## UC-16 - Manage My Albums

| Field | Content |
|---|---|
| UC ID and Name | UC-16 - Manage My Albums |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | User |
| Secondary Actors | None |
| Trigger | The User opens the personal album management area. |
| Description | The User creates, views, updates, and deletes owned albums and organizes owned tracks into those albums. |
| Preconditions | PRE-1: The User is authenticated. PRE-2: Tracks selected for an album belong to the User. |
| Postconditions | POST-1: The album and its track associations reflect the saved changes. |
| Normal Flow | 16.0.1 The User opens My Albums. 16.0.2 The system displays albums owned by the User. 16.0.3 The User creates or selects an album. 16.0.4 The User edits album information and selects owned tracks. 16.0.5 The system validates and saves the changes. 16.0.6 The system displays the updated album. |
| Alternative Flows | 16.1 The User deletes an album; the system asks for confirmation and deletes the album without deleting its tracks. 16.2 The User removes a track from an album; the track remains in the User's submissions. |
| Exceptions | 16.0.E1 The selected track belongs to another User; the system refuses the operation. 16.0.E2 Album data is invalid; the system requests correction. 16.0.E3 Saving fails; the previous album state is preserved. |
| Priority | Medium - Should Have |
| Frequency of Use | Several times per month. |
| Business Rules | BR-09, BR-18 |
| Other Information | Only approved tracks may become publicly visible through a public album. |
| Assumptions | Album management does not replace the Staff track-review process. |

## UC-17 - Review Pending Track

| Field | Content |
|---|---|
| UC ID and Name | UC-17 - Review Pending Track |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | Staff selects a track from the pending review queue. |
| Description | Staff examines the track metadata and listens to its audio before choosing an approval or rejection outcome. |
| Preconditions | PRE-1: Staff is authenticated with the Staff role. PRE-2: At least one Pending track exists. |
| Postconditions | POST-1: The track remains Pending until Staff executes UC-18 or UC-19. |
| Normal Flow | 17.0.1 Staff opens the pending review queue. 17.0.2 The system displays Pending tracks. 17.0.3 Staff selects a track. 17.0.4 The system displays its uploader, metadata, and audio. 17.0.5 Staff listens to and assesses the track. 17.0.6 The system presents the Approve and Reject actions. |
| Alternative Flows | 17.1 Staff returns the track to the queue without making a decision; its status remains Pending. |
| Exceptions | 17.0.E1 The track was already reviewed by another Staff member; the system refreshes its current status. 17.0.E2 The audio cannot be loaded; the system prevents a final decision until the required content can be assessed. |
| Priority | High - Must Have |
| Frequency of Use | Several times per day. |
| Business Rules | BR-19, BR-20 |
| Other Information | Extension point: **Track assessment completed**. UC-18 and UC-19 extend this use case. |
| Assumptions | Staff follows the agreed content-review criteria. |

## UC-18 - Approve Track

| Field | Content |
|---|---|
| UC ID and Name | UC-18 - Approve Track |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | After reviewing a Pending track, Staff selects **Approve**. |
| Description | The system records Staff's approval and makes the track available in the public music catalog. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: The track is Pending. PRE-3: Staff has completed its assessment in UC-17. |
| Postconditions | POST-1: The track status is Approved. POST-2: Approval time and reviewer are recorded. POST-3: The track may appear in the public catalog. |
| Normal Flow | 18.0.1 Staff selects **Approve**. 18.0.2 The system asks for confirmation. 18.0.3 Staff confirms. 18.0.4 The system verifies that the track is still Pending. 18.0.5 The system stores the approval and publishes the track. 18.0.6 The system confirms success. |
| Alternative Flows | 18.1 Staff cancels confirmation; the track remains Pending. |
| Exceptions | 18.0.E1 The track is no longer Pending; the system refuses the operation and displays its latest status. 18.0.E2 Saving fails; the track remains Pending and is not published. |
| Priority | High - Must Have |
| Frequency of Use | Several times per day. |
| Business Rules | BR-07, BR-19, BR-20 |
| Other Information | This use case extends UC-17 at **Track assessment completed**. |
| Assumptions | Approval means the track satisfies the current review criteria. |

## UC-19 - Reject Track

| Field | Content |
|---|---|
| UC ID and Name | UC-19 - Reject Track |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | After reviewing a Pending track, Staff selects **Reject**. |
| Description | The system rejects a track that does not satisfy review requirements and records a mandatory reason. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: The track is Pending. PRE-3: Staff has completed its assessment in UC-17. |
| Postconditions | POST-1: The track status is Rejected. POST-2: Reviewer, review time, and rejection reason are stored. POST-3: The track is not public. |
| Normal Flow | 19.0.1 Staff selects **Reject**. 19.0.2 The system starts UC-20 to collect the rejection reason. 19.0.3 Staff confirms the rejection. 19.0.4 The system verifies that the track is still Pending. 19.0.5 The system stores the rejection result. 19.0.6 The system confirms success. |
| Alternative Flows | 19.1 Staff cancels before confirmation; the track remains Pending. |
| Exceptions | 19.0.E1 No valid reason is supplied; the system does not allow rejection. 19.0.E2 The track is no longer Pending; the system refuses the operation. 19.0.E3 Saving fails; the track remains Pending. |
| Priority | High - Must Have |
| Frequency of Use | Several times per day. |
| Business Rules | BR-17, BR-19, BR-20 |
| Other Information | This use case extends UC-17 and includes UC-20. |
| Assumptions | Staff provides a clear reason that the uploader can understand. |

## UC-20 - Enter Rejection Reason

| Field | Content |
|---|---|
| UC ID and Name | UC-20 - Enter Rejection Reason |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | UC-19 requires Staff to provide a reason for rejecting a track. |
| Description | Staff enters a meaningful rejection reason before the system can complete a track rejection. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: A Pending track is being rejected. |
| Postconditions | POST-1: A valid rejection reason is available to UC-19. |
| Normal Flow | 20.0.1 The system displays the rejection-reason field. 20.0.2 Staff enters the reason. 20.0.3 The system validates the reason. 20.0.4 The system returns the validated reason to UC-19. |
| Alternative Flows | 20.1 Staff cancels; control returns to UC-19 without rejecting the track. |
| Exceptions | 20.0.E1 The reason is empty or invalid; the system requests a valid reason. |
| Priority | High - Must Have |
| Frequency of Use | Every time a track is rejected. |
| Business Rules | BR-17 |
| Other Information | This use case is always included by UC-19. |
| Assumptions | A text reason is sufficient for the project's review process. |

## UC-21 - Review Content Report

| Field | Content |
|---|---|
| UC ID and Name | UC-21 - Review Content Report |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | Staff selects a pending content report. |
| Description | Staff examines the report details and the reported track to determine whether the report is valid. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: A Pending report exists. |
| Postconditions | POST-1: The report remains Pending until Staff executes UC-22. |
| Normal Flow | 21.0.1 Staff opens the pending report queue. 21.0.2 The system displays Pending reports. 21.0.3 Staff selects a report. 21.0.4 The system displays the reporter's description and reported track. 21.0.5 Staff listens to and assesses the track. 21.0.6 The system provides a resolution action. |
| Alternative Flows | 21.1 Staff leaves without a decision; the report remains Pending. |
| Exceptions | 21.0.E1 The report was already handled by another Staff member; the system displays its latest state. 21.0.E2 The reported track cannot be accessed; the system displays its current state and allows Staff to record an appropriate resolution. |
| Priority | Medium - Should Have |
| Frequency of Use | Several times per week. |
| Business Rules | BR-14, BR-20, BR-21 |
| Other Information | Extension point: **Report assessment completed**. UC-22 extends this use case. |
| Assumptions | Staff applies the same content rules used for track moderation. |

## UC-22 - Resolve Content Report

| Field | Content |
|---|---|
| UC ID and Name | UC-22 - Resolve Content Report |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | After reviewing a report, Staff selects a resolution. |
| Description | Staff records whether the report is valid or invalid, adds a resolution note, and closes the report. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: The report is Pending. PRE-3: Staff has assessed the report in UC-21. |
| Postconditions | POST-1: The report is marked Resolved or Rejected. POST-2: Handler, handling time, and resolution note are recorded. |
| Normal Flow | 22.0.1 Staff selects **Confirm Violation**. 22.0.2 Staff enters a resolution note. 22.0.3 The system validates the decision. 22.0.4 If the selected action is removal, the system starts UC-23. 22.0.5 The system records the resolution and closes the report. 22.0.6 The system confirms success. |
| Alternative Flows | 22.1 Staff selects **Reject Report** because no violation is found. Staff enters a resolution note, and the system closes the report without changing the track. 22.2 Staff cancels; the report remains Pending. |
| Exceptions | 22.0.E1 The report is no longer Pending; the system refuses the operation. 22.0.E2 The resolution note is missing; the system requests it. 22.0.E3 Saving fails; the report remains Pending and no partial resolution is stored. |
| Priority | Medium - Should Have |
| Frequency of Use | Several times per week. |
| Business Rules | BR-20, BR-21 |
| Other Information | This use case extends UC-21. UC-23 extends it when Staff selects track removal. |
| Assumptions | One final resolution is sufficient for each report. |

## UC-23 - Remove Violating Track

| Field | Content |
|---|---|
| UC ID and Name | UC-23 - Remove Violating Track |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Staff |
| Secondary Actors | None |
| Trigger | While resolving a valid report, Staff selects **Remove Track**. |
| Description | The system removes a confirmed violating track from the public catalog while preserving the moderation record. |
| Preconditions | PRE-1: Staff is authenticated. PRE-2: The report has been assessed as valid. PRE-3: The track is currently public. |
| Postconditions | POST-1: The track is no longer publicly playable or searchable. POST-2: The removal action and responsible Staff member are recorded. |
| Normal Flow | 23.0.1 Staff selects **Remove Track**. 23.0.2 The system asks for confirmation. 23.0.3 Staff confirms. 23.0.4 The system marks the track as unavailable to the public. 23.0.5 The system records the moderation action and returns to UC-22. |
| Alternative Flows | 23.1 Staff cancels removal; control returns to UC-22 without changing the track. |
| Exceptions | 23.0.E1 The track has already been removed; the system reports its current state and returns to UC-22. 23.0.E2 Updating the track fails; the system does not finalize the removal action. |
| Priority | Medium - Should Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-07, BR-20, BR-21 |
| Other Information | The system should use logical removal or an equivalent recoverable status instead of immediately deleting the stored audio. |
| Assumptions | Staff has sufficient evidence before selecting removal. |

## UC-24 - Manage User Accounts

| Field | Content |
|---|---|
| UC ID and Name | UC-24 - Manage User Accounts |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Admin |
| Secondary Actors | None |
| Trigger | Admin opens account management. |
| Description | Admin searches and views accounts and locks or unlocks a selected account. |
| Preconditions | PRE-1: Admin is authenticated with the Admin role. |
| Postconditions | POST-1: Any confirmed account-status change is stored and audited. |
| Normal Flow | 24.0.1 Admin opens account management. 24.0.2 The system displays searchable accounts. 24.0.3 Admin selects an account. 24.0.4 The system displays its profile, role, and status. 24.0.5 Admin selects a permitted status action. 24.0.6 The system asks for confirmation and stores the change. 24.0.7 The system displays the updated account. |
| Alternative Flows | 24.1 Admin only views account information; no data is changed. 24.2 Admin selects role management; the system starts UC-25. |
| Exceptions | 24.0.E1 The account no longer exists; the system refreshes the list. 24.0.E2 The operation would violate role or self-protection rules; the system refuses it. 24.0.E3 Saving fails; the previous account status remains unchanged. |
| Priority | High - Must Have |
| Frequency of Use | Several times per week. |
| Business Rules | BR-05, BR-20, BR-22 |
| Other Information | Locking an account must prevent new authenticated access. |
| Assumptions | Admin actions are performed only for legitimate administrative reasons. |

## UC-25 - Assign User Roles

| Field | Content |
|---|---|
| UC ID and Name | UC-25 - Assign User Roles |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Admin |
| Secondary Actors | None |
| Trigger | While managing an account, Admin selects **Change Role**. |
| Description | Admin assigns an allowed User, Staff, or Admin role to the selected account. |
| Preconditions | PRE-1: Admin is authenticated. PRE-2: The target account exists. PRE-3: The role is defined by the system. |
| Postconditions | POST-1: The target account has the confirmed role. POST-2: The role change is audited. |
| Normal Flow | 25.0.1 Admin selects **Change Role**. 25.0.2 The system displays allowed roles. 25.0.3 Admin selects a role. 25.0.4 The system asks for confirmation. 25.0.5 Admin confirms. 25.0.6 The system validates permission and stores the new role. 25.0.7 The system displays the updated account. |
| Alternative Flows | 25.1 Admin cancels; the existing role remains unchanged. |
| Exceptions | 25.0.E1 The role change would remove required administrative control or violates a protection rule; the system refuses it. 25.0.E2 The account or role changed concurrently; the system refreshes the data. 25.0.E3 Saving fails; the previous role remains unchanged. |
| Priority | High - Must Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-20, BR-22 |
| Other Information | This use case extends UC-24 at **Account selected**. Existing sessions may need to refresh authorization after a role change. |
| Assumptions | Only Admin is authorized to assign Staff or Admin privileges. |

## UC-26 - Manage Genres

| Field | Content |
|---|---|
| UC ID and Name | UC-26 - Manage Genres |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Admin |
| Secondary Actors | None |
| Trigger | Admin opens genre management or selects a genre action. |
| Description | Admin creates, views, updates, activates, deactivates, or deletes an eligible music genre. |
| Preconditions | PRE-1: Admin is authenticated. |
| Postconditions | POST-1: A valid confirmed genre change is stored. |
| Normal Flow | 26.0.1 Admin opens genre management. 26.0.2 The system displays genres and their status. 26.0.3 Admin selects Create or Edit. 26.0.4 Admin enters genre information. 26.0.5 The system validates and stores the genre. 26.0.6 The system displays the updated list. |
| Alternative Flows | 26.1 Admin deactivates a genre; it can no longer be selected for new uploads. 26.2 Admin deletes an unused genre after confirmation. 26.3 Admin cancels; no data is changed. |
| Exceptions | 26.0.E1 The genre name or slug already exists; the system requests another value. 26.0.E2 The genre is used by tracks; the system prevents deletion and offers deactivation. 26.0.E3 Saving fails; the previous genre state remains unchanged. |
| Priority | Medium - Should Have |
| Frequency of Use | Occasionally. |
| Business Rules | BR-20, BR-23 |
| Other Information | Deactivation is preferred when a genre is already referenced by track data. |
| Assumptions | A track is assigned to one genre in the current project scope. |

## UC-27 - View System Statistics

| Field | Content |
|---|---|
| UC ID and Name | UC-27 - View System Statistics |
| Created By | [Member name] |
| Date Created | [dd/mm/yyyy] |
| Primary Actor | Admin |
| Secondary Actors | None |
| Trigger | Admin opens the system statistics page. |
| Description | The system displays basic aggregated statistics about accounts, tracks, review states, and listening activity. |
| Preconditions | PRE-1: Admin is authenticated. PRE-2: Statistical source data is available. |
| Postconditions | POST-1: Current statistics are displayed. No source data is changed. |
| Normal Flow | 27.0.1 Admin opens System Statistics. 27.0.2 The system aggregates the required data. 27.0.3 The system displays totals and simple summaries for accounts, tracks, review states, and plays. 27.0.4 Admin reviews the results. |
| Alternative Flows | 27.1 No activity data is available for a metric; the system displays zero or an empty state. |
| Exceptions | 27.0.E1 Statistics cannot be calculated; the system displays an error and a retry option. |
| Priority | Low - Could Have |
| Frequency of Use | Several times per month. |
| Business Rules | BR-20, BR-24 |
| Other Information | Statistics are for basic administration only; advanced analytics are outside the project scope. |
| Assumptions | Aggregated counts are sufficient for the SWD project. |

## C. Business Rules

| ID | Business Rule | Business Rule Description |
|---|---|---|
| BR-01 | Unique Account Email | Each account must use a unique valid email address. |
| BR-02 | Password Policy | A password must meet the configured minimum length and complexity requirements and must be securely encoded before storage. |
| BR-03 | Email Verification | A newly registered account remains pending and cannot log in until its email is verified. |
| BR-04 | Single-use Token | Email verification and password-reset tokens must expire and may be used only once. |
| BR-05 | Active Account | A locked or deleted account cannot log in or use protected functions. |
| BR-06 | Session Security | Protected functions require a valid authenticated session with the appropriate role. |
| BR-07 | Public Track | Only an Approved and available track may appear in search, the public catalog, albums, or public playback. |
| BR-08 | Play Count | A listening event is counted only after the configured valid-play condition is satisfied. |
| BR-09 | Ownership | A User may access or modify only personal resources unless the resource is intentionally public. |
| BR-10 | Profile Identity | Username and other configured unique profile identifiers must not duplicate another active profile. |
| BR-11 | Favorite and Playlist Track | Favorites and playlists must reference existing tracks that are available to the User. |
| BR-12 | Playlist Ownership | Only the playlist owner may update or delete the playlist and manage its tracks. |
| BR-13 | Read-only Lyrics | Users may view available lyrics but cannot create, edit, translate, or switch custom lyric versions. |
| BR-14 | Content Report | A report must reference an existing public track and include a valid category and description. |
| BR-15 | Track Submission | A submitted track must contain the required metadata and a supported audio file and must initially have Pending status. |
| BR-16 | Audio Storage | The audio data and its track record must be stored consistently; a failed upload must not leave an incomplete public track. |
| BR-17 | Rejection Reason | Every Rejected track must have a non-empty rejection reason visible to its uploader. |
| BR-18 | Album Track Ownership | A User may add only owned tracks to an owned album, and an unapproved track cannot become public through an album. |
| BR-19 | Single Review Decision | Only a Pending track may be approved or rejected, and one final review decision is stored for that review cycle. |
| BR-20 | Role Authorization | Staff and Admin operations require the corresponding role. |
| BR-21 | Report Resolution | A content report must record its final decision, resolution note, handler, and handling time. |
| BR-22 | Role Administration | Only Admin may assign privileged roles, and the system must preserve at least one usable Admin account. |
| BR-23 | Genre Integrity | A genre referenced by track data must not be physically deleted; it may be deactivated instead. |
| BR-24 | Statistics Privacy | System statistics must be aggregated and must not expose passwords, tokens, or unnecessary personal information. |

## D. Use Case Relationships

| Source Use Case | Relationship | Target Use Case | Condition |
|---|---|---|---|
| UC-18 Approve Track | `<<extend>>` | UC-17 Review Pending Track | Staff chooses approval after assessment. |
| UC-19 Reject Track | `<<extend>>` | UC-17 Review Pending Track | Staff chooses rejection after assessment. |
| UC-19 Reject Track | `<<include>>` | UC-20 Enter Rejection Reason | A reason is mandatory for every rejection. |
| UC-22 Resolve Content Report | `<<extend>>` | UC-21 Review Content Report | Staff records a decision after assessment. |
| UC-23 Remove Violating Track | `<<extend>>` | UC-22 Resolve Content Report | A violation is confirmed and Staff selects removal. |
| UC-25 Assign User Roles | `<<extend>>` | UC-24 Manage User Accounts | Admin chooses to modify the selected account's role. |

