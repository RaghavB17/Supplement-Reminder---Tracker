const COMMON = ['Vitamin D3', 'Vitamin B12', 'Omega-3', 'Magnesium', 'Iron', 'Zinc', 'Probiotic', 'Calcium'];
const PALETTES = [{ bg: '#f6d1c0', icon: '☀' }, { bg: '#ded8f5', icon: '✦' }, { bg: '#d9ec9c', icon: '◒' }, { bg: '#f7e7a0', icon: '●' }, { bg: '#cce8e4', icon: '♥' }];
const storageKey = 'daily-dose-data-v1';
let data = JSON.parse(localStorage.getItem(storageKey) || '{"supplements":[],"history":{}}');
let selectedColor = 0, notified = {}, selectedHistoryDate = localDateKey();
const $ = selector => document.querySelector(selector);

function localDateKey(date = new Date()) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function formatDate(date = new Date()) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date).toUpperCase(); }
function formatDateKey(key) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(`${key}T12:00:00`)); }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }
function minutes(time) { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; }
function prettyTime(time) { return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function palette(supplement) { return PALETTES[Number.isInteger(supplement.color) && PALETTES[supplement.color] ? supplement.color : 0]; }
function isTaken(id, date = localDateKey()) { return data.history[date]?.includes(id) || false; }
function doseState(supplement, date = localDateKey()) {
  if (isTaken(supplement.id, date)) return 'taken';
  const today = localDateKey();
  if (date < today) return 'missed';
  if (date > today) return 'upcoming';
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= minutes(supplement.time) ? 'missed' : 'upcoming';
}
function save() { localStorage.setItem(storageKey, JSON.stringify(data)); render(); syncNativeReminders(); }
function toggleDose(id, date = localDateKey()) { data.history[date] ??= []; data.history[date] = isTaken(id, date) ? data.history[date].filter(item => item !== id) : [...data.history[date], id]; save(); }
function scheduleList() { return [...data.supplements].sort((a, b) => minutes(a.time) - minutes(b.time)); }
function weekDates() { return [...Array(7)].map((_, index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); return localDateKey(date); }); }
function streak() { let days = 0, date = new Date(); while (data.supplements.length) { const key = localDateKey(date); if (!data.supplements.every(supplement => isTaken(supplement.id, key))) break; days++; date.setDate(date.getDate() - 1); } return days; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character])); }

function render() {
  const list = scheduleList(), complete = list.filter(supplement => isTaken(supplement.id)).length, total = list.length;
  $('#todayLabel').textContent = formatDate();
  $('#greeting').innerHTML = `${greeting()}<span class="period">.</span>`;
  $('#progressText').textContent = `${complete}/${total}`;
  $('#progressRing').style.background = `conic-gradient(var(--green) ${(total ? complete / total : 0) * 360}deg,#e4e7df 0deg)`;
  $('#dailyMessage').textContent = total ? (complete === total ? 'Beautifully done for today.' : `You have ${total - complete} dose${total - complete === 1 ? '' : 's'} left today.`) : 'Let’s make today a healthy one.';
  $('#todayList').innerHTML = list.map(supplement => {
    const taken = isTaken(supplement.id), style = palette(supplement);
    return `<article class="dose-card ${taken ? 'done' : ''}"><div class="supp-icon" style="background:${style.bg}">${style.icon}</div><div><div class="supp-name">${escapeHtml(supplement.name)}</div><div class="supp-meta">${escapeHtml(supplement.dose || 'Daily dose')} · ${prettyTime(supplement.time)}</div></div><button class="check ${taken ? 'done' : ''}" data-check="${supplement.id}" aria-label="Mark ${escapeHtml(supplement.name)} as taken">✓</button></article>`;
  }).join('');
  $('#emptyToday').classList.toggle('hidden', Boolean(total)); $('#todayList').classList.toggle('hidden', !total);

  const days = weekDates(), possible = total * days.length;
  const takenThisWeek = days.reduce((count, date) => count + data.supplements.filter(supplement => isTaken(supplement.id, date)).length, 0);
  const rate = possible ? Math.round(takenThisWeek / possible * 100) : 0;
  $('#weekRate').textContent = `${rate}%`; $('#weekSummary').textContent = total ? `${takenThisWeek} of ${possible} planned doses taken this week.` : 'Add a supplement to start tracking.';
  $('#weekBars').innerHTML = days.map(date => { const count = data.supplements.filter(supplement => isTaken(supplement.id, date)).length, progress = total ? count / total : 0; return `<i style="--height:${Math.max(7, progress * 38)}px;--opacity:${.25 + progress * .75}" title="${date}"></i>`; }).join('');
  $('#takenStat').textContent = complete; $('#streakStat').textContent = streak();
  $('#activityList').innerHTML = total ? list.map(supplement => `<article class="activity-card"><div><strong>${escapeHtml(supplement.name)}</strong><br><span>${prettyTime(supplement.time)} · ${isTaken(supplement.id) ? 'Taken today' : 'Not yet taken'}</span></div><span>${isTaken(supplement.id) ? '✓' : '—'}</span></article>`).join('') : '<div class="empty-state"><p>Your supplement activity will appear here.</p></div>';
  renderHistory(list);
  $('#routineList').innerHTML = total ? list.map(supplement => { const style = palette(supplement); return `<article class="routine-card" data-edit="${supplement.id}"><div class="supp-icon" style="background:${style.bg}">${style.icon}</div><div class="routine-info"><div class="supp-name">${escapeHtml(supplement.name)}</div><div class="supp-meta">${escapeHtml(supplement.dose || 'Daily dose')} · ${prettyTime(supplement.time)}${supplement.enabled ? '' : ' · Paused'}</div></div><span class="chevron">›</span></article>`; }).join('') : '<div class="empty-state"><p>No supplements added yet.</p></div>';
  document.querySelectorAll('[data-check]').forEach(button => button.onclick = () => toggleDose(button.dataset.check));
  document.querySelectorAll('[data-history-check]').forEach(button => button.onclick = () => toggleDose(button.dataset.historyCheck, selectedHistoryDate));
  document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => openForm(data.supplements.find(supplement => supplement.id === button.dataset.edit)));
}

