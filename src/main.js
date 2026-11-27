import './style.css';

let echarts;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const stationNames = { walking: '行走测试', welding: '焊接工位', assembly: '装配工位' };
const state = { type: 'all', min: null, max: null, sort: 'default', openParam: null, chartStation: 'all', faultRange: 'today', activeAlarm: null };
let toastTimer;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
function animateValue(el, target, decimals = 0) {
  const start = Number(el.textContent) || 0; const begin = performance.now(); const duration = 450;
  const frame = now => { const p = Math.min((now - begin) / duration, 1); const eased = 1 - Math.pow(1 - p, 3); el.textContent = (start + (target - start) * eased).toFixed(decimals); if (p < 1) requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function clock() { const now = new Date(); const time = now.toLocaleTimeString('zh-CN', { hour12: false }); $('#topTime').textContent = time; $('#heroTime').textContent = time; $('#heroDate').textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
clock(); setInterval(clock, 1000);

const robots = [
  { id: 'WALK-R01', model: 'H1 Pro', speed: 1.42, precision: 99.2, battery: 86, pass: 98.6, state: '测试中', temp: 42 },
  { id: 'WALK-R02', model: 'H1 Air', speed: 1.28, precision: 98.7, battery: 72, pass: 97.9, state: '测试中', temp: 45 },
  { id: 'WALK-R03', model: 'H2 Max', speed: 1.65, precision: 99.5, battery: 94, pass: 99.2, state: '已完成', temp: 39 },
  { id: 'WALK-R04', model: 'H1 Lite', speed: 1.10, precision: 96.8, battery: 61, pass: 93.4, state: '异常', temp: 67 }
];
function renderWalking() {
  $('#walkingGrid').innerHTML = robots.map(r => `<article class="walk-card" tabindex="0" role="button" aria-label="查看 ${r.id} 详情" data-robot="${r.id}"><div class="walk-head"><div class="walk-id"><i class="fa-solid fa-person-walking"></i><div><strong>${r.id}</strong><small>${r.model} · 行走测试单元</small></div></div><span class="state-label">${r.state}</span></div><div class="walk-metrics"><div><span><i class="fa-solid fa-gauge-high"></i> 行走速度</span><strong data-robot-speed="${r.id}">${r.speed.toFixed(2)}</strong> <small>m/s</small></div><div><span><i class="fa-solid fa-crosshairs"></i> 步距精度</span><strong>${r.precision.toFixed(1)}</strong> <small>%</small></div><div><span><i class="fa-regular fa-clock"></i> 续航时长</span><strong>${r.battery}</strong> <small>min</small></div><div><span><i class="fa-solid fa-temperature-half"></i> 电机温度</span><strong>${r.temp}</strong> <small>℃</small></div></div><div class="walk-pass"><span>本次测试通过率</span><b>${r.pass.toFixed(1)}%</b></div></article>`).join('');
  $$('.walk-card').forEach(card => { card.addEventListener('click', () => showRobotDetail(card.dataset.robot)); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } }); });
}
renderWalking();

