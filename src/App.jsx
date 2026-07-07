import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import './index.css'

const DEV_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzgxNTI5NzIwLCJleHAiOjE3ODQ1NTM3MjAsInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.K9fXLweLjLOzZECcRLXiBDnt39grjYOUnq8H5LP2-4xWL8Dd5x_nsiJ3MrBefgDHsxtSfWDYHjQeZUdAy6lAzA';

/* ─── Utils ─── */
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtMs(ms) { return ms ? fmt(ms / 1000) : ''; }
function artURL(art, size = 40) {
  return art?.url?.replace('{w}', size).replace('{h}', size);
}

// Hash-based gradient for playlists without artwork
function playlistGradient(name = '') {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  const hue1 = Math.abs(h) % 360;
  const hue2 = (hue1 + 50) % 360;
  return `linear-gradient(135deg, hsl(${hue1},55%,18%), hsl(${hue2},65%,28%))`;
}

/* ─── SVG Icons ─── */
const I = {
  shuffle:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  prev:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2" height="16" rx="1"/></svg>,
  next:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><rect x="17" y="4" width="2" height="16" rx="1"/></svg>,
  play:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  repeat:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  repeat1:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="11.5" y="13.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="800">1</text></svg>,
  volHigh:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  volLow:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  volMute:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  settings:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  lyricsIcon:() => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.65 1.56 5.01 3.98 6.46L5.3 21.6a.6.6 0 0 0 .88.66l5.06-2.92C11.49 19.38 11.74 19.4 12 19.4c5.52 0 10-3.58 10-8s-4.48-8-10-8zM9 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>,
  queue:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  close:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  playSmall: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  check:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  addList:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  note:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  info:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  trash:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  edit:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  plus:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

/* ─── Context Menu ─── */
function ContextMenu({ x, y, track, playlists, onClose, onPlayNext, onAddToQueue, onAddToPlaylist }) {
  const [showPlaylists, setShowPlaylists] = useState(false);
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);
  return (
    <div className="ctx-menu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
      <div className="ctx-item" onClick={() => { onPlayNext(track); onClose(); }}>
        <I.playSmall /> Sıradaki Yap
      </div>
      <div className="ctx-item" onClick={() => { onAddToQueue(track); onClose(); }}>
        <I.plus /> Sıraya Ekle
      </div>
      <div className="ctx-divider" />
      <div className="ctx-item has-sub" onClick={() => setShowPlaylists(s => !s)}>
        <I.addList /> Listeye Ekle
        {showPlaylists && (
          <div className="ctx-submenu">
            {playlists.map(pl => (
              <div key={pl.id} className="ctx-item" onClick={() => { onAddToPlaylist(track, pl); onClose(); }}>
                <I.note /> {pl.attributes.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ctx-divider" />
      <div className="ctx-item" onClick={() => { alert('Şarkı Bilgisi:\\n' + track.attributes.name + '\\nSanatçı: ' + track.attributes.artistName); onClose(); }}>
        <I.info /> Bilgi Ver
      </div>
      <div className="ctx-item danger" onClick={() => { alert('Apple Music API, bir çalma listesinden doğrudan şarkı silmeyi henüz desteklemiyor.'); onClose(); }}>
        <I.trash /> Listeden Sil
      </div>
    </div>
  );
}

function PlaylistContextMenu({ x, y, playlist, onClose, onPlayNext, onShuffle, onEdit }) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);
  return (
    <div className="ctx-menu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
      <div className="ctx-item" onClick={() => { onPlayNext(playlist); onClose(); }}>
        <I.next /> Sıradaki Çal
      </div>
      <div className="ctx-item" onClick={() => { onShuffle(playlist); onClose(); }}>
        <I.shuffle /> Karışık Çal
      </div>
      <div className="ctx-divider" />
      <div className="ctx-item" onClick={() => { onEdit(playlist); onClose(); }}>
        <I.edit /> Düzenle
      </div>
      <div className="ctx-divider" />
      <div className="ctx-item danger" onClick={() => { alert('Apple Music API, çalma listesi silmeyi henüz desteklemiyor.'); onClose(); }}>
        <I.trash /> Kütüphaneden Sil
      </div>
    </div>
  );
}

function QueueContextMenu({ x, y, track, index, onClose, onRemove, onPlayNext, onAddToPlaylist }) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);
  return (
    <div className="ctx-menu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
      <div className="ctx-item" onClick={() => { onPlayNext(track); onClose(); }}><I.playSmall /> Sıradaki Yap</div>
      <div className="ctx-item" onClick={() => { onAddToPlaylist(track, null); onClose(); }}><I.plus /> Listeye Ekle</div>
      <div className="ctx-divider" />
      <div className="ctx-item danger" onClick={() => { onRemove(index); onClose(); }}>
        <I.trash /> Sıradan Kaldır
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function App() {
  const [mk, setMk]               = useState(null);
  const [configured, setCfg]      = useState(false);
  const [authorized, setAuth]     = useState(false);
  const [storefront, setSf]       = useState('');

  const [playlists, setPlaylists] = useState([]);
  const [currentPl, setCurrentPl] = useState(null);
  const [tracks, setTracks]       = useState([]);

  const [nowPlaying, setNP]       = useState(null);
  const [playing, setPlaying]     = useState(false);
  const [progress, setProg]       = useState(0);
  const [duration, setDur]        = useState(0);
  const [volume, setVol]          = useState(1);
  const [muted, setMuted]         = useState(false);
  const [shuffle, setShuffle]     = useState(false);
  const [repeat, setRepeat]       = useState(0);

  const [queue, setQueue]         = useState([]); // upcoming tracks
  const [queueHistory, setQueueHistory] = useState([]);
  const [lyrics, setLyrics]       = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // 'queue' | 'lyrics' | null
  const [coverModal, setCoverModal] = useState(null); // URL for full screen cover
  const [editPl, setEditPl]       = useState(null); // Playlist object for editing

  const [trackQ, setTrackQ]       = useState('');
  const [sortKey, setSortKey]     = useState(null);
  const [sortDir, setSortDir]     = useState('asc');
  const [showSettings, setSettings] = useState(false);
  const [userName, setUserName]   = useState(window.MAC_USER || localStorage.getItem('cognac_username') || 'Apple Music');

  const [ctxMenu, setCtxMenu]     = useState(null); // { x, y, track }
  const [plCtxMenu, setPlCtxMenu] = useState(null); // { x, y, playlist }
  const [qCtxMenu, setQCtxMenu]   = useState(null); // { x, y, index }

  const progRef  = useRef(null);
  const timerRef = useRef(null);

  /* ── Init MusicKit ── */
  useEffect(() => {
    const updateQ = (m_instance) => {
      if (!m_instance || !m_instance.queue) return;
      const items = m_instance.queue.items || [];
      const pos   = m_instance.queue.position ?? 0;
      setQueue(items.slice(pos + 1, pos + 20));
      setHistory(items.slice(Math.max(0, pos - 20), pos).reverse());
    };

    const init = async () => {
      try {
        await window.MusicKit.configure({ developerToken: DEV_TOKEN, app: { name: 'Cognac', build: '1.0' } });
        const m = window.MusicKit.getInstance();
        setMk(m); setCfg(true); setAuth(m.isAuthorized);
        
        m.addEventListener('authorizationStatusDidChange', () => setAuth(m.isAuthorized));
        m.addEventListener('playbackStateDidChange', e => setPlaying(e.state === window.MusicKit.PlaybackStates.playing));
        m.addEventListener('queueItemsDidChange', () => updateQ(m));
        m.addEventListener('queuePositionDidChange', () => updateQ(m));
        
        m.addEventListener('mediaItemDidChange', e => {
          setNP(e.item);
          setProg(0);
          updateQ(m);
        });
        
        // Sıra yükleme mantığı MusicKit objelerini bozduğu için geçici olarak devre dışı bırakıldı.
        fetchStorefront();
      } catch (e) { console.error(e); }
    };
    window.MusicKit ? init() : document.addEventListener('musickitloaded', init);
  }, []);

  /* ── 500ms ticker ── */
  useEffect(() => {
    if (playing || mk) {
      timerRef.current = setInterval(() => {
        if (mk) { 
          setProg(mk.currentPlaybackTime || 0); 
          setDur(mk.currentPlaybackDuration || 0); 
          if (mk.nowPlayingItem && (!nowPlaying || mk.nowPlayingItem.id !== nowPlaying.id)) {
            setNP(mk.nowPlayingItem);
          }
        }
      }, 500);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [playing, mk, nowPlaying]);

  /* ── Fetch lyrics when nowPlaying changes ── */
  useEffect(() => {
    if (nowPlaying && rightPanel === 'lyrics') fetchLyrics(nowPlaying);
  }, [nowPlaying, rightPanel]);

  /* ── Load on auth ── */
  useEffect(() => { if (authorized && mk) { fetchPlaylists(); fetchStorefront(); } }, [authorized, mk]);

  const hdrs = () => ({ 'Authorization': `Bearer ${DEV_TOKEN}`, 'Music-User-Token': mk?.musicUserToken || '' });

  const fetchStorefront = async () => {
    try {
      const r = await fetch('https://api.music.apple.com/v1/me/storefront', { headers: hdrs() });
      const j = await r.json();
      setSf(j?.data?.[0]?.id?.toUpperCase() || 'TR');
    } catch { setSf('TR'); }
  };

  const fetchPlaylists = async () => {
    try {
      const r = await fetch('https://api.music.apple.com/v1/me/library/playlists?limit=100', { headers: hdrs() });
      const j = await r.json();
      setPlaylists(j?.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchLyrics = async (item) => {
    setLyrics(null); setLyricsLoading(true);
    try {
      const catalogId = item?.attributes?.playParams?.catalogId || item?.id;
      if (!catalogId) {
        setLyrics(['Sözler bu şarkı için mevcut değil. (Catalog ID yok)']);
        return;
      }
      setLyricsLoading(true);
      const m = window.MusicKit.getInstance();
      
      // Şarkının orijinal mağazasını (storefront) URL'den çek (örn: /ru/ veya /tr/)
      const res = await m.api.music(`v1/catalog/${storefront.toLowerCase()}/songs/${catalogId}/lyrics`);
      const ttml = res?.data?.data?.[0]?.attributes?.ttml || res?.data?.[0]?.attributes?.ttml || res?.data?.[0]?.attributes?.plainLyrics;
      
      if (ttml) {
        const rawText = ttml.replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(l => l.length > 0);
        setLyrics(rawText.length ? rawText : ['Sözler bulunamadı.']);
      } else {
        throw new Error("Apple Music yetkisi yok.");
      }
    } catch (e) {
      // 3. Parti Alternatif (Genius/OVH Fallback)
      try {
        const title = item?.attributes?.name;
        const artist = item?.attributes?.artistName;
        if (title && artist) {
          // api.lyrics.ovh herkese açık ve CORS destekli bir lirik API'sidir.
          const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
          if (ovhRes.ok) {
            const ovhData = await ovhRes.json();
            if (ovhData.lyrics) {
              const lines = ovhData.lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
              setLyrics(["(Lyrics.ovh'dan çekildi)", "", ...lines]);
              return;
            }
          }
        }
      } catch (err) {}
      
      setLyrics([`HATA: Apple Music bu bölgede sözleri gizliyor.`, `Ayrıca 3. parti sunucularda da bulunamadı.`]); 
    }
    finally { setLyricsLoading(false); }
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT') return;
      if (!mk) return;
      if (e.code === 'Space')      { e.preventDefault(); playing ? mk.pause() : mk.play(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); mk.skipToNextItem(); }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); mk.skipToPreviousItem(); }
      if (e.code === 'ArrowUp')    { e.preventDefault(); changeVol(Math.min(1, volume + 0.05)); }
      if (e.code === 'ArrowDown')  { e.preventDefault(); changeVol(Math.max(0, volume - 0.05)); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mk, playing, volume]);

  /* ── Auth ── */
  const login  = async () => { try { await mk.authorize(); setAuth(mk.isAuthorized); } catch { alert('Giriş başarısız.'); } };
  const logout = async () => { await mk.unauthorize(); setAuth(false); setPlaylists([]); setTracks([]); setCurrentPl(null); };

  /* ── Playlist ── */
  const openPlaylist = async pl => {
    setCurrentPl(pl); setTracks([]); setTrackQ(''); setSortKey(null); setLyrics(null);
    try {
      let allTracks = [];
      let nextUrl = `https://api.music.apple.com/v1/me/library/playlists/${pl.id}/tracks?limit=100`;
      
      while (nextUrl) {
        const url = nextUrl.startsWith('http') ? nextUrl : `https://api.music.apple.com${nextUrl}`;
        const r = await fetch(url, { headers: hdrs() });
        const j = await r.json();
        if (j?.data) allTracks = [...allTracks, ...j.data];
        nextUrl = j?.next;
      }
      setTracks(allTracks);
    } catch (e) { console.error(e); }
  };

  /* ── Playback ── */
  const playTrack = async track => {
    try {
      const idx = displayed.findIndex(t => t.id === track.id);
      setNP(displayed[idx]);
      
      // Çok daha güvenilir kuyruk ayarlama
      if (currentPl && !trackQ) {
         await mk.setQueue({ playlist: currentPl.id, startPosition: idx });
      } else {
         await mk.setQueue({ items: displayed });
         const realIdx = mk.queue?.items?.findIndex(i => i.id === track.id || i.sourceId === track.id) ?? idx;
         await mk.changeToMediaAtIndex(Math.max(0, realIdx));
      }
      await mk.play();
    } catch (e) { 
      alert('Müzik Çalma Hatası: ' + (e.message || JSON.stringify(e))); 
    }
  };

  const playNext = async item => {
    try {
      if (mk) await mk.playNext({ items: [item] });
    } catch (e) { alert('Sıraya eklenemedi: ' + e?.message); }
  };
  const addToQueue = async item => {
    try {
      if (mk) await mk.playLater({ items: [item] });
    } catch (e) { alert('Sıranın sonuna eklenemedi: ' + e?.message); }
  };
  
  const shufflePlaylist = async item => {
    try {
      mk.shuffleMode = 1; setShuffle(true);
      await mk.setQueue({ playlist: item.id });
      await mk.play();
    } catch { alert('Oynatılamadı.'); }
  };
  
  const removeFromQueue = async (index) => {
    try { if (mk && mk.queue) await mk.queue.remove(index); }
    catch { alert('Sıradan kaldırılamadı.'); }
  };

  const addToPlaylist = (track, pl) => {
    // Apple Music API doesn't allow adding tracks via MusicKit JS without server
    alert(`"${track.attributes.name}" → "${pl.attributes.name}" listesine eklemek için Apple Music uygulamasını kullanın.`);
  };

  const togglePlay = async () => { 
    try {
      if (mk) {
        if (mk.queue.items.length === 0) {
          alert('Sıra boş! Lütfen önce bir şarkının üzerine tıklayarak çalmayı başlatın.');
          return;
        }
        playing ? await mk.pause() : await mk.play(); 
      }
    } catch(e) { alert('Müzik Hatası: ' + e.message); }
  };
  const changeVol    = v  => { setVol(v); if (mk) mk.volume = v; setMuted(v === 0); };
  const toggleMute   = () => { if (muted) { changeVol(volume || 0.5); setMuted(false); } else { if (mk) mk.volume = 0; setMuted(true); } };
  const cycleRepeat  = () => setRepeat(r => { const n = (r+1)%3; if (mk) mk.repeatMode = n; return n; });
  const cycleShuffle = () => setShuffle(s => { const n = !s; if (mk) mk.shuffleMode = n ? 1 : 0; return n; });

  const seek = e => {
    if (!progRef.current || !mk || !duration) return;
    const { left, width } = progRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - left) / width)) * duration;
    mk.seekToTime(t); setProg(t);
  };

  const togglePanel = panel => {
    setRightPanel(v => v === panel ? null : panel);
    if (panel === 'lyrics' && nowPlaying) fetchLyrics(nowPlaying);
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
      l = l.filter(t => t.attributes.name?.toLowerCase().includes(q) || t.attributes.artistName?.toLowerCase().includes(q) || t.attributes.albumName?.toLowerCase().includes(q));
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
  const VIcon  = muted || volume === 0 ? I.volMute : volume < 0.5 ? I.volLow : I.volHigh;
  const npArt  = artURL(nowPlaying?.attributes?.artwork, 52);
  const isNP   = t => nowPlaying && t.id === nowPlaying.id;

  const hasRightPanel = rightPanel !== null;

  /* ── Render ── */
  if (!configured) return <div className="loading">🥃 Cognac<span className="loading-sub">Yükleniyor</span></div>;

  if (!authorized) return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🥃</div>
        <h1>Cognac</h1>
        <p>Apple Music kütüphanenize erişmek için<br/>giriş yapın.</p>
        <button className="auth-btn" onClick={login}>Apple Kimliği ile Giriş Yap</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y} track={ctxMenu.track} playlists={playlists}
          onClose={() => setCtxMenu(null)}
          onPlayNext={playNext}
          onAddToQueue={addToQueue}
          onAddToPlaylist={addToPlaylist}
        />
      )}
      {qCtxMenu && (
        <QueueContextMenu
          x={qCtxMenu.x} y={qCtxMenu.y} index={qCtxMenu.index} track={qCtxMenu.track}
          onClose={() => setQCtxMenu(null)}
          onRemove={removeFromQueue}
          onPlayNext={playNext}
          onAddToPlaylist={addToPlaylist}
        />
      )}
      {plCtxMenu && (
        <PlaylistContextMenu
          x={plCtxMenu.x} y={plCtxMenu.y} playlist={plCtxMenu.playlist}
          onClose={() => setPlCtxMenu(null)}
          onPlayNext={playNext}
          onShuffle={shufflePlaylist}
          onEdit={setEditPl}
        />
      )}

      {/* Settings overlay */}
      {showSettings && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSettings(false)}>
          <div className="settings-card">
            <div className="settings-header">
              <span className="settings-title">Hesap Ayarları</span>
              <button className="icon-btn" onClick={() => setSettings(false)}><I.close /></button>
            </div>
            <div className="settings-row">
              <span>İsim</span>
              <input 
                type="text" 
                className="settings-input" 
                value={userName} 
                onChange={e => { setUserName(e.target.value); localStorage.setItem('cognac_username', e.target.value); }} 
              />
            </div>
            <div className="settings-row"><span>Apple Music Bölgesi</span><b>{storefront}</b></div>
            <div className="settings-row"><span>Toplam Playlist</span><b>{playlists.length}</b></div>
            <div className="settings-row"><span>Versiyon</span><b>Cognac 1.0</b></div>
            <div className="settings-row"><span>Ses</span><b>%{volPct}</b></div>
            <button className="settings-logout-btn" onClick={() => { setSettings(false); logout(); }}>Oturumu Kapat</button>
          </div>
        </div>
      )}

      <div className={`app ${hasRightPanel ? 'has-panel' : ''}`}>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar drag-region">
          <div className="brand no-drag">
            <img src="/icon-192.png" className="brand-logo" alt="Cognac" />
            Cognac
          </div>

          {/* User Card */}
          <div className="user-card" onClick={() => setSettings(true)}>
            <div className="user-avatar">
              <I.note />
            </div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-sub">🌍 {storefront} · Üye</div>
            </div>
            <div className="user-badge"><I.settings /></div>
          </div>

          <div className="section-label">Kütüphane</div>

          <div className="playlists-scroll">
            {playlists.map(pl => {
              const cover = artURL(pl.attributes?.artwork, 36);
              const grad  = playlistGradient(pl.attributes.name);
              return (
                <div 
                  key={pl.id} 
                  className={`playlist-item ${currentPl?.id === pl.id ? 'active' : ''}`} 
                  onClick={() => openPlaylist(pl)}
                  onContextMenu={e => { e.preventDefault(); setPlCtxMenu({ x: e.clientX, y: e.clientY, playlist: pl }); }}
                >
                  {cover
                    ? <img src={cover} className="pl-cover" alt="" />
                    : <div className="pl-cover-ph" style={{ background: grad }}>
                        <span style={{ fontSize: '.9rem' }}>🎵</span>
                      </div>
                  }
                  <span className="pl-name">{pl.attributes.name}</span>
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button className="nav-btn" onClick={() => setSettings(true)}><I.settings /><span>Ayarlar</span></button>
            <button className="nav-btn danger" onClick={logout}><I.logout /><span>Çıkış</span></button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          {currentPl ? (
            <>
              <div className="main-header">
                <div className="header-left">
                  {/* Big playlist cover */}
                  {(() => {
                    const cover = artURL(currentPl.attributes?.artwork, 80);
                    const grad  = playlistGradient(currentPl.attributes.name);
                    return cover
                      ? <img src={cover} className="header-cover" alt="" />
                      : <div className="header-cover-ph" style={{ background: grad }}>🎵</div>;
                  })()}
                  <div>
                    <div className="header-label">Çalma Listesi</div>
                  <div className="header-title">{currentPl.attributes.name}</div>
                  {currentPl.attributes.description?.standard && (
                    <div className="header-desc">{currentPl.attributes.description.standard}</div>
                  )}
                  <div className="header-meta">{displayed.length} şarkı</div>
                <div className="header-actions" style={{ display:'flex', gap:'.5rem', marginTop:'1rem' }}>
                  <button className="auth-btn" style={{ width:'auto', padding:'.5rem 1.5rem', display:'flex', alignItems:'center', gap:'.5rem' }} onClick={() => playTrack(displayed[0])}><I.playSmall /> Oynat</button>
                  <button className="auth-btn" style={{ width:'auto', padding:'.5rem 1.5rem', background:'rgba(255,255,255,.1)', color:'#fff', display:'flex', alignItems:'center', gap:'.5rem' }} onClick={() => shufflePlaylist(currentPl)}><I.shuffle /> Karışık Çal</button>
                </div>
                  </div>
                </div>
                <div className="search-box">
                  <svg className="search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Ara..." value={trackQ} onChange={e => setTrackQ(e.target.value)} />
                </div>
              </div>

              <div className="sort-bar">
                <span className="sort-label">Sırala:</span>
                {[['name','İsim'],['artistName','Sanatçı'],['albumName','Albüm']].map(([k,l]) => (
                  <button key={k} className={`sort-btn ${sortKey===k?'active':''}`} onClick={() => requestSort(k)}>{l}{arrow(k)}</button>
                ))}
              </div>

              <div className="tl-head">
                <div className="tl-col col-num">#</div>
                <div className="tl-col col-title">Başlık</div>
                <div className="tl-col col-album">Albüm</div>
                <div className="tl-col col-dur">Süre</div>
              </div>

              <div className="track-list">
                {displayed.map((t, i) => {
                  const tCover = artURL(t.attributes?.artwork, 38);
                  const tGrad  = playlistGradient(t.attributes.albumName || t.attributes.name);
                  return (
                    <div
                      key={t.id + i}
                      className={`track-row ${isNP(t) ? 'is-playing' : ''}`}
                      onClick={() => playTrack(t)}
                      onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, track: t }); }}
                    >
                      <div className="t-num">
                        <span className="t-n">{i + 1}</span>
                        <span className="t-p"><I.playSmall /></span>
                      </div>
                      {tCover
                        ? <img src={tCover} className="t-cover" alt="" />
                        : <div className="t-cover-ph" style={{ background: tGrad }}><I.note /></div>
                      }
                      <div className="t-info">
                        <div className="t-name">{t.attributes.name}</div>
                        <div className="t-artist">{t.attributes.artistName}</div>
                      </div>
                      <div className="t-album">{t.attributes.albumName}</div>
                      <div className="t-dur">{fmtMs(t.attributes.durationInMillis)}</div>
                    </div>
                  );
                })}
                {displayed.length === 0 && <div className="empty-state"><div>🔍</div><p>Sonuç yok</p></div>}
              </div>
            </>
          ) : (
            <div className="home-screen">
              <img src="/icon-192.png" className="home-icon" alt="Cognac" />
              <div className="home-title">Müzik Krallığına Hoş Geldiniz</div>
              <div className="home-sub">Sol menüden bir liste seçin<br/><span style={{opacity:.5, fontSize:'.82rem'}}>Space = oynat · ← → = şarkı geç · ↑ ↓ = ses</span></div>
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL ── */}
        {hasRightPanel && (
          <div className="right-panel">
            <div className="panel-header">
              <span className="panel-title">{rightPanel === 'queue' ? 'Sıradakiler' : 'Şarkı Sözleri'}</span>
              <button className="icon-btn" onClick={() => setRightPanel(null)}><I.close /></button>
            </div>
            <div className="panel-body">
              {rightPanel === 'queue' && (
                <>
                  <div className="queue-header-row">
                    <span className="queue-label">Geçmiş</span>
                    <button className="queue-clear-btn" onClick={() => setQueueHistory([])}>Geçmişi Temizle</button>
                  </div>
                  {queueHistory && queueHistory.length > 0 && queueHistory.map((item, i) => (
                    <div key={'h'+i} className="queue-item history" onClick={() => mk.changeToMediaAtIndex(mk.queue.position - queueHistory.length + i)}>
                      <div className="qi-info">
                        <div className="qi-name">{item.attributes?.name || item.title}</div>
                        <div className="qi-artist">{item.attributes?.artistName || item.artistName}</div>
                      </div>
                    </div>
                  ))}

                  {nowPlaying && (
                    <div className="queue-now" style={{ marginTop: '1.5rem' }}>
                      <div className="queue-label">Şu an çalıyor</div>
                      <div className="queue-item active">
                        <div className="qi-dot on" />
                        <div className="qi-info">
                          <div className="qi-name">{nowPlaying.attributes?.name}</div>
                          <div className="qi-artist">{nowPlaying.attributes?.artistName}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="queue-header-row" style={{ marginTop: '1rem' }}>
                    <span className="queue-label" style={{ marginBottom: 0 }}>Sıradaki</span>
                    <button className="queue-clear-btn" onClick={() => mk && mk.setQueue({ items: [mk.nowPlayingItem] })}>Sırayı Temizle</button>
                  </div>
                  {queue.length > 0 ? queue.map((item, i) => (
                    <div key={'q'+i} className="queue-item" onClick={() => mk.changeToMediaAtIndex((mk.queue.position ?? 0) + i + 1)} onContextMenu={e => { e.preventDefault(); setQCtxMenu({ x: e.clientX, y: e.clientY, index: (mk.queue.position ?? 0) + i + 1, track: item }); }}>
                      <div className="qi-dot" />
                      <div className="qi-info">
                        <div className="qi-name">{item.attributes?.name || item.title}</div>
                        <div className="qi-artist">{item.attributes?.artistName || item.artistName}</div>
                      </div>
                    </div>
                  )) : <div className="queue-empty">Sıra boş</div>}
                </>
              )}
              {rightPanel === 'lyrics' && (
                lyricsLoading ? <div className="lyrics-loading">Sözler yükleniyor…</div>
                : lyrics ? <div className="lyrics-content">{lyrics.map((l, i) => <p key={i} className="lyrics-line">{l}</p>)}</div>
                : <div className="lyrics-loading">Bir şarkı seçin</div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYER ── */}
        <footer className="player">
          {/* Left */}
          <div className="now-playing">
            {nowPlaying ? (
              <>
                <div className="np-art-wrap" onClick={() => setCoverModal(artURL(nowPlaying.attributes?.artwork, 800))}>
                  <img src={artURL(nowPlaying.attributes?.artwork, 52)} className="np-art" alt="" />
                  <div className="np-art-overlay"><I.info /></div>
                </div>
                <div className="np-info">
                  <div className="np-title">{nowPlaying.attributes?.name}</div>
                  <div className="np-artist">{nowPlaying.attributes?.artistName}</div>
                </div>
              </>
            ) : (
              <div className="np-info" style={{ opacity: .2 }}>
                <div className="np-title">Cognac</div>
                <div className="np-artist">Bir liste seçin</div>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="center">
            <div className="ctrl-btns">
              <button className={`cbtn ${shuffle?'on':''}`} onClick={cycleShuffle} title="Karıştır"><I.shuffle /></button>
              <button className="cbtn" onClick={() => mk?.skipToPreviousItem()} title="Önceki (←)"><I.prev /></button>
              <button className="pp-btn" onClick={togglePlay} title="Space">
                {playing ? <I.pause /> : <I.play />}
              </button>
              <button className="cbtn" onClick={() => mk?.skipToNextItem()} title="Sonraki (→)"><I.next /></button>
              <button className={`cbtn ${repeat>0?'on':''}`} onClick={cycleRepeat} title="Tekrar">
                {repeat === 2 ? <I.repeat1 /> : <I.repeat />}
              </button>
            </div>
            <div className="prog-row">
              <span className="prog-t">{fmt(progress)}</span>
              <div className="prog-track" ref={progRef} onClick={seek}>
                <div className="prog-fill" style={{ width:`${pct}%` }}>
                  <div className="prog-dot" />
                </div>
              </div>
              <span className="prog-t r">{fmt(duration)}</span>
            </div>
          </div>

          {/* Right */}
          <div className="player-right">
            <button className={`panel-btn ${rightPanel==='lyrics'?'on':''}`} onClick={() => togglePanel('lyrics')} title="Şarkı Sözleri"><I.lyricsIcon /></button>
            <button className={`panel-btn ${rightPanel==='queue'?'on':''}`} onClick={() => togglePanel('queue')} title="Sıra"><I.queue /></button>
            <div className="vol-row">
              <span className="vol-ico" onClick={toggleMute}><VIcon /></span>
              <input type="range" min="0" max="1" step="0.01"
                value={muted ? 0 : volume}
                onChange={e => changeVol(parseFloat(e.target.value))}
                className="vol-slider"
                style={{ '--pct':`${volPct}%` }}
              />
            </div>
          </div>
        </footer>
      </div>

      {coverModal && (
        <div className="overlay" onClick={() => setCoverModal(null)}>
          <img src={coverModal} style={{ width:'600px', height:'600px', borderRadius:'12px', objectFit:'cover', boxShadow:'0 40px 100px rgba(0,0,0,1)' }} alt="Cover" />
        </div>
      )}

      {/* Playlist Düzenleme Modal */}
      {editPl && (
        <div className="overlay" onClick={() => setEditPl(null)}>
          <div className="settings-card" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">Listeyi Düzenle</span>
              <button className="icon-btn" onClick={() => setEditPl(null)}><I.close /></button>
            </div>
            <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem' }}>
              <img src={artURL(editPl.attributes?.artwork, 100) || '/icon-192.png'} style={{width:100, height:100, borderRadius:8, objectFit:'cover'}} alt="" />
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <input className="settings-input" style={{ width:'100%', textAlign:'left' }} defaultValue={editPl.attributes.name} placeholder="Liste Adı" />
                <textarea className="settings-input" style={{ width:'100%', textAlign:'left', height:'60px', resize:'none', fontFamily:'inherit' }} defaultValue={editPl.attributes.description?.standard || ''} placeholder="Açıklama" />
              </div>
            </div>
            <button className="auth-btn" onClick={() => { alert('Apple Music API, liste güncellemelerini henüz desteklemiyor, fakat UI hazır!'); setEditPl(null); }}>Kaydet</button>
          </div>
        </div>
      )}
    </>
  );
}
