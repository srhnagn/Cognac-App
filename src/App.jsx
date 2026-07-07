import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import './index.css'

const DEV_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzgxNTI5NzIwLCJleHAiOjE3ODQ1NTM3MjAsInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.K9fXLweLjLOzZECcRLXiBDnt39grjYOUnq8H5LP2-4xWL8Dd5x_nsiJ3MrBefgDHsxtSfWDYHjQeZUdAy6lAzA';

/* ─── Utils ─────────────────────────────────────────────── */
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtMs(ms) { return ms ? fmt(ms / 1000) : ''; }
function artURL(art, size = 40) {
  return art?.url?.replace('{w}', size).replace('{h}', size);
}

/* ─── SVG Icons ─────────────────────────────────────────── */
const Icons = {
  shuffle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
      <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
      <line x1="4" y1="4" x2="9" y2="9"/>
    </svg>
  ),
  prev: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  next: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  play: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  pause: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  repeat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  repeatOne: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      <text x="11" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">1</text>
    </svg>
  ),
  volHigh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  volLow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  volMute: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  ),
  settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  music: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  playSmall: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  user: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [mk, setMk]               = useState(null);
  const [configured, setConfigured] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userInfo, setUserInfo]   = useState({ name: 'Apple Music', storefront: '' });

  const [playlists, setPlaylists] = useState([]);
  const [currentPl, setCurrentPl] = useState(null);
  const [tracks, setTracks]       = useState([]);

  const [nowPlaying, setNowPlaying] = useState(null);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [muted, setMuted]           = useState(false);
  const [shuffle, setShuffle]       = useState(false);
  const [repeat, setRepeat]         = useState(0); // 0=off 1=all 2=one

  const [trackQ, setTrackQ]         = useState('');
  const [sortKey, setSortKey]       = useState(null);
  const [sortDir, setSortDir]       = useState('asc');
  const [showSettings, setShowSettings] = useState(false);

  const progRef   = useRef(null);
  const timerRef  = useRef(null);

  /* ── MusicKit init ── */
  useEffect(() => {
    const init = async () => {
      try {
        await window.MusicKit.configure({ developerToken: DEV_TOKEN, app: { name: 'Cognac', build: '1.0' } });
        const m = window.MusicKit.getInstance();
        setMk(m); setConfigured(true); setAuthorized(m.isAuthorized);
        m.addEventListener('authorizationStatusDidChange', () => setAuthorized(m.isAuthorized));
        m.addEventListener('playbackStateDidChange', e => setPlaying(e.state === window.MusicKit.PlaybackStates.playing));
        m.addEventListener('mediaItemDidChange', e => { setNowPlaying(e.item); setProgress(0); });
      } catch (e) { console.error('MusicKit init', e); }
    };
    window.MusicKit ? init() : document.addEventListener('musickitloaded', init);
  }, []);

  /* ── Progress ticker (500ms) ── */
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        if (mk) {
          setProgress(mk.currentPlaybackTime || 0);
          setDuration(mk.currentPlaybackDuration || 0);
        }
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, mk]);

  /* ── Load data on authorize ── */
  useEffect(() => {
    if (authorized && mk) { fetchPlaylists(); fetchUserInfo(); }
  }, [authorized, mk]);

  const headers = () => ({
    'Authorization': `Bearer ${DEV_TOKEN}`,
    'Music-User-Token': mk?.musicUserToken || '',
  });

  const fetchPlaylists = async () => {
    try {
      const r = await fetch('https://api.music.apple.com/v1/me/library/playlists?limit=100', { headers: headers() });
      const j = await r.json();
      setPlaylists(j?.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchUserInfo = async () => {
    try {
      const r = await fetch('https://api.music.apple.com/v1/me/storefront', { headers: headers() });
      const j = await r.json();
      const sf = j?.data?.[0];
      setUserInfo({ name: sf?.attributes?.name || 'Hesabım', storefront: sf?.id?.toUpperCase() || '' });
    } catch (e) {
      setUserInfo({ name: 'Hesabım', storefront: '' });
    }
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT') return;
      if (!mk) return;
      if (e.code === 'Space')       { e.preventDefault(); mk[playing ? 'pause' : 'play'](); }
      if (e.code === 'ArrowRight')  { e.preventDefault(); mk.skipToNextItem(); }
      if (e.code === 'ArrowLeft')   { e.preventDefault(); mk.skipToPreviousItem(); }
      if (e.code === 'ArrowUp')     { e.preventDefault(); setVol(Math.min(1, volume + 0.05)); }
      if (e.code === 'ArrowDown')   { e.preventDefault(); setVol(Math.max(0, volume - 0.05)); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mk, playing, volume]);

  /* ── Auth ── */
  const login  = async () => { try { await mk.authorize(); setAuthorized(mk.isAuthorized); } catch { alert('Giriş başarısız.'); } };
  const logout = async () => { await mk.unauthorize(); setAuthorized(false); setPlaylists([]); setTracks([]); setCurrentPl(null); };

  /* ── Playlist ── */
  const openPlaylist = async pl => {
    setCurrentPl(pl); setTracks([]); setTrackQ(''); setSortKey(null);
    try {
      const r = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${pl.id}/tracks?limit=100`, { headers: headers() });
      const j = await r.json();
      setTracks(j?.data || []);
    } catch (e) { console.error(e); }
  };

  /* ── Playback ── */
  const playTrack = async track => {
    try {
      const idx = displayed.findIndex(t => t.id === track.id);
      await mk.setQueue({ items: displayed });
      await mk.changeToMediaAtIndex(idx);
      await mk.play();
    } catch (e) { alert('Çalamadı: ' + e.message); }
  };

  const togglePlay = () => mk && (playing ? mk.pause() : mk.play());

  const setVol = v => { setVolume(v); if (mk) mk.volume = v; setMuted(v === 0); };
  const toggleMute = () => { if (muted) { setVol(volume || 0.5); setMuted(false); } else { if (mk) mk.volume = 0; setMuted(true); } };

  const cycleRepeat = () => setRepeat(r => { const n = (r+1)%3; if (mk) mk.repeatMode = n; return n; });
  const cycleShuffle = () => setShuffle(s => { const n = !s; if (mk) mk.shuffleMode = n ? 1 : 0; return n; });

  const seek = e => {
    if (!progRef.current || !mk || !duration) return;
    const { left, width } = progRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - left) / width)) * duration;
    mk.seekToTime(t); setProgress(t);
  };

  /* ── Sort + filter ── */
  const requestSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const displayed = useMemo(() => {
    let l = [...tracks];
    if (trackQ) {
      const q = trackQ.toLowerCase();
      l = l.filter(t =>
        t.attributes.name?.toLowerCase().includes(q) ||
        t.attributes.artistName?.toLowerCase().includes(q) ||
        t.attributes.albumName?.toLowerCase().includes(q)
      );
    }
    if (sortKey) l.sort((a, b) => {
      const av = (a.attributes[sortKey] || '').toString().toLowerCase();
      const bv = (b.attributes[sortKey] || '').toString().toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return l;
  }, [tracks, trackQ, sortKey, sortDir]);

  /* ── Derived ── */
  const pct    = duration > 0 ? (progress / duration) * 100 : 0;
  const volPct = Math.round((muted ? 0 : volume) * 100);
  const VIcon  = muted || volume === 0 ? Icons.volMute : volume < 0.5 ? Icons.volLow : Icons.volHigh;
  const npArt  = artURL(nowPlaying?.attributes?.artwork, 52);
  const isNP   = t => nowPlaying && t.id === nowPlaying.id;

  /* ── Renders ── */
  if (!configured) return (
    <div className="loading">🥃 Cognac<span className="loading-sub">Yükleniyor</span></div>
  );

  if (!authorized) return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🥃</div>
        <h1>Cognac</h1>
        <p>Apple Music kütüphanenize erişmek için<br />giriş yapın.</p>
        <button className="auth-btn" onClick={login}>Apple Kimliği ile Giriş Yap</button>
      </div>
    </div>
  );

  return (
    <>
      {/* ──────────── SETTINGS OVERLAY ──────────── */}
      {showSettings && (
        <div className="settings-overlay" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="settings-card">
            <div className="settings-header">
              <span className="settings-title">Hesap Ayarları</span>
              <button className="settings-close" onClick={() => setShowSettings(false)}><Icons.close /></button>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Bölge</span>
              <span className="settings-row-val">{userInfo.storefront || '—'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Playlist sayısı</span>
              <span className="settings-row-val">{playlists.length}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Versiyon</span>
              <span className="settings-row-val">Cognac 1.0</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Ses seviyesi</span>
              <span className="settings-row-val">%{volPct}</span>
            </div>
            <button className="settings-logout-btn" onClick={() => { setShowSettings(false); logout(); }}>
              Oturumu Kapat
            </button>
          </div>
        </div>
      )}

      {/* ──────────── APP ──────────── */}
      <div className="app">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-emoji">🥃</span>
            Cognac
          </div>

          <div className="user-card" onClick={() => setShowSettings(true)}>
            <div className="user-avatar">
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{userInfo.name}</div>
              <div className="user-sub">Apple Music Üyesi</div>
            </div>
          </div>

          <div className="section-label">Kütüphane</div>

          <div className="playlists-scroll">
            {playlists.map(pl => {
              const cover = artURL(pl.attributes?.artwork, 36);
              return (
                <div
                  key={pl.id}
                  className={`playlist-item ${currentPl?.id === pl.id ? 'active' : ''}`}
                  onClick={() => openPlaylist(pl)}
                >
                  {cover
                    ? <img src={cover} className="playlist-cover" alt="" />
                    : <div className="playlist-cover-placeholder">🎵</div>
                  }
                  <span className="playlist-name">{pl.attributes.name}</span>
                </div>
              );
            })}
          </div>

          <div className="sidebar-nav">
            <button className="nav-item" onClick={() => setShowSettings(true)}>
              <span className="nav-icon"><Icons.settings /></span>
              Hesap Ayarları
            </button>
            <button className="nav-item danger" onClick={logout}>
              <span className="nav-icon"><Icons.logout /></span>
              Çıkış Yap
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {currentPl ? (
            <>
              <div className="main-header">
                <div className="header-left">
                  <div className="header-title">{currentPl.attributes.name}</div>
                  <div className="header-meta">{displayed.length} şarkı</div>
                </div>
                <div className="header-right">
                  <div className="search-box">
                    <span className="search-icon-wrap">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    <input type="text" placeholder="Şarkı ara..." value={trackQ} onChange={e => setTrackQ(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="sort-bar">
                <span className="sort-label">Sırala:</span>
                {[['name','İsim'],['artistName','Sanatçı'],['albumName','Albüm']].map(([k,l]) => (
                  <button key={k} className={`sort-btn ${sortKey===k?'active':''}`} onClick={() => requestSort(k)}>{l}{arrow(k)}</button>
                ))}
              </div>

              <div className="tl-head">
                <div className="tl-head-col col-num">#</div>
                <div className="tl-head-col col-title">Başlık</div>
                <div className="tl-head-col col-album">Albüm</div>
                <div className="tl-head-col col-dur">Süre</div>
              </div>

              <div className="track-list">
                {displayed.length > 0 ? displayed.map((t, i) => {
                  const cover = artURL(t.attributes?.artwork, 38);
                  return (
                    <div key={t.id + i} className={`track-row ${isNP(t) ? 'is-playing' : ''}`} onClick={() => playTrack(t)}>
                      <div className="t-num">
                        <span className="t-num-val">{i + 1}</span>
                        <span className="t-play-icon"><Icons.playSmall /></span>
                      </div>
                      {cover
                        ? <img src={cover} className="t-cover" alt="" />
                        : <div className="t-cover-ph">🎵</div>
                      }
                      <div className="t-info">
                        <div className="t-name">{t.attributes.name}</div>
                        <div className="t-artist">{t.attributes.artistName}</div>
                      </div>
                      <div className="t-album">{t.attributes.albumName}</div>
                      <div className="t-dur">{fmtMs(t.attributes.durationInMillis)}</div>
                    </div>
                  );
                }) : (
                  <div className="empty-list">
                    <span className="ei">🔍</span>
                    <p>Sonuç bulunamadı</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="home-screen">
              <div className="home-icon">🥃</div>
              <div className="home-title">Hoş Geldiniz</div>
              <div className="home-sub">Sol menüden bir liste seçerek müziğe başlayın.<br />Klavye kısayolları: Space = oynat, ← → = şarkı geç, ↑ ↓ = ses</div>
            </div>
          )}
        </main>

        {/* ── PLAYER ── */}
        <footer className="player">
          {/* Now playing */}
          <div className="now-playing">
            {nowPlaying ? (
              <>
                {npArt
                  ? <img src={npArt} className="np-art" alt="" />
                  : <div className="np-art-ph">🎵</div>
                }
                <div className="np-info">
                  <div className="np-title">{nowPlaying.attributes?.name}</div>
                  <div className="np-artist">{nowPlaying.attributes?.artistName}</div>
                </div>
              </>
            ) : (
              <div className="np-info" style={{ opacity: .25 }}>
                <div className="np-title">Cognac</div>
                <div className="np-artist">Bir liste seçin</div>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="center">
            <div className="ctrl-btns">
              <button className={`cbtn ${shuffle ? 'on' : ''}`} onClick={cycleShuffle} title="Karıştır"><Icons.shuffle /></button>
              <button className="cbtn" onClick={() => mk?.skipToPreviousItem()} title="Önceki (←)"><Icons.prev /></button>
              <button className="pp-btn" onClick={togglePlay} title="Oynat/Duraklat (Space)">
                {playing ? <Icons.pause /> : <Icons.play />}
              </button>
              <button className="cbtn" onClick={() => mk?.skipToNextItem()} title="Sonraki (→)"><Icons.next /></button>
              <button className={`cbtn ${repeat > 0 ? 'on' : ''}`} onClick={cycleRepeat} title="Tekrar">
                {repeat === 2 ? <Icons.repeatOne /> : <Icons.repeat />}
              </button>
            </div>
            <div className="prog-row">
              <span className="prog-time">{fmt(progress)}</span>
              <div className="prog-track" ref={progRef} onClick={seek}>
                <div className="prog-fill" style={{ width: `${pct}%` }}>
                  <div className="prog-dot" />
                </div>
              </div>
              <span className="prog-time r">{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="right-side">
            <div className="vol-row">
              <span className="vol-icon" onClick={toggleMute}><VIcon /></span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={muted ? 0 : volume}
                onChange={e => setVol(parseFloat(e.target.value))}
                className="vol-slider"
                style={{ '--pct': `${volPct}%` }}
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
