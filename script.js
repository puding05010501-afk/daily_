/* ===========================================================
   오늘뭐입지 - 날짜/지역별 날씨 기반 코디 추천
   데이터: Open-Meteo (API 키 불필요)
   =========================================================== */

const $ = (sel) => document.querySelector(sel);

/* ---------- 날씨 코드(WMO) ---------- */
const WMO = {
  0: ['☀️', '맑음'], 1: ['🌤️', '대체로 맑음'], 2: ['⛅', '구름 조금'], 3: ['☁️', '흐림'],
  45: ['🌫️', '안개'], 48: ['🌫️', '짙은 안개'],
  51: ['🌦️', '약한 이슬비'], 53: ['🌦️', '이슬비'], 55: ['🌧️', '강한 이슬비'],
  56: ['🌧️', '어는 이슬비'], 57: ['🌧️', '어는 이슬비'],
  61: ['🌧️', '약한 비'], 63: ['🌧️', '비'], 65: ['🌧️', '강한 비'],
  66: ['🌧️', '어는 비'], 67: ['🌧️', '어는 비'],
  71: ['🌨️', '약한 눈'], 73: ['🌨️', '눈'], 75: ['❄️', '폭설'], 77: ['🌨️', '싸락눈'],
  80: ['🌦️', '소나기'], 81: ['🌧️', '소나기'], 82: ['⛈️', '강한 소나기'],
  85: ['🌨️', '눈 소나기'], 86: ['❄️', '강한 눈 소나기'],
  95: ['⛈️', '뇌우'], 96: ['⛈️', '우박 동반 뇌우'], 99: ['⛈️', '우박 동반 뇌우'],
};
const wmo = (c) => WMO[c] || ['🌡️', '정보 없음'];
const isSnow = (c) => [71, 73, 75, 77, 85, 86].includes(c);
const isRain = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;

/* ---------- 기온별 옷차림 (체감 평균기온 기준) ---------- */
const it = (e, n) => ({ e, n });
const BANDS = [
  { min: 28, range: '28°C 이상', title: '한여름 무더위', color: '#ef4444',
    summary: '최대한 가볍고 통풍이 잘 되는 소재를 고르세요.',
    outer: [], top: [it('🎽', '민소매'), it('👕', '반팔 티셔츠')],
    bottom: [it('🩳', '반바지'), it('👗', '린넨 원피스')], shoes: [it('🩴', '샌들')],
    acc: [it('🕶️', '선글라스'), it('🧢', '캡모자')] },
  { min: 23, range: '23~27°C', title: '초여름 날씨', color: '#f97316',
    summary: '반팔이 기본! 냉방이 센 실내라면 얇은 셔츠를 챙기세요.',
    outer: [], top: [it('👕', '반팔 티셔츠'), it('👔', '얇은 셔츠')],
    bottom: [it('🩳', '반바지'), it('👖', '면바지')], shoes: [it('👟', '스니커즈')],
    acc: [it('🧢', '모자')] },
  { min: 20, range: '20~22°C', title: '선선한 날씨', color: '#eab308',
    summary: '긴팔 한 장이나 얇은 가디건이면 딱 좋아요.',
    outer: [it('🧥', '얇은 가디건')], top: [it('👚', '긴팔 티셔츠'), it('👔', '셔츠')],
    bottom: [it('👖', '면바지'), it('👖', '슬랙스')], shoes: [it('👟', '스니커즈')], acc: [] },
  { min: 17, range: '17~19°C', title: '가을 느낌', color: '#84cc16',
    summary: '맨투맨과 얇은 니트가 활약할 때예요.',
    outer: [it('🧥', '가디건'), it('🧥', '바람막이')], top: [it('👕', '맨투맨'), it('🧶', '얇은 니트')],
    bottom: [it('👖', '청바지')], shoes: [it('👟', '스니커즈'), it('👞', '로퍼')], acc: [] },
  { min: 12, range: '12~16°C', title: '쌀쌀한 날씨', color: '#22c55e',
    summary: '자켓이나 가디건을 꼭 걸치세요.',
    outer: [it('🧥', '자켓'), it('🧥', '야상')], top: [it('👕', '맨투맨'), it('🧶', '니트')],
    bottom: [it('👖', '청바지'), it('🧦', '스타킹')], shoes: [it('👟', '스니커즈'), it('👢', '앵클부츠')], acc: [] },
  { min: 9, range: '9~11°C', title: '꽤 추운 날씨', color: '#06b6d4',
    summary: '트렌치코트와 니트로 보온에 신경 쓰세요.',
    outer: [it('🧥', '트렌치코트'), it('🧥', '점퍼')], top: [it('🧶', '니트'), it('👕', '후드티')],
    bottom: [it('👖', '청바지'), it('👖', '기모 바지')], shoes: [it('👢', '부츠')], acc: [it('🧣', '얇은 스카프')] },
  { min: 5, range: '5~8°C', title: '초겨울 추위', color: '#3b82f6',
    summary: '코트에 히트텍까지, 겹쳐 입기 시작할 때예요.',
    outer: [it('🧥', '울 코트'), it('🧥', '가죽 자켓')], top: [it('🧶', '두꺼운 니트'), it('👕', '히트텍')],
    bottom: [it('👖', '기모 바지'), it('🦵', '레깅스')], shoes: [it('👢', '부츠')], acc: [it('🧣', '머플러')] },
  { min: -Infinity, range: '4°C 이하', title: '한겨울 강추위', color: '#6366f1',
    summary: '패딩과 방한용품으로 단단히 무장하세요.',
    outer: [it('🧥', '롱패딩'), it('🧥', '두꺼운 코트')], top: [it('🧶', '기모 니트'), it('👕', '히트텍')],
    bottom: [it('👖', '기모 바지')], shoes: [it('🥾', '방한 부츠')],
    acc: [it('🧣', '목도리'), it('🧤', '장갑'), it('🧢', '비니')] },
];
const bandFor = (t) => BANDS.find((b) => t >= b.min);
const CATS = [['outer', '아우터'], ['top', '상의'], ['bottom', '하의'], ['shoes', '신발'], ['acc', '소품']];

