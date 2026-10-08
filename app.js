const COMMON = ['Vitamin D3', 'Vitamin B12', 'Omega-3', 'Magnesium', 'Iron', 'Zinc', 'Probiotic', 'Calcium'];
const PALETTES = [{ bg: '#f6d1c0', icon: '☀' }, { bg: '#ded8f5', icon: '✦' }, { bg: '#d9ec9c', icon: '◒' }, { bg: '#f7e7a0', icon: '●' }, { bg: '#cce8e4', icon: '♥' }];
const storageKey = 'daily-dose-data-v1';
let data = JSON.parse(localStorage.getItem(storageKey) || '{"supplements":[],"history":{}}');
let selectedColor = 0, notified = {};
const $ = s => document.querySelector(s), todayKey = () => new Date().toISOString().slice(0, 10);
function save() { localStorage.setItem(storageKey, JSON.stringify(data)); render(); syncNativeReminders(); }
function dateLabel() { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase() }
function minutes(time) { let [h, m] = time.split(':').map(Number); return h * 60 + m }
function prettyTime(time) { return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
function status(id, date = todayKey()) { return data.history[date]?.includes(id) }
function toggle(id) { let d = todayKey(); data.history[d] ??= []; data.history[d] = status(id, d) ? data.history[d].filter(x => x !== id) : [...data.history[d], id]; save() }
function getWeek() { return [...Array(7)].map((_, i) => { let d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().slice(0, 10) }) }
function streak() { let n = 0, d = new Date(); while (true) { let k = d.toISOString().slice(0, 10), total = data.supplements.length; if (!total || !data.history[k] || data.history[k].length < total) break; n++; d.setDate(d.getDate() - 1) } return n }
function render() {
  $('#todayLabel').textContent = dateLabel(); let list = [...data.supplements].sort((a, b) => minutes(a.time) - minutes(b.time)); let complete = list.filter(s => status(s.id)).length, total = list.length;
  $('#progressText').textContent = `${complete}/${total}`; $('#progressRing').style.background = `conic-gradient(var(--green) ${(total ? complete / total : 0) * 360}deg,#e4e7df 0deg)`;
  $('#dailyMessage').textContent = total ? (complete === total ? 'Beautifully done for today.' : 'You have ' + (total - complete) + ' dose' + (total - complete === 1 ? '' : 's') + ' left today.') : 'Let’s make today a healthy one.';
  $('#todayList').innerHTML = list.map(s => `<article class="dose-card ${status(s.id) ? 'done' : ''}"><div class="supp-icon" style="background:${PALETTES[s.color].bg}">${PALETTES[s.color].icon}</div><div><div class="supp-name">${escapeHtml(s.name)}</div><div class="supp-meta">${escapeHtml(s.dose || 'Daily dose')} · ${prettyTime(s.time)}</div></div><button class="check ${status(s.id) ? 'done' : ''}" data-check="${s.id}" aria-label="Mark ${escapeHtml(s.name)} as taken">✓</button></article>`).join('');
  $('#emptyToday').classList.toggle('hidden', !!total); $('#todayList').classList.toggle('hidden', !total);
  let days = getWeek(), possible = total * 7, taken = days.reduce((n, d) => n + (data.history[d]?.filter(id => data.supplements.some(s => s.id === id)).length || 0), 0), rate = possible ? Math.round(taken / possible * 100) : 0;
  $('#weekRate').textContent = rate + '%'; $('#weekSummary').textContent = total ? `${taken} of ${possible} planned doses taken this week.` : 'Add a supplement to start tracking.';
  $('#weekBars').innerHTML = days.map(d => { let c = data.history[d]?.length || 0, p = total ? Math.min(1, c / total) : 0; return `<i style="--height:${Math.max(7, p * 38)}px;--opacity:${.25 + p * .75}" title="${d}"></i>` }).join('');
  $('#takenStat').textContent = complete; $('#streakStat').textContent = streak();
  $('#activityList').innerHTML = total ? list.map(s => `<article class="activity-card"><div><strong>${escapeHtml(s.name)}</strong><br><span>${prettyTime(s.time)} · ${status(s.id) ? 'Taken today' : 'Not yet taken'}</span></div><span>${status(s.id) ? '✓' : '—'}</span></article>`).join('') : '<div class="empty-state"><p>Your supplement activity will appear here.</p></div>';
  $('#routineList').innerHTML = total ? list.map(s => `<article class="routine-card" data-edit="${s.id}"><div class="supp-icon" style="background:${PALETTES[s.color].bg}">${PALETTES[s.color].icon}</div><div class="routine-info"><div class="supp-name">${escapeHtml(s.name)}</div><div class="supp-meta">${escapeHtml(s.dose || 'Daily dose')} · ${prettyTime(s.time)}${s.enabled ? '' : ' · Paused'}</div></div><span class="chevron">›</span></article>`).join('') : '<div class="empty-state"><p>No supplements added yet.</p></div>';
  document.querySelectorAll('[data-check]').forEach(b => b.onclick = () => toggle(b.dataset.check)); document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(data.supplements.find(s => s.id === b.dataset.edit)));
}
function escapeHtml(t) { return t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
function openForm(s) { let editing = !!s; $('#formTitle').textContent = editing ? 'Edit supplement' : 'Add supplement'; $('#formEyebrow').textContent = editing ? 'YOUR ROUTINE' : 'NEW REMINDER'; $('#supplementName').value = s?.name || ''; $('#supplementDose').value = s?.dose || ''; $('#supplementTime').value = s?.time || '08:00'; $('#reminderEnabled').checked = s?.enabled ?? true; $('#editingId').value = s?.id || ''; selectedColor = s?.color || 0; $('#deleteSupplement').classList.toggle('hidden', !editing); renderFormChoices(); $('#supplementDialog').showModal() }
function renderFormChoices() { $('#commonChips').innerHTML = COMMON.map(n => `<button type="button" class="chip" data-name="${n}">${n}</button>`).join(''); $('#colorChoices').innerHTML = PALETTES.map((p, i) => `<button type="button" class="color-dot ${i === selectedColor ? 'selected' : ''}" style="background:${p.bg}" data-color="${i}"></button>`).join(''); document.querySelectorAll('[data-name]').forEach(b => b.onclick = () => { $('#supplementName').value = b.dataset.name }); document.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { selectedColor = +b.dataset.color; renderFormChoices() }) }
$('#supplementForm').addEventListener('submit', e => { e.preventDefault(); let id = $('#editingId').value, entry = { id: id || crypto.randomUUID(), name: $('#supplementName').value.trim(), dose: $('#supplementDose').value.trim(), time: $('#supplementTime').value, color: selectedColor, enabled: $('#reminderEnabled').checked }; if (!entry.name) return; if (id) data.supplements = data.supplements.map(s => s.id === id ? entry : s); else data.supplements.push(entry); $('#supplementDialog').close(); save() });
$('#deleteSupplement').onclick = () => { let id = $('#editingId').value; data.supplements = data.supplements.filter(s => s.id !== id); Object.keys(data.history).forEach(d => data.history[d] = data.history[d].filter(x => x !== id)); $('#supplementDialog').close(); save() };
['quickAddButton', 'emptyAddButton', 'routineAddButton'].forEach(id => $('#' + id).onclick = () => openForm());
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { document.querySelectorAll('.tab,.view').forEach(x => x.classList.remove('active')); b.classList.add('active'); $('#' + b.dataset.tab).classList.add('active') });
$('#settingsButton').onclick = () => $('#settingsDialog').showModal(); $('#notificationButton').onclick = enableNotifications;
async function enableNotifications() {
  const nativePlugin = window.Capacitor?.Plugins?.LocalNotifications;
  if (nativePlugin) { const result = await nativePlugin.requestPermissions(); $('#notificationButton').textContent = result.display === 'granted' ? 'Notifications enabled' : 'Notifications unavailable'; if (result.display === 'granted') syncNativeReminders(); return }
  if (!('Notification' in window)) return; let r = await Notification.requestPermission(); $('#notificationButton').textContent = r === 'granted' ? 'Notifications enabled' : 'Notifications unavailable'
}
function nativeNotificationId(s) { return s.notificationId || [...s.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 2000000000, 17) }
async function syncNativeReminders() {
  const nativePlugin = window.Capacitor?.Plugins?.LocalNotifications;
  if (!nativePlugin) return;
  try {
    const notifications = data.supplements.map(s => ({ id: nativeNotificationId(s) }));
    if (notifications.length) await nativePlugin.cancel({ notifications });
    const scheduled = data.supplements.filter(s => s.enabled).map(s => { const [hour, minute] = s.time.split(':').map(Number); return { id: nativeNotificationId(s), title: `Time for ${s.name}`, body: s.dose || 'Your daily supplement', schedule: { on: { hour, minute }, repeats: true }, extra: { supplementId: s.id } } });
    if (scheduled.length) await nativePlugin.schedule({ notifications: scheduled });
  } catch (error) { console.warn('Unable to synchronize native reminders', error) }
}
function reminderCheck() { if (Notification.permission !== 'granted') return; let now = new Date(), key = todayKey(); data.supplements.filter(s => s.enabled && !status(s.id)).forEach(s => { let k = key + s.id; if (!notified[k] && Math.abs(now.getHours() * 60 + now.getMinutes() - minutes(s.time)) < 1) { new Notification('Time for ' + s.name, { body: s.dose || 'Your daily supplement' }); notified[k] = true } }) } setInterval(reminderCheck, 30000); render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
