# Test Plan

## Manual Tests

1. **Installation**
   - Load the `gladiators-battle-monitor` folder as an unpacked extension in Chrome.
   - Ensure no errors appear in the extensions console.

2. **Start/Stop Monitoring via Icon**
   - Open a Gladiators tournament page, e.g. `https://s2.gladiators.ru/xml/arena/tournaments.php?id=...`.
   - Click the extension icon – badge should become `ON` and a small overlay with a countdown appears.
   - Click the icon again – badge clears and overlay disappears.

3. **Polling & Reload**
   - With default interval (5 s), verify the page reloads every 5 seconds when the battle block is absent.
   - Change interval via the Options page (⚙️) to 7 seconds and confirm the reload timing adjusts.
   - Attempt to set interval below 3 seconds – the UI should enforce a minimum of 3 seconds.

4. **Detection (CSS selector + required text)**
   - On the test page (see step 7) or any page where the element `.task .content` containing the text `Подготовка к бою` appears, click the icon to start monitoring.
   - When the element appears, the reload loop stops, badge changes to `B`, an overlay saying `⚔️ Подготовка к бою обнаружена` is shown, the sound plays, and a Chrome notification is sent.

5. **Sound Playback**
   - With sound enabled (default), trigger detection and confirm the `sounds/battle-start.mp3` is played.
   - Disable sound via Options page and ensure detection still occurs but no audio is emitted.
   - With sound enabled, switch to another browser tab before detection – the overlay should show a fallback note that audio could not be played.

6. **Notification Permission**
   - Grant notification permission and verify the notification appears on detection.
   - Revoke permission; detection should still show overlay and play sound (if enabled) without errors.

7. **Test Page Validation**
   - Open `test/test-page.html` via `file://`.
   - Click **Показать подготовку к бою** – the required DOM block is inserted.
   - Start monitoring via the icon and confirm overlay, badge `B`, sound and notification are triggered.

8. **Badge Behavior**
   - Verify badge shows `ON` during active monitoring, `B` after detection, and is cleared when monitoring is stopped.

9. **Debug Logging**
   - Enable debug mode in Options.
   - Perform start, stop, reload, and detection actions.
   - Open the Service Worker console (`chrome://extensions → Details → Service worker → Inspect`) and confirm log entries are present.

10. **Edge Cases**
    - Set an invalid CSS selector in Options and ensure the extension logs the error but continues polling.
    - Navigate to a non‑Gladiators domain and confirm the extension does not start monitoring (clicking the icon does nothing).

## Expected Outcomes
All steps should complete without uncaught exceptions. The extension must behave exactly as described: badge updates, overlay appearance, sound/notification on detection, and proper handling of settings.