const stations = [
  { id: 'W-01', type: 'welding', title: '焊接工位', code: 'WELDING STATION', icon: 'fa-fire-flame-curved', status: 'normal', statusText: '正常', metrics: [['焊接温度', '1,260', '℃'], ['焊缝精度', '0.08', 'mm'], ['电极损耗率', '12.6', '%'], ['焊接良率', '99.1', '%']] },
  { id: 'A-01', type: 'assembly', title: '装配工位', code: 'ASSEMBLY STATION', icon: 'fa-screwdriver-wrench', status: 'warning', statusText: '预警', metrics: [['螺丝扭矩', '2.42', 'N·m'], ['装配偏差', '0.21', 'mm'], ['装配耗时', '86', 's'], ['装配良率', '97.8', '%']] },
  { id: 'W-02', type: 'welding', title: '焊接工位', code: 'WELDING STATION', icon: 'fa-fire-flame-curved', status: 'danger', statusText: '故障', metrics: [['焊接温度', '1,410', '℃'], ['焊缝精度', '0.16', 'mm'], ['电极损耗率', '28.3', '%'], ['焊接良率', '94.2', '%']] },
  { id: 'A-02', type: 'assembly', title: '装配工位', code: 'ASSEMBLY STATION', icon: 'fa-screwdriver-wrench', status: 'normal', statusText: '正常', metrics: [['螺丝扭矩', '2.38', 'N·m'], ['装配偏差', '0.09', 'mm'], ['装配耗时', '79', 's'], ['装配良率', '99.4', '%']] }
];
function renderStations() {
  $('#stationGrid').innerHTML = stations.map(s => `<article class="station-card ${s.status === 'normal' ? '' : s.status}"><div class="station-head"><div class="station-title"><i class="fa-solid ${s.icon}"></i><div><strong>${s.title} · ${s.id}</strong><small>${s.code}</small></div></div><span class="station-state"><i class="fa-solid ${s.status === 'normal' ? 'fa-circle-check' : s.status === 'warning' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'}"></i>${s.statusText}</span></div><div class="station-metrics">${s.metrics.map(m => `<div><span>${m[0]}</span><strong>${m[1]}</strong> <small>${m[2]}</small></div>`).join('')}</div></article>`).join('');
}
renderStations();