function renderHistory(list) {
  const dateInput = $('#historyDate'); dateInput.max = localDateKey(); dateInput.value = selectedHistoryDate;
  $('#historyDateDisplay').textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${selectedHistoryDate}T12:00:00`));
  const completed = list.filter(supplement => doseState(supplement, selectedHistoryDate) === 'taken').length;
  const missed = list.filter(supplement => doseState(supplement, selectedHistoryDate) === 'missed').length;
  const upcoming = list.filter(supplement => doseState(supplement, selectedHistoryDate) === 'upcoming').length;
  $('#historySummary').textContent = list.length ? `${formatDateKey(selectedHistoryDate)} · ${completed} taken · ${missed} missed${upcoming ? ` · ${upcoming} due later` : ''}` : 'Add a supplement to start reviewing dose history.';
  $('#historyList').innerHTML = list.map(supplement => {
    const state = doseState(supplement, selectedHistoryDate);
    const label = state === 'taken' ? 'Taken' : state === 'missed' ? 'Missed' : 'Due later';
    const className = state === 'taken' ? 'status-taken' : state === 'missed' ? 'status-missed' : '';
    const button = state === 'taken' ? 'Mark missed' : 'Mark taken';
    return `<article class="activity-card history-card"><div><strong>${escapeHtml(supplement.name)}</strong><br><span>${prettyTime(supplement.time)} · <b class="${className}">${label}</b></span></div><button class="history-check ${state === 'taken' ? '' : 'missed'}" data-history-check="${supplement.id}">${button}</button></article>`;
  }).join('');
}

function openForm(supplement) {
  const editing = Boolean(supplement); $('#formTitle').textContent = editing ? 'Edit supplement' : 'Add supplement'; $('#formEyebrow').textContent = editing ? 'YOUR ROUTINE' : 'NEW REMINDER';
  $('#supplementName').value = supplement?.name || ''; $('#supplementDose').value = supplement?.dose || ''; $('#supplementTime').value = supplement?.time || '08:00'; $('#reminderEnabled').checked = supplement?.enabled ?? true; $('#editingId').value = supplement?.id || '';
  selectedColor = Number.isInteger(supplement?.color) ? supplement.color : 0; $('#deleteSupplement').classList.toggle('hidden', !editing); renderFormChoices(); $('#supplementDialog').showModal();
}
function renderFormChoices() {
  $('#commonChips').innerHTML = COMMON.map(name => `<button type="button" class="chip" data-name="${name}">${name}</button>`).join('');
  $('#colorChoices').innerHTML = PALETTES.map((color, index) => `<button type="button" class="color-dot ${index === selectedColor ? 'selected' : ''}" style="background:${color.bg}" data-color="${index}" aria-label="Choose colour ${index + 1}" aria-pressed="${index === selectedColor}"></button>`).join('');
  document.querySelectorAll('[data-name]').forEach(button => button.onclick = () => { $('#supplementName').value = button.dataset.name; });
  document.querySelectorAll('[data-color]').forEach(button => button.onclick = event => { event.preventDefault(); selectedColor = Number(button.dataset.color); renderFormChoices(); });
}

$('#supplementForm').addEventListener('submit', event => {
  event.preventDefault(); const id = $('#editingId').value, existing = data.supplements.find(supplement => supplement.id === id);
  const entry = { id: id || crypto.randomUUID(), name: $('#supplementName').value.trim(), dose: $('#supplementDose').value.trim(), time: $('#supplementTime').value, color: selectedColor, enabled: $('#reminderEnabled').checked, createdAt: existing?.createdAt || localDateKey() };
  if (!entry.name) return; if (id) data.supplements = data.supplements.map(supplement => supplement.id === id ? entry : supplement); else data.supplements.push(entry); $('#supplementDialog').close(); save();
});
$('#deleteSupplement').onclick = () => { const id = $('#editingId').value; data.supplements = data.supplements.filter(supplement => supplement.id !== id); Object.keys(data.history).forEach(date => data.history[date] = data.history[date].filter(item => item !== id)); $('#supplementDialog').close(); save(); };
['quickAddButton', 'emptyAddButton', 'routineAddButton'].forEach(id => $('#' + id).onclick = () => openForm());
$('#historyDate').onchange = event => { if (event.target.value && event.target.value <= localDateKey()) { selectedHistoryDate = event.target.value; render(); } };
document.querySelectorAll('.tab').forEach(button => button.onclick = () => { document.querySelectorAll('.tab,.view').forEach(element => element.classList.remove('active')); button.classList.add('active'); $('#' + button.dataset.tab).classList.add('active'); });
$('#settingsButton').onclick = async () => { await refreshNotificationStatus(); $('#settingsDialog').showModal(); }; $('#notificationButton').onclick = enableNotifications;
async function refreshNotificationStatus() { const plugin = window.Capacitor?.Plugins?.LocalNotifications; let granted = false; try { granted = plugin ? (await plugin.checkPermissions()).display === 'granted' : ('Notification' in window && Notification.permission === 'granted'); } catch (error) { console.warn('Unable to check notification permissions', error); } $('#notificationButton').textContent = granted ? 'Notifications enabled' : 'Enable notifications'; }
async function enableNotifications() { const plugin = window.Capacitor?.Plugins?.LocalNotifications; if (plugin) { const result = await plugin.requestPermissions(); $('#notificationButton').textContent = result.display === 'granted' ? 'Notifications enabled' : 'Notifications unavailable'; if (result.display === 'granted') syncNativeReminders(); return; } if (!('Notification' in window)) return; const result = await Notification.requestPermission(); $('#notificationButton').textContent = result === 'granted' ? 'Notifications enabled' : 'Notifications unavailable'; }
function nativeNotificationId(supplement) { return supplement.notificationId || [...supplement.id].reduce((number, character) => (number * 31 + character.charCodeAt(0)) % 2000000000, 17); }
async function syncNativeReminders() { const plugin = window.Capacitor?.Plugins?.LocalNotifications; if (!plugin) return; try { const notifications = data.supplements.map(supplement => ({ id: nativeNotificationId(supplement) })); if (notifications.length) await plugin.cancel({ notifications }); const scheduled = data.supplements.filter(supplement => supplement.enabled).map(supplement => { const [hour, minute] = supplement.time.split(':').map(Number); return { id: nativeNotificationId(supplement), title: `Time for ${supplement.name}`, body: supplement.dose || 'Your daily supplement', schedule: { on: { hour, minute }, repeats: true }, extra: { supplementId: supplement.id } }; }); if (scheduled.length) await plugin.schedule({ notifications: scheduled }); } catch (error) { console.warn('Unable to synchronize native reminders', error); } }
function reminderCheck() { if (!('Notification' in window) || Notification.permission !== 'granted') return; const now = new Date(), key = localDateKey(); data.supplements.filter(supplement => supplement.enabled && !isTaken(supplement.id)).forEach(supplement => { const notificationKey = key + supplement.id; if (!notified[notificationKey] && Math.abs(now.getHours() * 60 + now.getMinutes() - minutes(supplement.time)) < 1) { new Notification(`Time for ${supplement.name}`, { body: supplement.dose || 'Your daily supplement' }); notified[notificationKey] = true; } }); }
setInterval(reminderCheck, 30000); refreshNotificationStatus(); render(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
