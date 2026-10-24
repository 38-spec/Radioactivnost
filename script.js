// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Базовый URL Cloudflare R2
const R2_BASE_URL = "https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev";

// === SHEET_ID ===
const SHEET_ID = "1dyard1Bb_7Vwmi_cVj2rEqcDNMzM9LPngohSoXH7JTQ"; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Глобальная переменная для хранения ссылок из таблицы
let artistLinksData = [];

// Данные плейлистов
const playlistsData = {
    1: {
        name: "Ma Hood",
        tracks: [
            { title: "Track 01", artist: "Autlo", src: `${R2_BASE_URL}/MaBroths/autlo_hpp.mp3` },
            { title: "Come and find me", artist: "Шаныч", src: `${R2_BASE_URL}/MaBroths/Come%26findme_demo01.mp3` }
        ]
    },
    2: {
        name: "Старая Школа",
        spotifyUrl: "https://open.spotify.com/playlist/4i0gEbdeQ0je5ANjmQCuGA?si=vjbSRnRDSkuVNkeYOKiYQg&utm_source=copy-link&pi=gCo5u7wdRyGj8", 
        tracks: [
            { title: "Truffel the Phunky", artist: "Bionic Muscle", src: `${R2_BASE_URL}/OldSchool/Truffel%20the%20Phunky%20Phaqir%20-%20Bionic%20Muscle.mp3` },
            { title: "SiR", artist: "Hair Down", src: `${R2_BASE_URL}/OldSchool/SiR%20-%20Hair%20Down.mp3` }
        ]
    },
    3: {
        name: "Новая Школа",
        spotifyUrl: "https://open.spotify.com/playlist/3XOU9kzckIsCcY02opnNf4?si=Petq-_BsQiqFv_6jfHFATA&utm_source=copy-link&pi=g3Bgrfl0Sn-02",
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

// === ОТРИСОВКА ПЛЕЙЛИСТОВ (ИСПРАВЛЕНА) ===
function renderPlaylists() {
    if (!playlistsGrid) return;
    playlistsGrid.innerHTML = ''; // Полная очистка
    
    Object.keys(playlistsData).forEach(id => {
        const playlist = playlistsData[id];
        // Строгое численное сравнение
        const isActive = Number(id) === Number(currentPlaylistId);
        
        const card = document.createElement('div');
        card.className = 'playlist-card'; // Сбрасываем классы
        if (isActive) {
            card.classList.add('active'); // Добавляем ТОЛЬКО активному элементу
        }
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
        card.addEventListener('click', () => handlePlaylistClick(Number(id)));
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
// === ЗАГРУЗКА ИЗ GOOGLE ТАБЛИЦЫ И КНОПКА ПОДЕЛИТЬСЯ (ИСПРАВЛЕНО) ===
// =========================================================================

// 1. Загрузка и парсинг таблицы с УМНЫМ распознаванием колонок
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
                
                // Умное определение колонок по ключевым словам (регистр не важен)
                if (colName.includes('playlist') || colName === 'id') colName = 'playlistid';
                else if (colName.includes('insta')) colName = 'instagram';
                else if (colName.includes('yandex') || colName.includes('яндекс')) colName = 'yandex';
                else if (colName.includes('spotify')) colName = 'spotify';
                else if (colName.includes('title') || colName.includes('название') || colName.includes('трек')) colName = 'title';
                else if (colName.includes('artist') || colName.includes('исполнитель')) colName = 'artist';
                else colName = colName.replace(/\s+/g, '_'); // для любых других колонок
                
                obj[colName] = cell && cell.v ? String(cell.v).trim() : "";
            });
            
            if (obj.playlistid) obj.playlistId = parseInt(obj.playlistid);
            return obj;
        });
        
        console.log("✅ Ссылки из Google Таблицы успешно загружены:", artistLinksData.length, "строк");
        
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

    const linkData = artistLinksData.find(item => {
        return item.playlistId === currentPlaylistId && 
            item.title && item.title.trim().toLowerCase() === searchTitle &&
            item.artist && item.artist.trim().toLowerCase() === searchArtist;
    });

    // Если не нашли, возвращаем пустые строки (они будут отфильтрованы в модалке)
    return linkData || { instagram: "", yandex: "", spotify: "", title: "", artist: "" };
}

// 3. Обработчик кнопки "Поделиться"
shareBtn.addEventListener('click', () => {
    if (!currentPlaylistId) {
        showToast('Сначала выбери трек!');
        return;
    }
    
    // ИСПРАВЛЕНИЕ БАГА: Принудительно перерисовываем плейлисты перед открытием модалки,
    // чтобы сбросить любые CSS-артефакты или "залипший" фокус
    renderPlaylists();
    
    const links = getLinksForCurrentTrack();
    
    if (currentPlaylistId === 1) {
        showLinkModal("Перейти к исполнителю", [
            { icon: "📸", text: "Instagram", url: links.instagram },
            { icon: "🎵", text: "Яндекс Музыка", url: links.yandex },
            { icon: "🎧", text: "Spotify", url: links.spotify }
        ]);
    } else {
        const playlist = playlistsData[currentPlaylistId];
        showLinkModal("Слушать плейлист", [
            { icon: "🎧", text: "Открыть в Spotify", url: playlist.spotifyUrl }
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

// 5. Открытие ссылки и закрытие модалки
function openExternalLink(url) {
    if (url && url.trim() !== "") {
        tg.openLink(url); 
    }
    closeShareModal();
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
        // ИСПРАВЛЕНИЕ БАГА: Принудительно перерисовываем плейлисты при закрытии.
        // Это гарантированно убирает визуальный баг с "выбранными" карточками.
        renderPlaylists();
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
    await loadArtistLinks();
    renderPlaylists();
}

initApp();