/* ---------- 날짜 유틸 ---------- */
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
const todayStr = () => fmt(new Date());
const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
const MIN_DATE = '1940-01-02';
const maxDate = () => addDays(todayStr(), 15); // 예보는 최대 16일

function prettyDate(s) {
  const d = parse(s);
  const w = '일월화수목금토'[d.getDay()];
  const diff = diffDays(s, todayStr());
  const rel = { 0: '오늘', 1: '내일', 2: '모레', [-1]: '어제', [-2]: '그제' }[diff]
    ?? (diff > 0 ? `${diff}일 후` : `${-diff}일 전`);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${w}) · ${rel}`;
}

/* ---------- 상태 ---------- */
const DEFAULT_LOC = { name: '서울', sub: '대한민국', lat: 37.5665, lon: 126.978 };
const state = { loc: loadLoc(), date: todayStr() };
let reqId = 0;

function loadLoc() {
  try { return JSON.parse(localStorage.getItem('owi-loc')) || DEFAULT_LOC; } catch { return DEFAULT_LOC; }
}
function saveLoc(loc) {
  try { localStorage.setItem('owi-loc', JSON.stringify(loc)); } catch { /* 무시 */ }
}

/* ---------- API ---------- */
async function fetchWeather(lat, lon, date) {
  const start = addDays(date, -1); // 전날과 비교하기 위해 하루 앞부터
  const ago = diffDays(todayStr(), date);
  const useArchive = ago > 60;     // 오래된 날짜는 과거 기록 API

  const daily = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'apparent_temperature_max', 'apparent_temperature_min',
    'precipitation_sum', 'wind_speed_10m_max',
    ...(useArchive ? [] : ['precipitation_probability_max', 'uv_index_max']),
  ].join(',');
  const hourly = useArchive
    ? 'temperature_2m,weather_code,precipitation'
    : 'temperature_2m,weather_code,precipitation_probability';

  const base = useArchive
    ? 'https://archive-api.open-meteo.com/v1/archive'
    : 'https://api.open-meteo.com/v1/forecast';
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, daily, hourly,
    timezone: 'auto', wind_speed_unit: 'ms', start_date: start, end_date: date,
  });

  const res = await fetch(`${base}?${params}`);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.reason || '날씨 데이터를 불러오지 못했어요.');
  json.source = useArchive ? '과거 기록' : ago > 0 ? '관측 기록' : ago === 0 ? '오늘 예보' : '예보';
  return json;
}

async function searchCity(q) {
  const params = new URLSearchParams({ name: q, count: 6, language: 'ko', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const json = await res.json();
  return json.results || [];
}

/* ---------- 메인 로드 ---------- */
async function load() {
  const id = ++reqId;
  const { loc, date } = state;
  $('#cityInput').value = loc.name;
  $('#dateInput').value = date;
  $('#prevDay').disabled = date <= MIN_DATE;
  $('#nextDay').disabled = date >= maxDate();
  showStatus('날씨를 불러오는 중이에요… ⏳');

  try {
    const data = await fetchWeather(loc.lat, loc.lon, date);
    if (id !== reqId) return; // 더 최신 요청이 있으면 무시
    render(data);
    hideStatus();
  } catch (err) {
    if (id !== reqId) return;
    $('#result').hidden = true;
    showStatus(`😢 ${err.message}`, true);
  }
}

/* ---------- 렌더링 ---------- */
function render(data) {
  const d = data.daily;
  const i = d.time.indexOf(state.date);
  const p = d.time.indexOf(addDays(state.date, -1));
  const g = (k, idx = i) => (d[k] ? d[k][idx] : undefined);

  const tMax = g('temperature_2m_max');
  const tMin = g('temperature_2m_min');
  if (i < 0 || tMax == null || tMin == null) throw new Error('해당 날짜의 데이터가 아직 없어요. 다른 날짜를 선택해 주세요.');

  const aMax = g('apparent_temperature_max') ?? tMax;
  const aMin = g('apparent_temperature_min') ?? tMin;
  const feel = Math.round((aMax + aMin) / 2);
  const code = g('weather_code');
  const pop = g('precipitation_probability_max');
  const rainSum = g('precipitation_sum') ?? 0;
  const wind = g('wind_speed_10m_max');
  const uv = g('uv_index_max');
  const range = tMax - tMin;
  const band = bandFor(feel);

  // 테마 색상
  document.documentElement.style.setProperty('--accent', band.color);

  // 날씨 카드
  const [icon, desc] = wmo(code);
  $('#placeName').textContent = `📍 ${state.loc.name}${state.loc.sub ? ` · ${state.loc.sub}` : ''}`;
  $('#dateLabel').textContent = prettyDate(state.date);
  $('#dataBadge').textContent = data.source;
  $('#wIcon').textContent = icon;
  $('#wDesc').textContent = desc;
  $('#tMax').textContent = `${Math.round(tMax)}°`;
  $('#tMin').textContent = `${Math.round(tMin)}°`;

  const prevMax = g('temperature_2m_max', p), prevMin = g('temperature_2m_min', p);
  if (p >= 0 && prevMax != null && prevMin != null) {
    const delta = Math.round(((tMax + tMin) - (prevMax + prevMin)) / 2);
    $('#compare').innerHTML = delta === 0
      ? '전날과 비슷한 기온이에요'
      : `전날보다 <b class="${delta > 0 ? 'up' : 'down'}">${Math.abs(delta)}° ${delta > 0 ? '높아요 ▲' : '낮아요 ▼'}</b>`;
  } else {
    $('#compare').textContent = '';
  }

  const stats = [
    ['체감 평균', `${feel}°C`],
    pop != null ? ['강수 확률', `${pop}%`] : ['강수량', `${rainSum.toFixed(1)}mm`],
    ['일교차', `${Math.round(range)}°C`],
    wind != null ? ['최대 풍속', `${wind.toFixed(1)}m/s`] : null,
    uv != null ? ['자외선', `${uv.toFixed(0)} · ${uvLabel(uv)}`] : ['강수량', `${rainSum.toFixed(1)}mm`],
  ].filter(Boolean);
  // 중복 제거 (과거 기록일 때 강수량이 두 번 나오지 않게)
  const seen = new Set();
  $('#stats').innerHTML = stats
    .filter(([k]) => (seen.has(k) ? false : seen.add(k)))
    .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');

  // 코디 + 상황별 추가 아이템/팁
  const outfit = Object.fromEntries(CATS.map(([k]) => [k, [...band[k]]]));
  const extras = [];
  const tips = [];
  const rainy = isRain(code) || rainSum >= 1 || (pop != null && pop >= 60);

  if (isSnow(code)) {
    extras.push(it('☂️', '우산'), it('🥾', '미끄럼 방지 신발'));
    tips.push('눈 소식이 있어요. 밑창이 미끄럽지 않은 신발을 신으세요.');
  } else if (rainy) {
    extras.push(it('☂️', '장우산'), it('🥾', '레인부츠'));
    tips.push(`비 소식이 있어요${pop != null ? ` (강수확률 ${pop}%)` : ''}. 밑단이 끌리지 않는 바지와 방수 신발을 추천해요.`);
  } else if (pop != null && pop >= 30) {
    extras.push(it('🌂', '접이식 우산'));
    tips.push('비 올 가능성이 조금 있어요. 접이식 우산을 가방에 넣어두세요.');
  }
  if (range >= 10) {
    if (outfit.outer.length === 0) extras.push(it('🧥', '가벼운 겉옷'));
    tips.push(`일교차가 ${Math.round(range)}°C로 커요. 아침·저녁엔 쌀쌀하니 벗고 입기 쉬운 레이어드 코디를 하세요.`);
  }
  if (wind != null && wind >= 8) {
    tips.push('바람이 강해요. 실제보다 춥게 느껴지니 바람막이나 한 겹을 더 챙기세요.');
  }
  if (uv != null && uv >= 6) {
    extras.push(it('🧴', '선크림'));
    tips.push('자외선이 강해요. 선크림과 모자로 피부를 지켜주세요.');
  }
  if (tMax >= 33) tips.push('폭염 수준이에요. 밝은 색 옷을 입고 수분을 자주 보충하세요.');
  if (tMin <= -10) tips.push('한파 수준이에요. 귀·손·목 보온에 특히 신경 쓰세요.');
  if (tips.length === 0) tips.push('특별한 변수가 없는 날이에요. 기본 코디로 충분해요! 😊');

  $('#bandChip').textContent = `체감 ${feel}°C · ${band.range}`;
  $('#outfitTitle').textContent = `${band.title}엔 이렇게 입어요`;
  $('#outfitSummary').textContent = band.summary;

  const itemHtml = (x, extra = false) =>
    `<span class="item${extra ? ' extra' : ''}"><span class="e">${x.e}</span>${x.n}</span>`;
  $('#items').innerHTML = CATS
    .filter(([k]) => outfit[k].length)
    .map(([k, label]) => `<div class="cat"><span class="cat-name">${label}</span>
      <div class="cat-list">${outfit[k].map((x) => itemHtml(x)).join('')}</div></div>`)
    .join('') + (extras.length
    ? `<div class="cat"><span class="cat-name">챙길 것</span>
      <div class="cat-list">${extras.map((x) => itemHtml(x, true)).join('')}</div></div>`
    : '');
  $('#tips').innerHTML = tips.map((t) => `<li>${t}</li>`).join('');

  renderChart(data.hourly);
  renderGuide(band);
  $('#result').hidden = false;
}

function uvLabel(uv) {
  if (uv >= 11) return '위험';
  if (uv >= 8) return '매우 높음';
  if (uv >= 6) return '높음';
  if (uv >= 3) return '보통';
  return '낮음';
}

/* ---------- 시간대별 기온 차트 (SVG) ---------- */
function renderChart(h) {
  const idx = h.time.map((t, k) => (t.startsWith(state.date) ? k : -1)).filter((k) => k >= 0);
  const temps = idx.map((k) => h.temperature_2m[k]);
  if (!temps.length || temps.some((t) => t == null)) { $('#chart').innerHTML = '<p class="muted">시간대별 데이터가 없어요.</p>'; return; }

  const W = 760, H = 220, padX = 30, top = 44, bottom = 40;
  const lo = Math.min(...temps) - 2, hi = Math.max(...temps) + 2;
  const x = (k) => padX + (k * (W - padX * 2)) / (temps.length - 1);
  const y = (t) => top + ((hi - t) * (H - top - bottom)) / (hi - lo);

  const pts = temps.map((t, k) => `${x(k).toFixed(1)},${y(t).toFixed(1)}`);
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${x(temps.length - 1)},${H - bottom} L${x(0)},${H - bottom} Z`;

  const rain = idx.map((k) => (h.precipitation_probability ? h.precipitation_probability[k] : h.precipitation?.[k]));
  const rainUnit = h.precipitation_probability ? '%' : 'mm';

  let labels = '';
  for (let k = 0; k < temps.length; k += 3) {
    const code = h.weather_code?.[idx[k]];
    const r = rain[k];
    const showRain = r != null && (rainUnit === '%' ? r >= 20 : r > 0);
    labels += `
      <text class="label" x="${x(k)}" y="${H - 22}" text-anchor="middle">${k}시</text>
      ${showRain ? `<text class="rain" x="${x(k)}" y="${H - 8}" text-anchor="middle">💧${rainUnit === '%' ? r : r.toFixed(1)}${rainUnit}</text>` : ''}
      <text x="${x(k)}" y="${y(temps[k]) - 24}" text-anchor="middle" font-size="16">${wmo(code)[0]}</text>
      <text class="temp" x="${x(k)}" y="${y(temps[k]) - 9}" text-anchor="middle">${Math.round(temps[k])}°</text>
      <circle cx="${x(k)}" cy="${y(temps[k])}" r="3.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2"/>`;
  }

  let now = '';
  if (state.date === todayStr()) {
    const hr = new Date().getHours();
    now = `<line x1="${x(hr)}" x2="${x(hr)}" y1="${top - 30}" y2="${H - bottom}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="${x(hr)}" y="${top - 34}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent)">지금</text>`;
  }

  $('#chart').innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="시간대별 기온 그래프">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity=".35"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line class="grid-line" x1="${padX}" x2="${W - padX}" y1="${H - bottom}" y2="${H - bottom}"/>
      <path d="${area}" fill="url(#fillGrad)"/>
      <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${now}${labels}
    </svg>`;
}

/* ---------- 기온별 가이드 ---------- */
function renderGuide(active) {
  $('#guide').innerHTML = BANDS.map((b) => {
    const names = [...b.outer, ...b.top, ...b.bottom, ...b.acc].map((x) => x.n).join(', ');
    return `<div class="g-item${b === active ? ' active' : ''}">
      <div class="g-range"><span class="dot" style="background:${b.color}"></span>${b.range}</div>
      <p>${names}</p></div>`;
  }).join('');
}

/* ---------- 상태 메시지 ---------- */
function showStatus(msg, error = false) {
  const el = $('#status');
  el.textContent = msg;
  el.classList.toggle('error', error);
  el.hidden = false;
}
function hideStatus() { $('#status').hidden = true; }

/* ---------- 이벤트: 도시 검색 ---------- */
let timer;
let results = [];
let activeIdx = -1;
const suggest = $('#suggest');

$('#cityInput').addEventListener('input', (e) => {
  clearTimeout(timer);
  const q = e.target.value.trim();
  if (q.length < 1) { suggest.hidden = true; return; }
  timer = setTimeout(async () => {
    try {
      results = await searchCity(q);
      activeIdx = -1;
      if (!results.length) {
        suggest.innerHTML = '<li class="muted">검색 결과가 없어요</li>';
      } else {
        suggest.innerHTML = results.map((r, k) =>
          `<li data-k="${k}">${r.name}<small>${[r.admin1, r.country].filter(Boolean).join(', ')}</small></li>`).join('');
      }
      suggest.hidden = false;
    } catch { suggest.hidden = true; }
  }, 300);
});

$('#cityInput').addEventListener('keydown', (e) => {
  if (suggest.hidden || !results.length) return;
  const lis = suggest.querySelectorAll('li[data-k]');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + lis.length) % lis.length;
    lis.forEach((li, k) => li.classList.toggle('active', k === activeIdx));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    pickCity(results[Math.max(activeIdx, 0)]);
  } else if (e.key === 'Escape') {
    suggest.hidden = true;
  }
});

suggest.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-k]');
  if (li) pickCity(results[Number(li.dataset.k)]);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.city-box')) suggest.hidden = true;
});

function pickCity(r) {
  if (!r) return;
  state.loc = { name: r.name, sub: [r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude };
  saveLoc(state.loc);
  suggest.hidden = true;
  load();
}

/* ---------- 이벤트: 현재 위치 ---------- */
$('#geoBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { showStatus('이 브라우저는 위치 기능을 지원하지 않아요.', true); return; }
  showStatus('현재 위치를 확인하는 중… 📍');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.loc = { name: '현재 위치', sub: '', lat: pos.coords.latitude, lon: pos.coords.longitude };
      saveLoc(state.loc);
      load();
    },
    () => showStatus('위치 권한이 거부되었어요. 도시를 직접 검색해 주세요.', true),
    { timeout: 10000 },
  );
});

/* ---------- 이벤트: 날짜 ---------- */
function setDate(s) {
  if (!s) return;
  if (s < MIN_DATE) s = MIN_DATE;
  if (s > maxDate()) s = maxDate();
  state.date = s;
  load();
}
$('#dateInput').addEventListener('change', (e) => setDate(e.target.value));
$('#prevDay').addEventListener('click', () => setDate(addDays(state.date, -1)));
$('#nextDay').addEventListener('click', () => setDate(addDays(state.date, 1)));
$('#todayBtn').addEventListener('click', () => setDate(todayStr()));

/* ---------- 시작 ---------- */
$('#dateInput').min = MIN_DATE;
$('#dateInput').max = maxDate();
load();
