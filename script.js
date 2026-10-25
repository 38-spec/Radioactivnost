// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// Данные плейлистов (5 штук)
const playlists = [
  {
    id: 1,
    title: 'Morning Vibes',
    emoji: '☀️',
    color: 'linear-gradient(135deg, #f6d365, #fda085)',
    tracks: [
      { title: 'Sunrise', artist: 'Lumen', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { title: 'Coffee Time', artist: 'Jazz Cat', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
    ]
  },
  {
    id: 2,
    title: 'Workout Power',
    emoji: '💪',
    color: 'linear-gradient(135deg, #ff512f, #dd2476)',
    tracks: [
      { title: 'Beast Mode', artist: 'Iron Pulse', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      { title: 'Run Fast', artist: 'Cardio Beat', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
    ]
  },
  {
    id: 3,
    title: 'Late Night',
    emoji: '🌙',
    color: 'linear-gradient(135deg, #141e30, #243b55)',
    tracks: [
      { title: 'Midnight', artist: 'Noir', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { title: 'Dreams', artist: 'Lo-Fi Soul', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
    ]
  },
  {
    id: 4,
    title: 'Chill Zone',
    emoji: '🍃',
    color: 'linear-gradient(135deg, #a8edea, #fed6e3)',
    tracks: [
      { title: 'Breeze', artist: 'Ocean Mind', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
      { title: 'Relax', artist: 'Calm Waves', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
    ]
  },
  {
    id: 5,
    title: 'Beats',
    emoji: '🔥',
    color: 'linear-gradient(135deg, #f093fb, #f5576c)',
    tracks: [
      { title: 'Drop It', artist: 'Bass King', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
      { title: 'Flow', artist: 'Beat Maker', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' }
    ]
  }
];

// Состояние
let currentPlaylist = null;
let currentTrackIndex = 0;
let isPlaying = false;

// DOM элементы
const container = document.getElementById('playlistsContainer');
const fixedPlayer = document.getElementById('fixedPlayer');
const audio = document.getElementById('audioPlayer');

const playPauseBtn = document.getElementById('playPauseBtn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const prevBtn = document.getElementById('prevBtn');
const shareBtn = document.getElementById('shareBtn');

const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackCover = document.getElementById('trackCover');
const currentPlaylistBadge = document.getElementById('currentPlaylistBadge');

const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Рендер плейлистов (в старом визуальном стиле)
function renderPlaylists() {
  container.innerHTML = '';
  playlists.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.dataset.id = pl.id;
    card.innerHTML = `
      <div class="playlist-card-content">
        <div class="playlist-info">
          <div class="playlist-name">${pl.emoji} ${pl.title}</div>
          <div class="playlist-tracks-count">${pl.tracks.length} треков</div>
        </div>
        <div class="playlist-play-icon">▶</div>
      </div>
    `;
    card.addEventListener('click', () => openPlaylist(pl, card));
    container.appendChild(card);
  });
}

// Открыть плейлист
function openPlaylist(playlist, cardElement) {
  // Убираем активный класс у всех
  document.querySelectorAll('.playlist-card').forEach(c => c.classList.remove('active'));
  // Добавляем текущему
  if (cardElement) cardElement.classList.add('active');

  currentPlaylist = playlist;
  currentTrackIndex = 0;
  
  // Показываем нижний плеер
  fixedPlayer.style.display = 'block';
  currentPlaylistBadge.textContent = playlist.title;
  
  loadTrack();
}

// Загрузить текущий трек
function loadTrack() {
  if (!currentPlaylist) return;
  const track = currentPlaylist.tracks[currentTrackIndex];
  
  audio.src = track.src;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  
  // Применяем градиент плейлиста к иконке
  trackCover.style.background = currentPlaylist.color;
  
  // Сброс прогресс-бара
  progressBar.value = 0;
  currentTimeEl.textContent = '0:00';
  
  if (isPlaying) {
    audio.play().catch(() => {});
  }
}

// Обновление иконок Play/Pause
function updatePlayPauseIcons(playing) {
  if (playing) {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
  } else {
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
  }
}

// Play / Pause
playPauseBtn.addEventListener('click', () => {
  if (!currentPlaylist) {
    openPlaylist(playlists[0], document.querySelector('.playlist-card'));
  }
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play().catch(() => {});
    isPlaying = true;
  }
  updatePlayPauseIcons(isPlaying);
});

// Предыдущий трек
prevBtn.addEventListener('click', () => {
  if (!currentPlaylist) return;
  currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length;
  loadTrack();
  if (isPlaying) audio.play().catch(() => {});
});

// Share
shareBtn.addEventListener('click', async () => {
  if (!currentPlaylist) return;
  const track = currentPlaylist.tracks[currentTrackIndex];
  const shareData = {
    title: track.title,
    text: `Слушаю "${track.title}" — ${track.artist} в Радиоактивность 📻`,
    url: window.location.href
  };
  
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) {}
  } else {
    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    // Простая визуальная обратная связь
    const originalText = trackTitle.textContent;
    trackTitle.textContent = 'Ссылка скопирована!';
    setTimeout(() => { trackTitle.textContent = originalText; }, 1500);
  }
});

// Автопереход к следующему треку
audio.addEventListener('ended', () => {
  if (!currentPlaylist) return;
  currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
  loadTrack();
  audio.play().catch(() => {});
});

// === Логика прогресс-бара ===
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

progressBar.addEventListener('input', (e) => {
  if (audio.duration) {
    const seekTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = seekTime;
  }
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Старт
renderPlaylists();