const parameters = [
  { id: 'voltage', name: '电池电压', type: 'power', icon: 'fa-battery-full', value: 48.6, unit: 'V', min: 44, max: 52, status: '正常' },
  { id: 'rpm', name: '电机转速', type: 'power', icon: 'fa-gear', value: 1860, unit: 'rpm', min: 0, max: 3000, status: '正常' },
  { id: 'force', name: '力觉传感器', type: 'sensor', icon: 'fa-hand-fist', value: 18.4, unit: 'N', min: 0, max: 50, status: '正常' },
  { id: 'vision', name: '视觉传感器', type: 'sensor', icon: 'fa-eye', value: 99.2, unit: '%', min: 0, max: 100, status: '正常' },
  { id: 'touch', name: '触觉传感器', type: 'sensor', icon: 'fa-hand-pointer', value: 0.36, unit: 'N', min: 0, max: 2, status: '正常' },
  { id: 'current', name: '驱动电流', type: 'power', icon: 'fa-bolt', value: 12.8, unit: 'A', min: 0, max: 20, status: '正常' }
];
function sparkline(id) {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0); const values = Array.from({ length: 11 }, (_, i) => 28 + ((seed * (i + 3) * 7) % 44));
  let html = '<div class="sparkline">'; values.forEach(() => html += '<i></i>');
  for (let i = 0; i < values.length - 1; i++) { const x = i * 10, y = values[i], nx = (i + 1) * 10, ny = values[i + 1]; const length = Math.hypot(nx - x, y - ny); const angle = Math.atan2(ny - y, nx - x) * 180 / Math.PI; html += `<span class="line-segment" style="left:${x}%;top:${y}%;width:${length}%;transform:rotate(${angle}deg)"></span>`; }
  return html + '</div>';
}
function visibleParameters() { let list = parameters.filter(p => (state.type === 'all' || p.type === state.type) && (state.min === null || p.value >= state.min) && (state.max === null || p.value <= state.max)); if (state.sort !== 'default') list.sort((a, b) => state.sort === 'asc' ? a.value - b.value : b.value - a.value); return list; }
function renderParameters() {
  const list = visibleParameters();
  $('#parameterGrid').innerHTML = list.length ? list.map(p => `<article class="parameter-card ${state.openParam === p.id ? 'open' : ''}" tabindex="0" role="button" aria-expanded="${state.openParam === p.id}" data-param="${p.id}"><div class="param-top"><span class="param-name"><i class="fa-solid ${p.icon}"></i>${p.name}</span><span class="param-type">${p.type === 'power' ? '动力' : '传感器'}</span></div><div class="param-value"><span data-value="${p.id}">${p.value}</span> <small>${p.unit}</small></div><div class="param-foot"><span class="param-normal">● ${p.status}</span><span>阈值 ${p.min}–${p.max} ${p.unit}</span></div></article><div class="param-detail" id="detail-${p.id}"><div class="detail-title"><span>${p.name} · 近 10 分钟趋势</span><span>实时采样 · 10 个数据点</span></div>${sparkline(p.id)}</div>`).join('') : '<p style="color:#7e94ad;font-size:12px;padding:25px;text-align:center">当前筛选条件下暂无参数</p>';
  $$('.parameter-card').forEach(card => { const toggle = () => { state.openParam = state.openParam === card.dataset.param ? null : card.dataset.param; renderParameters(); }; card.addEventListener('click', toggle); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }); });
}
renderParameters();
$$('.filter-btn').forEach(btn => btn.addEventListener('click', () => { $$('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); state.type = btn.dataset.type; renderParameters(); }));
function applyRange() { const min = $('#minValue').value, max = $('#maxValue').value; state.min = min === '' ? null : Number(min); state.max = max === '' ? null : Number(max); renderParameters(); }
$('#minValue').addEventListener('input', applyRange); $('#maxValue').addEventListener('input', applyRange);
$('#rangeReset').addEventListener('click', () => { $('#minValue').value = ''; $('#maxValue').value = ''; applyRange(); });
$('#sortOrder').addEventListener('change', e => { state.sort = e.target.value; renderParameters(); });

// 模拟 JSON 生产数据：日期、产线、产能、良品率、型号字段完整。
const productionData = {
  dates: ['11/21', '11/22', '11/23', '11/24', '11/25', '11/26', '11/27'],
  capacity: { walking: [82, 91, 88, 96, 101, 94, 98], welding: [64, 71, 69, 76, 73, 81, 79], assembly: [75, 83, 80, 88, 92, 86, 90] },
  quality: { walking: 36, welding: 32, assembly: 32 },
  models: { walking: [['H1 Pro', 12.6], ['H1 Air', 14.2], ['H1 Lite', 16.8]], welding: [['H2 Max', 10.8], ['H2 Pro', 11.9], ['H2 Air', 13.4]], assembly: [['A1 Pro', 18.2], ['A1 Air', 20.6], ['A1 Lite', 22.4]] }
};
const charts = {};
let chartsLoading = false;
const chartColor = { walking: '#43c9e8', welding: '#ffbd4a', assembly: '#30d99a' };
async function initCharts() {
  if (charts.capacity || chartsLoading) return;
  chartsLoading = true;
  const [core, chartTypes, components, renderers] = await Promise.all([
    import('echarts/core'), import('echarts/charts'), import('echarts/components'), import('echarts/renderers')
  ]);
  echarts = core;
  echarts.use([chartTypes.LineChart, chartTypes.PieChart, chartTypes.BarChart, components.GridComponent, components.TooltipComponent, components.LegendComponent, renderers.CanvasRenderer]);
  const definitions = [['capacity', '#capacityChart'], ['quality', '#qualityChart'], ['model', '#modelChart']];
  definitions.forEach(([key, selector]) => { const el = $(selector); if (el.clientWidth > 0 && el.clientHeight > 0) charts[key] = echarts.init(el); });
  updateCharts();
  chartsLoading = false;
}
const chartObserver = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { initCharts(); chartObserver.disconnect(); } }, { rootMargin: '200px' });
chartObserver.observe($('#analytics'));
function updateCharts() {
  if (!charts.capacity) return;
  const selected = state.chartStation === 'all' ? Object.keys(stationNames) : [state.chartStation];
  if (charts.capacity) charts.capacity.setOption({
    color: selected.map(s => chartColor[s]), tooltip: { trigger: 'axis', backgroundColor: '#102239', borderColor: '#28425f', textStyle: { color: '#c8d8e8' } }, legend: { top: 0, right: 0, textStyle: { color: '#7e94ad' }, itemWidth: 14, itemHeight: 8 }, grid: { left: 42, right: 20, top: 48, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: productionData.dates, axisLine: { lineStyle: { color: '#223a54' } }, axisLabel: { color: '#70869e' } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(93,138,193,.12)' } }, axisLabel: { color: '#70869e' } },
    series: selected.map(s => ({ name: stationNames[s], type: 'line', smooth: true, showSymbol: false, symbolSize: 7, lineStyle: { width: 2.5 }, areaStyle: { opacity: .08 }, data: productionData.capacity[s] }))
  }, true);
  if (charts.quality) charts.quality.setOption({
    color: selected.map(s => chartColor[s]), tooltip: { trigger: 'item', formatter: '{b}: {c}%', backgroundColor: '#102239', borderColor: '#28425f', textStyle: { color: '#c8d8e8' } }, legend: { bottom: 0, textStyle: { color: '#7e94ad' }, itemWidth: 12, itemHeight: 8 },
    series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'], avoidLabelOverlap: true, padAngle: 3, itemStyle: { borderRadius: 5, borderColor: '#0d1b2d', borderWidth: 2 }, label: { show: true, formatter: '{b}\n{c}%', color: '#9eb1c5', fontSize: 10 }, data: selected.map(s => ({ name: stationNames[s], value: productionData.quality[s] })) }]
  }, true);
  if (charts.model) charts.model.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#102239', borderColor: '#28425f', textStyle: { color: '#c8d8e8' } }, grid: { left: 45, right: 20, top: 25, bottom: 35 }, xAxis: { type: 'category', data: productionData.models[selected[0]].map(m => m[0]), axisLine: { lineStyle: { color: '#223a54' } }, axisLabel: { color: '#70869e' } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(93,138,193,.12)' } }, axisLabel: { color: '#70869e' } },
    series: [{ type: 'bar', barWidth: 34, itemStyle: { borderRadius: [5, 5, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: chartColor[selected[0]] }, { offset: 1, color: 'rgba(61,127,255,.15)' }]) }, label: { show: true, position: 'top', color: '#9eb1c5' }, data: productionData.models[selected[0]].map(m => m[1]) }]
  }, true);
}
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    if (!echarts) await initCharts();
    [['quality', '#qualityChart'], ['model', '#modelChart']].forEach(([key, selector]) => { const el = $(selector); if (!charts[key] && el.clientWidth > 0 && el.clientHeight > 0) charts[key] = echarts.init(el); });
    Object.values(charts).forEach(c => c.resize());
    updateCharts();
  }, 150);
});
$('#stationFilter').addEventListener('change', e => { state.chartStation = e.target.value; updateCharts(); toast(`图表已切换至${e.target.selectedOptions[0].textContent}`); });

