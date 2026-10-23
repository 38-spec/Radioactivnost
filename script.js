// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Базовый URL Cloudflare R2
const R2_BASE_URL = "https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev"; // ЗАМЕНИ НА СВОЙ!

// Данные плейлистов
const playlistsData = {
    1: {
        name: "Ma Hood",
        tracks: [
            { title: "Autlo", artist: "XXX", src: `${R2_BASE_URL}https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev/MaBroths/autlo_hpp.mp3` },
            { title: "Шаныч", artist: "Come and find me", src: `${R2_BASE_URL}https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev/MaBroths/Come%26findme_demo01.mp3` }
            // Добавляй свои треки сюда
        ]
    },
    2: {
        name: "Старая Школа",
        tracks: [
            { title: "Truffel the Phunky", artist: "Bionic Muscle", src: `${R2_BASE_URL}/playlist2/track1.mp3` },
            { title: "SiR", artist: "Hair Down", src: `${R2_BASE_URL}/playlist2/track2.mp3` }
        ]
    },
    3: {
        name: "Новая Школа",
        tracks: [
            // Добавь свои треки
            { title: "Трек 1", artist: "Исполнитель", src: `${R2_BASE_URL}/playlist3/track1.mp3` }
        ]
    }
};

// Состояние приложения
let currentPlaylistId = null;
let currentTrackIndex = 0;
let isPlaying = false;
let shuffledIndexes = []; // Массив индексов для shuffle без повторов

// DOM элементы
const audio = document.getElementById('audio-player');
const playlistsGrid = document.getElementById('playlists-grid');
const nowPlaying = document.getElementById('now-playing');
const controls = document.getElementById('controls');
const progressContainer = document.getElementById('progress-container');
const shuffleInfo = document.getElementById('shuffle-info');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');
const currentPlaylistBadge = document.getElementById('current-playlist');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// === ФУНКЦИЯ SHUFFLE (алгоритм Фишера-Йетса) ===
function createShuffledIndexes(length) {
    const indexes = Array.from({ length }, (_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
}

// === Рендер карточек плейлистов ===
function renderPlaylists() {
    playlistsGrid.innerHTML = '';
    Object.keys(playlistsData).forEach(id => {
        const playlist = playlistsData[id];
        const card = document.createElement('div');
        card.className = 'playlist-card' + (parseInt(id) === currentPlaylistId ? ' active' : '');
        card.dataset.id = id;
        card.innerHTML = `
            <div class="playlist-card-content">
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-tracks-count">${playlist.tracks.length} треков</div>
                </div>
                <div class="playlist-play-icon">${parseInt(id) === currentPlaylistId && isPlaying ? '⏸' : '▶'}</div>
            </div>
        `;
        card.addEventListener('click', () => handlePlaylistClick(parseInt(id)));
        playlistsGrid.appendChild(card);
    });
}

// === Обработка клика по плейлисту ===
function handlePlaylistClick(playlistId) {
    // Если кликнули по тому же плейлисту, который играет — просто пауза/плей
    if (currentPlaylistId === playlistId) {
        togglePlay();
        return;
    }
    
    // Иначе — запускаем новый плейлист
    currentPlaylistId = playlistId;
    // Создаем новый перемешанный массив индексов
    shuffledIndexes = createShuffledIndexes(playlistsData[playlistId].tracks.length);
    currentTrackIndex = 0; // Начинаем с первого трека в перемешанном порядке
    
    loadTrack();
    playTrack();
}

// === Загрузка трека ===
function loadTrack() {
    const playlist = playlistsData[currentPlaylistId];
    const track = playlist.tracks[shuffledIndexes[currentTrackIndex]];
    
    audio.src = track.src;
    currentTitle.textContent = track.title;
    currentArtist.textContent = track.artist;
    currentPlaylistBadge.textContent = playlist.name;
    
    // Показываем элементы управления
    nowPlaying.style.display = 'flex';
    controls.style.display = 'flex';
    progressContainer.style.display = 'flex';
    shuffleInfo.style.display = 'block';
    
    renderPlaylists();
}

// === Воспроизведение ===
function playTrack() {
    audio.play()
        .then(() => {
            isPlaying = true;
            playBtn.textContent = '⏸';
            renderPlaylists();
        })
        .catch(error => {
            console.error('Ошибка воспроизведения:', error);
        });
}

// === Пауза ===
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    renderPlaylists();
}

// === Переключение Play/Pause ===
function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

// === Следующий трек (следующий в перемешанном порядке) ===
function nextTrack() {
    const playlist = playlistsData[currentPlaylistId];
    currentTrackIndex++;
    
    // Если дошли до конца перемешанного массива — создаем новый
    if (currentTrackIndex >= shuffledIndexes.length) {
        shuffledIndexes = createShuffledIndexes(playlist.tracks.length);
        currentTrackIndex = 0;
    }
    
    loadTrack();
    playTrack();
}

// === Предыдущий трек ===
function prevTrack() {
    const playlist = playlistsData[currentPlaylistId];
    currentTrackIndex--;
    
    // Если вышли за начало — переходим в конец
    if (currentTrackIndex < 0) {
        currentTrackIndex = shuffledIndexes.length - 1;
    }
    
    loadTrack();
    playTrack();
}

// === Обработчики кнопок ===
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// === Прогресс-бар ===
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

// Автоматический переход к следующему треку
audio.addEventListener('ended', () => {
    nextTrack();
});

progressBar.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
});

// === Форматирование времени ===
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// === Инициализация ===
renderPlaylists();
