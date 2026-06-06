// service_worker.js – handles action clicks, state, badge, notifications, and messaging with content script

// Keys used in chrome.storage.local
const STORAGE_KEYS = {
  monitoring: 'monitoringEnabled',
  interval: 'intervalSeconds',
  selector: 'battleSelector',
  text: 'battleText',
  sound: 'soundEnabled',
  notifications: 'notificationsEnabled',
  overlay: 'overlayEnabled',
  debug: 'debugEnabled',
  lastDetection: 'lastDetectionAt',
};

// Default settings
const DEFAULTS = {
  [STORAGE_KEYS.monitoring]: false,
  [STORAGE_KEYS.interval]: 5,
  [STORAGE_KEYS.selector]: '.task .content',
  [STORAGE_KEYS.text]: 'Подготовка к бою',
  [STORAGE_KEYS.sound]: true,
  [STORAGE_KEYS.notifications]: true,
  [STORAGE_KEYS.overlay]: true,
  [STORAGE_KEYS.debug]: true,
  [STORAGE_KEYS.lastDetection]: null,
};

function debugLog(...args) {
  chrome.storage.local.get([STORAGE_KEYS.debug], (data) => {
    if (data[STORAGE_KEYS.debug]) {
      console.log('[Gladiators Monitor]', ...args);
    }
  });
}

function updateBadge(state, tabId) {
  let text = '';
  let color = '#000000';
  if (state === 'on') { text = 'ON'; color = '#808080'; }
  else if (state === 'battle') { text = 'B'; color = '#FF0000'; }
  chrome.action.setBadgeText({text, tabId});
  chrome.action.setBadgeBackgroundColor({color, tabId});
}

function sendMessage(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      debugLog('sendMessage error:', chrome.runtime.lastError.message);
    } else {
      debugLog('Message sent', message);
    }
  });
}

function startMonitoring(tabId) {
  debugLog('Starting monitoring', tabId);
  chrome.storage.local.set({[STORAGE_KEYS.monitoring]: true}, () => {
    updateBadge('on', tabId);
    sendMessage(tabId, {type: 'START_MONITORING'});
  });
}

function stopMonitoring(tabId) {
  debugLog('Stopping monitoring', tabId);
  chrome.storage.local.set({[STORAGE_KEYS.monitoring]: false}, () => {
    updateBadge('off', tabId);
    sendMessage(tabId, {type: 'STOP_MONITORING'});
  });
}

function handleDetection(tabId) {
  // disable monitoring globally after detection
  chrome.storage.local.set({[STORAGE_KEYS.monitoring]: false}, () => {
    debugLog('Monitoring disabled after detection');
  });
  debugLog('Handling detection', tabId);
  updateBadge('battle', tabId);
  const ts = new Date().toISOString();
  chrome.storage.local.set({[STORAGE_KEYS.lastDetection]: ts});
  chrome.storage.local.get([STORAGE_KEYS.notifications], (data) => {
    if (data[STORAGE_KEYS.notifications]) {
      chrome.notifications.create('gladiators-battle-detected', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Gladiators: подготовка к бою',
        message: 'На странице найден блок «Подготовка к бою».',
        priority: 2,
      }, (nid) => {
        debugLog('Notification created', nid);
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULTS), (data) => {
    const toSet = {};
    for (const k in DEFAULTS) {
      if (data[k] === undefined) {
        toSet[k] = DEFAULTS[k];
      }
    }
    if (Object.keys(toSet).length) {
      chrome.storage.local.set(toSet, () => debugLog('Defaults set', toSet));
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  const url = tab.url || '';
  const allowed = url.match(/^https:\/\/(www\.|s2\.)?gladiators\.ru\//);
  if (!allowed) { debugLog('Clicked on non-game page'); return; }
  chrome.storage.local.get([STORAGE_KEYS.monitoring], (data) => {
    if (data[STORAGE_KEYS.monitoring]) stopMonitoring(tab.id);
    else startMonitoring(tab.id);
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'BATTLE_DETECTED') {
    const tabId = sender.tab?.id;
    if (tabId) handleDetection(tabId);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get([STORAGE_KEYS.monitoring], (data) => {
      if (data[STORAGE_KEYS.monitoring]) updateBadge('on', tabId);
      else updateBadge('off', tabId);
    });
  }
});