const now = Date.now();
const faults = [
  { id: 'ALM-1127-003', device: 'H1-R017', type: '电机温度超限', section: '装配工位', time: new Date(now - 1000 * 60 * 18), status: 'pending' },
  { id: 'ALM-1127-002', device: 'H2-R009', type: '力觉传感器异常', section: '行走测试', time: new Date(now - 1000 * 60 * 52), status: 'pending' },
  { id: 'ALM-1126-011', device: 'H1-R012', type: '电池电压过低', section: '焊接工位', time: new Date(now - 1000 * 60 * 60 * 26), status: 'done' },
  { id: 'ALM-1125-008', device: 'H2-R021', type: '视觉识别偏移', section: '装配工位', time: new Date(now - 1000 * 60 * 60 * 50), status: 'ignored' },
  { id: 'ALM-1129-005', device: 'H1-R006', type: '电机转速异常', section: '行走测试', time: new Date(now - 1000 * 60 * 60 * 24 * 9), status: 'done' },
  { id: 'ALM-1118-002', device: 'H2-R014', type: '焊接温度过高', section: '焊接工位', time: new Date(now - 1000 * 60 * 60 * 24 * 18), status: 'done' }
];
const statusText = { pending: '未处理', done: '已处理', ignored: '已忽略' };
function isInRange(date) { const start = new Date(); start.setHours(0, 0, 0, 0); if (state.faultRange === '7d') start.setDate(start.getDate() - 6); if (state.faultRange === '30d') start.setDate(start.getDate() - 29); return date >= start; }
function renderFaults() {
  const list = faults.filter(f => isInRange(f.time));
  $('#faultTableBody').innerHTML = list.map(f => `<tr><td><strong>${f.id}</strong></td><td>${f.device}</td><td>${f.type}</td><td>${f.section}</td><td>${f.time.toLocaleString('zh-CN', { hour12: false })}</td><td><span class="fault-state ${f.status}">${statusText[f.status]}</span></td><td>${f.status === 'pending' ? `<button class="row-action" data-fault="${f.id}">立即处理</button>` : '<span style="color:#526b85">—</span>'}</td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px">该时间段暂无故障记录</td></tr>';
  $$('.row-action').forEach(btn => btn.addEventListener('click', () => openAlarm(faults.find(f => f.id === btn.dataset.fault))));
  const pending = faults.filter(f => f.status === 'pending').length; $('#alarmBadge').textContent = pending; $('#alarmBadge').style.display = pending ? 'grid' : 'none';
}
renderFaults();
$$('.segmented button').forEach(btn => btn.addEventListener('click', () => { $$('.segmented button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); state.faultRange = btn.dataset.range; renderFaults(); }));
function openAlarm(fault) { state.activeAlarm = fault; $('#alarmDetail').innerHTML = `<div><span>设备 ID</span><strong>${fault.device}</strong></div><div><span>故障类型</span><strong style="color:#ff8390">${fault.type}</strong></div><div><span>发生工段</span><strong>${fault.section}</strong></div><div><span>发生时间</span><strong>${fault.time.toLocaleTimeString('zh-CN', { hour12: false })}</strong></div>`; $('#alarmModal').classList.add('show'); $('#confirmAlarm').focus(); }
function closeAlarm() { $('#alarmModal').classList.remove('show'); state.activeAlarm = null; }
function resolveAlarm(status) { if (!state.activeAlarm) return; state.activeAlarm.status = status; renderFaults(); closeAlarm(); toast(status === 'done' ? '告警已确认，故障状态更新为“已处理”' : '已忽略本次告警'); }
$('#confirmAlarm').addEventListener('click', () => resolveAlarm('done')); $('#ignoreAlarm').addEventListener('click', () => resolveAlarm('ignored'));
$('#alarmModal').addEventListener('click', e => { if (e.target === $('#alarmModal')) closeAlarm(); });
$('#alarmShortcut').addEventListener('click', () => { $('#alarms').scrollIntoView({ behavior: 'smooth' }); });
$('#exportBtn').addEventListener('click', () => {
  const rows = [['故障编号', '设备ID', '故障类型', '发生工段', '发生时间', '状态'], ...faults.filter(f => isInRange(f.time)).map(f => [f.id, f.device, f.type, f.section, f.time.toLocaleString('zh-CN', { hour12: false }), statusText[f.status]])];
  const csv = '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = `机器人故障记录_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); toast('CSV 故障记录已导出');
});

