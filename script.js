// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Базовый URL Cloudflare R2
const R2_BASE_URL = "https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev";

// === НОВОЕ: ВСТАВЬТЕ СЮДА ВАШ SHEET_ID ИЗ ШАГА 3 ===
const SHEET_ID = "1dyard1Bb_7Vwmi_cVj2rEqcDNMzM9LPngohSoXH7JTQ"; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Глобальная переменная для хранения ссылок из таблицы
let artistLinksData = [];

// Данные плейлистов
const playlistsData = {
    1: {
        name: "Ma Hood",
        tracks: [
            { title: "Autlo", artist: "XXX", src: `${R2_BASE_URL}/MaBroths/autlo_hpp.mp3` },
            { title: "Шаныч", artist: "Come and find me", src: `${R2_BASE_URL}/MaBroths/Come%26findme_demo01.mp3` }
        ]
    },
    2: {
        name: "Старая Школа",
        tracks: [
            { title: "Truffel the Phunky", artist: "Bionic Muscle", src: `${R2_BASE_URL}/OldSchool/Truffel%20the%20Phunky%20Phaqir%20-%20Bionic%20Muscle.mp3` },
            { title: "SiR", artist: "Hair Down", src: `${R2_BASE_URL}/OldSchool/SiR%20-%20Hair%20Down.mp3` }
        ]
    },
    3: {
        name: "Новая Школа",
        tracks: [
            { title: "Трек 1", artist: "Исполнитель", src: `${R2_BASE_URL}/playlist3/track1.mp3` }
        ]
    }
};

// Состояние приложения
let currentPlaylistId = null;
let currentTrackIndex = 0;
let isPlaying = false;
let shuffledIndexes = [];

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
const shareBtn = document.getElementById('share-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

// === ФУНКЦИЯ SHUFFLE (алгоритм Фишера-Йетса) ===
function createShuffledIndexes(length) {
    const indexes = Array.from({ length }, (_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
}

// === ОТРИСОВКА ПЛЕЙЛИСТОВ ===
function renderPlaylists() {
    playlistsGrid.innerHTML = '';
    Object.keys(playlistsData).forEach(id => {
        const playlist = playlistsData[id];
        const isActive = parseInt(id) === currentPlaylistId;
        const card = document.createElement('div');
        card.className = 'playlist-card' + (isActive ? ' active' : '');
        card.dataset.id = id;
        
        const iconHtml = isActive && isPlaying 
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" fill="white"/></svg>`;
        
        card.innerHTML = `
            <div class="playlist-card-content">
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-tracks-count">${playlist.tracks.length} треков</div>
                </div>
                <div class="playlist-play-icon">${iconHtml}</div>
            </div>
        `;
        card.addEventListener('click', () => handlePlaylistClick(parseInt(id)));
        playlistsGrid.appendChild(card);
    });
}

// === Обработка клика по плейлисту ===
function handlePlaylistClick(playlistId) {
    if (currentPlaylistId === playlistId) {
        togglePlay();
        return;
    }
    currentPlaylistId = playlistId;
    shuffledIndexes = createShuffledIndexes(playlistsData[playlistId].tracks.length);
    currentTrackIndex = 0;
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
    
    nowPlaying.style.display = 'flex';
    controls.style.display = 'flex';
    progressContainer.style.display = 'flex';
    shuffleInfo.style.display = 'block';
    
    renderPlaylists();
}

// === Воспроизведение ===
function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        updatePlayPauseIcon();
        renderPlaylists();
    }).catch(error => {
        console.error('Ошибка воспроизведения:', error);
    });
}

// === Пауза ===
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updatePlayPauseIcon();
    renderPlaylists();
}

function updatePlayPauseIcon() {
    if (isPlaying) {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
    } else {
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
    }
}

// === Переключение Play/Pause ===
function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

// === Следующий трек ===
function nextTrack() {
    const playlist = playlistsData[currentPlaylistId];
    currentTrackIndex++;
    if (currentTrackIndex >= shuffledIndexes.length) {
        shuffledIndexes = createShuffledIndexes(playlist.tracks.length);
        currentTrackIndex = 0;
    }
    loadTrack();
    playTrack();
}

