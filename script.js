// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Базовый URL Cloudflare R2 (используется, если в таблице указан только путь к файлу)
const R2_BASE_URL = "https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev";

// === SHEET_ID ===
const SHEET_ID = "1dyard1Bb_7Vwmi_cVj2rEqcDNMzM9LPngohSoXH7JTQ"; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Глобальная переменная для хранения всех данных из таблицы
let artistLinksData = [];

// Базовая структура плейлистов (имена и Spotify ссылки)
// Треки будут добавлены сюда динамически из Google Таблицы
// Базовая структура плейлистов (имена и Spotify ссылки)
// Треки будут добавлены сюда динамически из Google Таблицы
let playlistsData = {
    1: {
        name: "Ma Hood",
        spotifyUrl: "", 
        tracks: []
    },
    2: {
        name: "Старая Школа",
        spotifyUrl: "https://open.spotify.com/playlist/4i0gEbdeQ0je5ANjmQCuGA?si=vjbSRnRDSkuVNkeYOKiYQg&utm_source=copy-link&pi=gCo5u7wdRyGj8", 
        tracks: []
    },
    3: {
        name: "Новая Школа",
        spotifyUrl: "https://open.spotify.com/playlist/3XOU9kzckIsCcY02opnNf4?si=Petq-_BsQiqFv_6jfHFATA&utm_source=copy-link&pi=g3Bgrfl0Sn-02",
        tracks: []
    },
    4: {
        name: "Chill Zone",
        spotifyUrl: "",
        tracks: []
    },
    5: {
        name: "Beats",
        spotifyUrl: "",
        tracks: []
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
    if (!playlistsGrid) return;
    
    const allCards = playlistsGrid.querySelectorAll('.playlist-card');
    allCards.forEach(card => card.classList.remove('active'));
    
    playlistsGrid.innerHTML = '';
    
    Object.keys(playlistsData).forEach(id => {
        const playlist = playlistsData[id];
        const isActive = Number(id) === Number(currentPlaylistId);
        
        // Если треков еще нет (таблица грузится), показываем 0
        const trackCount = playlist.tracks ? playlist.tracks.length : 0;
        
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
                    <div class="playlist-tracks-count">${trackCount} треков</div>
                </div>
                <div class="playlist-play-icon">${iconHtml}</div>
            </div>
        `;
        card.addEventListener('click', () => handlePlaylistClick(Number(id)));
        playlistsGrid.appendChild(card);
    });
}

// === Обработка клика по плейлисту ===
function handlePlaylistClick(playlistId) {
    const playlist = playlistsData[playlistId];
    if (!playlist || playlist.tracks.length === 0) {
        showToast('В этом плейлисте пока нет треков');
        return;
    }

    if (currentPlaylistId === playlistId) {
        togglePlay();
        return;
    }
    currentPlaylistId = playlistId;
    shuffledIndexes = createShuffledIndexes(playlist.tracks.length);
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

// === Воспроизведение и Пауза ===
function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        updatePlayPauseIcon();
        renderPlaylists();
    }).catch(error => {
        console.error('Ошибка воспроизведения:', error);
    });
}

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

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

// === Переключение треков ===
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

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// =========================================================================
// === ЗАГРУЗКА ИЗ GOOGLE ТАБЛИЦЫ И ДИНАМИЧЕСКАЯ СБОРКА ===
// =========================================================================

// 1. Загрузка и парсинг таблицы
async function loadArtistLinks() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonStr);
        
        const cols = data.table.cols.map(c => c.label);
        
        artistLinksData = data.table.rows.map(row => {
            const obj = {};
            row.c.forEach((cell, index) => {
                let colName = cols[index] ? String(cols[index]).trim().toLowerCase() : "";
                
                // Умное определение колонок по ключевым словам
                if (colName.includes('playlist') || colName === 'id') colName = 'playlistid';
                else if (colName.includes('insta')) colName = 'instagram';
                else if (colName.includes('yandex') || colName.includes('яндекс')) colName = 'yandex';
                else if (colName.includes('youtube') || colName.includes('ютуб') || colName.includes('you')) colName = 'youtube';
                else if (colName.includes('spotify')) colName = 'spotify';
                else if (colName.includes('general') || colName.includes('общая') || colName.includes('ссылка') || colName === 'link') colName = 'general';
                else if (colName.includes('title') || colName.includes('название') || colName.includes('трек')) colName = 'title';
                else if (colName.includes('artist') || colName.includes('исполнитель')) colName = 'artist';
                // === НОВОЕ: Определение колонки со ссылкой на аудиофайл ===
                else if (colName.includes('src') || colName.includes('cloudflare') || colName.includes('audio') || colName.includes('файл') || colName.includes('mp3') || colName.includes('url')) colName = 'src';
                else colName = colName.replace(/\s+/g, '_');
                
                obj[colName] = cell && cell.v ? String(cell.v).trim() : "";
            });
            
            if (obj.playlistid) obj.playlistId = parseInt(obj.playlistid);
            return obj;
        });
        
        console.log("✅ Данные из Google Таблицы успешно загружены:", artistLinksData.length, "строк");
        
    } catch (error) {
        console.error("❌ Ошибка загрузки Google Таблицы:", error);
        showToast("Ошибка загрузки данных");
    }
}

// 2. === НОВОЕ: Динамическая сборка плейлистов из таблицы ===
function buildPlaylistsFromSheet() {
    artistLinksData.forEach(row => {
        const pId = row.playlistId;
        
        // Проверяем, что playlistId соответствует нашим (1, 2 или 3)
        if (playlistsData[pId]) {
            // Добавляем трек только если у него есть название, исполнитель и ссылка на источник
            if (row.title && row.artist && row.src) {
                let finalSrc = row.src;
                
                // Если ссылка не начинается с http, добавляем базовый URL Cloudflare
                if (!finalSrc.startsWith('http')) {
                    finalSrc = `${R2_BASE_URL}${finalSrc.startsWith('/') ? '' : '/'}${finalSrc}`;
                }
                
                playlistsData[pId].tracks.push({
                    title: row.title,
                    artist: row.artist,
                    src: finalSrc
                });
            }
        }
    });
    
    console.log("✅ Плейлисты успешно сформированы из таблицы:", playlistsData);
}

// 3. Поиск нужных ссылок для текущего играющего трека (для кнопки "Поделиться")
function getLinksForCurrentTrack() {
    const playlist = playlistsData[currentPlaylistId];
    if (!playlist || !playlist.tracks[shuffledIndexes[currentTrackIndex]]) {
        return {};
    }
    
    const track = playlist.tracks[shuffledIndexes[currentTrackIndex]];
    const searchTitle = track.title.trim().toLowerCase();
    const searchArtist = track.artist.trim().toLowerCase();

    const linkData = artistLinksData.find(item => {
        return item.playlistId === currentPlaylistId && 
            item.title && item.title.trim().toLowerCase() === searchTitle &&
            item.artist && item.artist.trim().toLowerCase() === searchArtist;
    });

    return linkData || { 
        instagram: "", yandex: "", youtube: "", spotify: "", general: "", title: "", artist: "" 
    };
}

// 4. Обработчик кнопки "Поделиться"
shareBtn.addEventListener('click', () => {
    if (!currentPlaylistId) {
        showToast('Сначала выбери трек!');
        return;
    }
    
    const links = getLinksForCurrentTrack();
    
    if (currentPlaylistId === 1) {
        const allLinks = [
            { icon: "", text: "Instagram", url: links.instagram },
            { icon: "🎵", text: "Яндекс Музыка", url: links.yandex },
            { icon: "🎧", text: "Spotify", url: links.spotify },
            { icon: "▶️", text: "YouTube", url: links.youtube },
            { icon: "", text: "Общая ссылка", url: links.general }
        ];
        showLinkModal("Перейти к исполнителю", allLinks);
    } else {
        const playlist = playlistsData[currentPlaylistId];
        showLinkModal("Слушать плейлист", [
            { icon: "🎧", text: "Открыть в Spotify", url: playlist.spotifyUrl }
        ]);
    }
});

// 5. Универсальное модальное окно
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
        <button class="share-option" data-url="${opt.url}">
            <span class="share-option-icon">${opt.icon}</span>
            <span>${opt.text}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-title">${title}</div>
            <div class="share-options">${optionsHtml}</div>
            <button class="share-close">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                tg.openLink(url);
                closeShareModal();
            }
        });
    });
    
    modal.querySelector('.share-close').addEventListener('click', closeShareModal);
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
        setTimeout(() => renderPlaylists(), 100);
    }
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
    // 1. Сначала загружаем сырые данные из таблицы
    await loadArtistLinks();
    
    // 2. Затем собираем из них структуру плейлистов
    buildPlaylistsFromSheet();
    
    // 3. И только потом отрисовываем интерфейс
    renderPlaylists();
}

initApp();