function showRobotDetail(id) { const r = robots.find(x => x.id === id); $('#detailContent').innerHTML = `<p class="kicker">ROBOT DETAIL</p><h2 id="detailModalTitle">${r.id} · ${r.model}</h2><div class="detail-grid"><div><span>设备状态</span><strong>${r.state}</strong></div><div><span>行走速度</span><strong>${r.speed.toFixed(2)} m/s</strong></div><div><span>步距精度</span><strong>${r.precision}%</strong></div><div><span>续航时长</span><strong>${r.battery} min</strong></div><div><span>测试通过率</span><strong>${r.pass}%</strong></div><div><span>电机温度</span><strong>${r.temp}℃</strong></div></div>`; $('#detailModal').classList.add('show'); }
$('#closeDetail').addEventListener('click', () => $('#detailModal').classList.remove('show')); $('#detailModal').addEventListener('click', e => { if (e.target === $('#detailModal')) $('#detailModal').classList.remove('show'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAlarm(); $('#detailModal').classList.remove('show'); closeMenu(); } });

const menuBtn = $('#menuBtn'), sidebar = $('#sidebar'), mask = $('#mobileMask');
function closeMenu() { sidebar.classList.remove('open'); mask.classList.remove('show'); menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => { const open = sidebar.classList.toggle('open'); mask.classList.toggle('show', open); menuBtn.setAttribute('aria-expanded', String(open)); }); mask.addEventListener('click', closeMenu);
$$('.nav-item').forEach(a => a.addEventListener('click', () => { $$('.nav-item').forEach(n => n.classList.remove('active')); a.classList.add('active'); closeMenu(); }));
const navObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { $$('.nav-item').forEach(n => n.classList.toggle('active', n.getAttribute('href') === `#${entry.target.id}`)); } }); }, { rootMargin: '-20% 0px -65% 0px' });
['overview', 'walking', 'stations', 'parameters', 'analytics', 'alarms'].forEach(id => navObserver.observe(document.getElementById(id)));