// === Предыдущий трек ===
function prevTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = shuffledIndexes.length - 1;
    }
    loadTrack();
    playTrack();
}

// === Обработчики кнопок ===
playBtn.addEventListener('click', togglePlay);
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

// =========================================================================
// === НОВЫЙ ФУНКЦИОНАЛ: ЗАГРУЗКА ИЗ GOOGLE ТАБЛИЦЫ И КНОПКА ПОДЕЛИТЬСЯ ===
// =========================================================================

// 1. Загрузка и парсинг таблицы
async function loadArtistLinks() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        
        // Google отдает данные с небольшим "мусором" по краям, очищаем его
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonStr);
        
        // Получаем названия колонок
        const cols = data.table.cols.map(c => c.label);
        
        // Преобразуем строки таблицы в удобные объекты
        artistLinksData = data.table.rows.map(row => {
            const obj = {};
            row.c.forEach((cell, index) => {
                const colName = cols[index];
                obj[colName] = cell && cell.v ? String(cell.v) : "";
            });
            // Преобразуем ID плейлиста в число
            if (obj.playlistId) obj.playlistId = parseInt(obj.playlistId);
            return obj;
        });
        console.log("✅ Ссылки из Google Таблицы успешно загружены!");
    } catch (error) {
        console.error("❌ Ошибка загрузки Google Таблицы:", error);
    }
}

// 2. Поиск нужных ссылок для текущего играющего трека
function getLinksForCurrentTrack() {
    const playlist = playlistsData[currentPlaylistId];
    const track = playlist.tracks[shuffledIndexes[currentTrackIndex]];
    
    const searchTitle = track.title.trim().toLowerCase();
    const searchArtist = track.artist.trim().toLowerCase();

    const linkData = artistLinksData.find(item => 
        item.playlistId === currentPlaylistId && 
        item.title && item.title.trim().toLowerCase() === searchTitle &&
        item.artist && item.artist.trim().toLowerCase() === searchArtist
    );

    return linkData || { instagram: "", yandex: "", spotify: "" };
}

// 3. Обновленный клик по кнопке "Поделиться"
shareBtn.addEventListener('click', () => {
    if (!currentPlaylistId) {
        showToast('Сначала выбери трек!');
        return;
    }
    
    const links = getLinksForCurrentTrack();
    
    if (currentPlaylistId === 1) {
        showLinkModal("Перейти к исполнителю", [
            { icon: "", text: "Instagram", url: links.instagram },
            { icon: "🎵", text: "Яндекс Музыка", url: links.yandex }
        ]);
    } else {
        showLinkModal("Слушать плейлист", [
            { icon: "🎧", text: "Открыть в Spotify", url: links.spotify }
        ]);
    }
});

// 4. Универсальное модальное окно
function showLinkModal(title, options) {
    closeShareModal();

    const validOptions = options.filter(opt => opt.url && opt.url.trim() !== "");

    if (validOptions.length === 0) {
        showToast('Для этого трека ссылки еще не добавлены в таблицу');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'share-modal'; 
    
    const optionsHtml = validOptions.map(opt => `
        <button class="share-option" onclick="openExternalLink('${opt.url}')">
            <span class="share-option-icon">${opt.icon}</span>
            <span>${opt.text}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-title">${title}</div>
            <div class="share-options">
                ${optionsHtml}
            </div>
            <button class="share-close" onclick="closeShareModal()">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 5. Открытие ссылки
function openExternalLink(url) {
    if (url && url.trim() !== "") {
        tg.openLink(url); 
    }
    closeShareModal();
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) modal.remove();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('share-modal')) closeShareModal();
});

// =========================================================================
// === ИНИЦИАЛИЗАЦИЯ ===
// =========================================================================

async function initApp() {
    await loadArtistLinks();
    renderPlaylists();
}

initApp();
