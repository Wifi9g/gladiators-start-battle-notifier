# Acceptance Criteria

- Extension can be loaded unpacked via Chrome Developer mode.
- `manifest.json` conforms to Manifest V3, includes `content_scripts` and `service_worker`.
- `content.js` runs only on `https://gladiators.ru/*`, `https://www.gladiators.ru/*` and `https://s2.gladiators.ru/*` (no `<all_urls>`).
- Clicking the extension icon toggles monitoring; badge shows `ON` when active, `B` after detection, and empty when disabled.
- All settings (interval, selector, text, sound, notifications, overlay, debug) persist via `chrome.storage`.
- Polling runs at the configured interval (default 5 s, minimum 3 s) and triggers a page reload only when the battle preparation block is not found.
- After a reload the content script resumes monitoring automatically.
- Detection uses CSS selector `.task .content` and required text `Подготовка к бою`. When the element with the text is present, monitoring stops and notifications are triggered.
- On detection: reload stops, sound plays (or fallback overlay shown), overlay displays “Подготовка к бою обнаружена”, notification is sent if allowed, and badge changes to `B`.
- Debug log records start/stop, reloads, detections, and any selector/audio/notification errors.
- When `soundEnabled` is off, no audio is played; when `notificationsEnabled` is off, no Chrome notification is sent.
- No usage of `<all_urls>`, remote code, `eval`, or other disallowed APIs in any source file.
- README explains installation, settings, and usage of the test page.
- `test/test-page.html` allows verification of detection and sound without the actual game.