// WebSocket 兼容的模拟后端：复用原生 WebSocket 事件协议，无需外部服务。
class MockWebSocket extends EventTarget {
  constructor() { super(); this.readyState = WebSocket.OPEN; setTimeout(() => this.dispatchEvent(new Event('open')), 0); this.timer = setInterval(() => this.push(), 3000); }
  push() { const message = { type: 'telemetry', timestamp: Date.now(), running: 13 + Math.floor(Math.random() * 4), output: 92 + Math.floor(Math.random() * 6), yieldRate: 98.2 + Math.random() * .6, faults: 2, latency: 12 + Math.floor(Math.random() * 18) }; this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) })); }
  close() { clearInterval(this.timer); this.readyState = WebSocket.CLOSED; this.dispatchEvent(new CloseEvent('close')); }
}
const socket = new MockWebSocket();
socket.addEventListener('open', () => { $('#lastSync').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false }); });
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data); const map = { running: 'running', output: 'output', yield: 'yieldRate' }; Object.entries(map).forEach(([key, field]) => animateValue($(`[data-live="${key}"]`), data[field], key === 'yield' ? 1 : 0)); animateValue($('[data-live="faults"]'), data.faults); $('#latency').textContent = `${data.latency} ms`; $('#lastSync').textContent = new Date(data.timestamp).toLocaleTimeString('zh-CN', { hour12: false });
  robots.forEach(r => { r.speed = Math.max(.8, r.speed + (Math.random() - .5) * .04); r.temp = Math.max(35, Math.min(78, r.temp + (Math.random() - .5) * .6)); const speedEl = $(`[data-robot-speed="${r.id}"]`); if (speedEl) speedEl.textContent = r.speed.toFixed(2); });
  parameters.forEach(p => { p.value = Math.max(p.min, Math.min(p.max, p.value + (Math.random() - .5) * (p.unit === 'rpm' ? 8 : .04))); const el = $(`[data-value="${p.id}"]`); if (el) el.textContent = p.value.toFixed(p.unit === 'rpm' ? 0 : p.unit === '%' ? 1 : 2); });
});
let alarmTick = 0;
setInterval(() => { alarmTick++; if (alarmTick % 15 !== 0) return; const fault = { id: `ALM-${Date.now().toString().slice(-6)}`, device: 'H1-R023', type: '电机温度超限（86℃）', section: '装配工位', time: new Date(), status: 'pending' }; faults.unshift(fault); renderFaults(); openAlarm(fault); }, 3000);
window.addEventListener('beforeunload', () => socket.close());
