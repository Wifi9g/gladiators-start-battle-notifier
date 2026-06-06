// content.js – polling, detection, reload, overlay, sound

(() => {
  const STORAGE_KEYS = {
    monitoring: 'monitoringEnabled',
    interval: 'intervalSeconds',
    selector: 'battleSelector',
    text: 'battleText',
    sound: 'soundEnabled',
    overlay: 'overlayEnabled',
    debug: 'debugEnabled',
  };

  let monitoring = false;
  let pollTimeoutId = null;
  let overlayEl = null;
  let countdownIntervalId = null;

  function debugLog(...args) {
    chrome.storage.local.get([STORAGE_KEYS.debug], (data) => {
      if (data[STORAGE_KEYS.debug]) {
        console.log('[Gladiators Content]', ...args);
      }
    });
  }

  function createOverlay(text, style = {}) {
    removeOverlay();
    overlayEl = document.createElement('div');
    overlayEl.id = 'gbm-overlay';
    overlayEl.style.position = 'fixed';
    overlayEl.style.top = '10px';
    overlayEl.style.right = '10px';
    overlayEl.style.zIndex = '2147483647'; // max
    overlayEl.style.background = 'rgba(0,0,0,0.7)';
    overlayEl.style.color = '#fff';
    overlayEl.style.padding = '8px 12px';
    overlayEl.style.borderRadius = '4px';
    overlayEl.style.fontSize = '14px';
    overlayEl.style.fontFamily = 'Arial, sans-serif';
    overlayEl.textContent = text;
    // Apply any extra style overrides
    Object.assign(overlayEl.style, style);
    document.body.appendChild(overlayEl);
  }

  function removeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
  }

  function playSound() {
    chrome.storage.local.get([STORAGE_KEYS.sound], (data) => {
      if (!data[STORAGE_KEYS.sound]) {
        debugLog('Sound disabled by settings');
        return;
      }
      // Try to play the bundled mp3 first
      const audio = new Audio(chrome.runtime.getURL('sounds/battle-start.mp3'));
      audio.play().then(() => {
        debugLog('Played bundled sound');
      }).catch((e) => {
        debugLog('Bundled audio failed, falling back to Web Audio API', e);
        // Fallback: generate a short beep using Web Audio API
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          oscillator.connect(gain).connect(ctx.destination);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          debugLog('Web Audio beep played');
        } catch (err) {
          debugLog('Web Audio API failed', err);
          if (overlayEl) {
            overlayEl.textContent += ' (звук не воспроизведён)';
          }
        }
      });
    });
  }

  function detectBattle() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.selector, STORAGE_KEYS.text], (data) => {
        const selector = data[STORAGE_KEYS.selector] || '.task .content';
        const requiredText = data[STORAGE_KEYS.text] || 'Подготовка к бою';
        let found = false;
        try {
          const el = document.querySelector(selector);
          if (el) {
            const txt = el.textContent.trim().replace(/\s+/g, ' ');
            if (txt.includes(requiredText)) {
              found = true;
            }
          }
        } catch (e) {
          debugLog('Selector error', e);
        }
        resolve(found);
      });
    });
  }

  function startPolling(intervalSec) {
    if (!monitoring) return;
    debugLog('Polling start, interval', intervalSec);
    // Show monitoring overlay with countdown placeholder
    createOverlay('Gladiators monitor: ON – проверка через ' + intervalSec + ' с', {
      background: 'rgba(0,0,0,0.6)',
    });
    // start countdown display
    let remaining = intervalSec;
    countdownIntervalId = setInterval(() => {
      remaining -= 1;
      if (overlayEl) overlayEl.textContent = `Gladiators monitor: ON – проверка через ${remaining} с`;
    }, 1000);
    // schedule detection after interval
    pollTimeoutId = setTimeout(async () => {
      clearInterval(countdownIntervalId);
      if (!monitoring) return;
      const detected = await detectBattle();
      if (detected) {
        // Battle preparation detected
        monitoring = false;
        removeOverlay();
        createOverlay('⚔️ Подготовка к бою обнаружена', {
          background: 'rgba(150,0,0,0.85)',
        });
        playSound();
        // notify background
        chrome.runtime.sendMessage({type: 'BATTLE_DETECTED'});
      } else {
        // Not detected, reload page and continue
        debugLog('No battle detected, reloading');
        // Ensure still monitoring before reload
        chrome.storage.local.get([STORAGE_KEYS.monitoring], (d) => {
          if (d[STORAGE_KEYS.monitoring]) {
            location.reload();
          }
        });
      }
    }, intervalSec * 1000);
  }

  function startMonitoring() {
    if (monitoring) return;
    monitoring = true;
    // read interval (min 3)
    chrome.storage.local.get([STORAGE_KEYS.interval], (data) => {
      let interval = parseInt(data[STORAGE_KEYS.interval], 10) || 5;
      if (interval < 3) interval = 3;
      startPolling(interval);
    });
  }

  function stopMonitoring() {
    monitoring = false;
    if (pollTimeoutId) clearTimeout(pollTimeoutId);
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    removeOverlay();
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'START_MONITORING') {
      startMonitoring();
    } else if (msg.type === 'STOP_MONITORING') {
      stopMonitoring();
    }
  });

  // On load, check if monitoring was enabled previously
  chrome.storage.local.get([STORAGE_KEYS.monitoring], (data) => {
    if (data[STORAGE_KEYS.monitoring]) {
      startMonitoring();
    }
  });
})();
