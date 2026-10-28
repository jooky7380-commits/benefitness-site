/* 베네피트니스 홈페이지 방문 기록 (2026-10-28)
   - 들어온 경로(네이버 검색·광고·플레이스·블로그·인스타 등), 머문 시간, 스크롤 깊이, 전화·예약·플레이스·톡톡 클릭을 센터 관리 앱에 남긴다.
   - 이름·연락처는 저장하지 않는다. 브라우저에 무작위 번호(vid) 하나만 둔다(쿠키 없음).
   - 네이버 광고(n_ 표시)로 들어온 방문만 서버가 접속 IP를 90일 보관한다(부정클릭 감시, 2026-10-28).
   - ?vtest=1 로 열면 시험 방문으로 표시돼 통계에서 빠진다. */
(function () {
  'use strict';
  var URL_ = 'https://rbvkbjxpmxfmjcrlpdus.supabase.co/rest/v1/rpc/';
  var KEY = 'sb_publishable_vtHelmncvcHEiFcp_mjKrw_fYyzvATF';
  var q = new URLSearchParams(location.search);
  var test = q.get('vtest') === '1';
  try { if (test) localStorage.setItem('bf_vtest', '1'); else if (localStorage.getItem('bf_vtest') === '1') test = true; } catch (e) {}
  var ua = navigator.userAgent || '';
  if (!test && (navigator.webdriver || /bot|crawl|spider|slurp|yeti|daum(oa)?|preview|headless|lighthouse/i.test(ua))) return;

  function rid(n) {
    var a = new Uint8Array(n), s = '', c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < n; i++) s += c[a[i] % c.length];
    return s;
  }
  function call(fn, body) {
    try {
      return fetch(URL_ + fn, { method: 'POST', keepalive: true, headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
    } catch (e) {}
  }

  /* 방문자·방문 */
  var vid = null, first = false;
  try { vid = localStorage.getItem('bf_vid'); if (!vid) { vid = rid(20); first = true; localStorage.setItem('bf_vid', vid); } } catch (e) { vid = rid(20); first = true; }
  var sess = null;
  try { sess = JSON.parse(sessionStorage.getItem('bf_visit') || 'null'); } catch (e) {}
  var now = Date.now(), resumed = !!(sess && sess.id && now - (sess.t || 0) < 30 * 60e3);
  if (!resumed) sess = { id: rid(24), dur: 0, sc: 0, t: now, secs: {} };

  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function classify() {
    var us = (q.get('utm_source') || '').toLowerCase(), um = (q.get('utm_medium') || '').toLowerCase();
    if (q.get('n_media') || q.get('n_query') || q.get('n_keyword') || q.get('n_ad_group') || q.get('n_ad')) return '네이버 광고';
    if (us) {
      if (/place|플레이스|map/.test(us)) return '플레이스';
      if (/naver/.test(us) && /cpc|ad|paid|광고/.test(um)) return '네이버 광고';
      if (/insta|^ig$/.test(us)) return '인스타그램';
      if (/blog|블로그/.test(us)) return '블로그';
      if (/kakao|카카오/.test(us)) return '카카오';
      if (/daangn|karrot|당근/.test(us)) return '당근';
      if (/naver/.test(us)) return '네이버 검색';
      if (/google/.test(us)) return '구글';
      return '기타';
    }
    var h = host(document.referrer);
    if (!h || h === location.hostname.replace(/^www\./, '')) return '직접·북마크';
    if (/(^|\.)place\.naver\.com$|^map\.naver\.com$|^m\.map\.naver\.com$/.test(h)) return '플레이스';
    if (/search\.naver\.com$/.test(h)) return '네이버 검색';
    if (/blog\.naver\.com$/.test(h)) return '블로그';
    if (/booking\.naver\.com$/.test(h)) return '네이버 예약';
    if (/naver\.com$|naver\.me$/.test(h)) return '네이버 기타';
    if (/instagram\.com$/.test(h)) return '인스타그램';
    if (/google\./.test(h)) return '구글';
    if (/daum\.net$/.test(h)) return '다음';
    if (/kakao/.test(h)) return '카카오';
    if (/facebook\.com$|fb\.com$/.test(h)) return '페이스북';
    if (/daangn\.com$|karrot/.test(h)) return '당근';
    return '기타 웹';
  }
  function device() {
    if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'tablet';
    if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
    return 'pc';
  }
  function save() { sess.t = Date.now(); try { sessionStorage.setItem('bf_visit', JSON.stringify(sess)); } catch (e) {} }

  if (!resumed) {
    call('site_hit', { p: {
      id: sess.id, vid: vid, first: first, src: classify(), ref: host(document.referrer) || null,
      us: q.get('utm_source'), um: q.get('utm_medium'), uc: q.get('utm_campaign') || q.get('n_campaign_type'),
      nk: q.get('n_keyword') || q.get('n_query'), nm: q.get('n_media'), nr: q.get('n_rank'), land: (location.pathname + (location.hash || '')).slice(0, 200),
      dev: device(), test: test
    } });
  }
  save();

  /* 머문 시간: 화면이 보이는 동안만 셈 */
  var shownAt = document.visibilityState === 'visible' ? Date.now() : 0, lastSent = -1;
  function total() { return Math.round(sess.dur + (shownAt ? (Date.now() - shownAt) / 1000 : 0)); }
  function ping() {
    var d = Math.min(14400, total());
    if (d === lastSent && sess.sc === sess.scSent) return;
    lastSent = d; sess.scSent = sess.sc;
    call('site_ping', { p_id: sess.id, p_vid: vid, p_dur: d, p_scroll: sess.sc });
  }
  function pause() { if (shownAt) { sess.dur += (Date.now() - shownAt) / 1000; shownAt = 0; } save(); ping(); }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') pause(); else { shownAt = Date.now(); save(); }
  });
  window.addEventListener('pagehide', pause);
  setInterval(function () { if (shownAt) { save(); ping(); } }, 20000);
  setTimeout(function () { if (shownAt) ping(); }, 8000);

  /* 스크롤 깊이 + 섹션 도달(가격·상담, 시작하기) */
  var raf = 0;
  window.addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight);
      var p = Math.min(100, Math.round((scrollY || h.scrollTop) / max * 100));
      if (p > sess.sc) sess.sc = p;
    });
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (sess.secs[id]) return;
        sess.secs[id] = 1; save();
        call('site_ev', { p_id: sess.id, p_vid: vid, p_kind: 'section', p_label: id, p_href: null });
      });
    }, { threshold: 0.35 });
    ['price', 'start'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* 버튼 클릭: 전화·예약·플레이스·톡톡·인스타·블로그 등 */
  function kindOf(href) {
    if (/^tel:/i.test(href)) return 'tel';
    if (/^sms:/i.test(href)) return 'sms';
    if (/booking\.naver\.com/.test(href)) return 'booking';
    if (/place\.naver\.com|map\.naver\.com|naver\.me/.test(href)) return 'place';
    if (/talk\.naver\.com/.test(href)) return 'talk';
    if (/pf\.kakao\.com|open\.kakao\.com|kakao/.test(href)) return 'kakao';
    if (/instagram\.com/.test(href)) return 'insta';
    if (/blog\.naver\.com/.test(href)) return 'blog';
    if (/notion\.site/.test(href)) return 'notion';
    if (/^https?:/i.test(href) && host(href) !== location.hostname.replace(/^www\./, '')) return 'out';
    return '';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '', k = kindOf(href);
    if (!k) return;
    var label = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    var sec = a.closest('section[id],header[id],footer,[id]');
    if (sec && sec.id) label = (label ? label + ' · ' : '') + sec.id;
    call('site_ev', { p_id: sess.id, p_vid: vid, p_kind: k, p_label: label, p_href: href.slice(0, 300) });
  }, true);
})();
