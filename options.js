document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const intervalInput = document.getElementById('interval');
  const selectorInput = document.getElementById('selector');
  const textInput = document.getElementById('text');
  const soundCheckbox = document.getElementById('sound');
  const notifCheckbox = document.getElementById('notifications');

  // Load current settings
  chrome.storage.local.get([
    'intervalSeconds',
    'battleSelector',
    'battleText',
    'soundEnabled',
    'notificationsEnabled',
  ], (data) => {
    intervalInput.value = data['intervalSeconds'] || 5;
    selectorInput.value = data['battleSelector'] || '.task .content';
    textInput.value = data['battleText'] || 'Подготовка к бою';
    soundCheckbox.checked = data['soundEnabled'] !== false; // default true
    notifCheckbox.checked = data['notificationsEnabled'] !== false;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newVals = {
      intervalSeconds: Math.max(3, parseInt(intervalInput.value, 10) || 5),
      battleSelector: selectorInput.value.trim() || '.task .content',
      battleText: textInput.value.trim() || 'Подготовка к бою',
      soundEnabled: soundCheckbox.checked,
      notificationsEnabled: notifCheckbox.checked,
    };
    chrome.storage.local.set(newVals, () => {
      alert('Настройки сохранены');
    });
  });
});
