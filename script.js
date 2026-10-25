// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Базовый URL Cloudflare R2
const R2_BASE_URL = "https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev";

// === SHEET_ID ===
const SHEET_ID = "1dyard1Bb_7Vwmi_cVj2rEqcDNMzM9LPngohSoXH7JTQ"; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Глобальные переменные
let artistLinksData = [];
let isShareModalOpen = false;

let playlistsData = {
    1: { name: "Ma Hood", spotifyUrl: "", tracks: [] },
    2: { name: "Старая Школа", spotifyUrl: "https://open.spotify.com/playlist/4i0gEbdeQ0je5ANjmQCuGA", tracks: [] },
    3: { name: "Новая Школа", spotifyUrl: "https://open.spotify.com/playlist/3XOU9kzckIsCcY02opnNf4", tracks: [] },
    4: { name: "Chill Zone", spotifyUrl: "", tracks: [] },
    5: { name: "Beats", spotifyUrl: "", tracks: [] }
};

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
const playerWrapper = document.getElementById('player-wrapper');

// === УРОВЕНЬ 1: Глобальный перехватчик в capture phase ===
// Он срабатывает ДО всех остальных обработчиков и блокирует клики по плейлистам
document.addEventListener('click', (e) => {
    if (isShareModalOpen) {
        // Если клик по плейлисту — блокируем
        if (e.target.closest('.playlist-card')) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }
}, true); // true = capture phase

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function createShuffledIndexes(length) {
    const indexes = Array.from({ length }, (_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// === УРОВЕНЬ 2: Установка флага на body для CSS-блокировки ===
function setModalState(open) {
    isShareModalOpen = open;
    if (open) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
}// === ОТРИСОВКА ПЛЕЙЛИСТОВ (НОВАЯ ЛОГИКА) ===
function renderPlaylists() {
    if (!playlistsGrid) return;
    
    playlistsGrid.innerHTML = '';
    
    Object.keys(playlistsData).forEach(id => {
        const playlist = playlistsData[id];
        const isActive = Number(id) === Number(currentPlaylistId);
        const trackCount = playlist.tracks.length;
        
        const card = document.createElement('div');
        card.className = 'playlist-card' + (isActive ? ' active' : '');
        card.dataset.id = id;
        
        const iconHtml = isActive && isPlaying 
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
        
        card.innerHTML = `
            <div class="playlist-card-content">
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-tracks-count">${trackCount} треков</div>
                </div>
                <div class="playlist-play-icon">${iconHtml}</div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (isShareModalOpen) {
                e.stopImmediatePropagation();
                e.preventDefault();
                return;
            }
            handlePlaylistClick(Number(id));
        });
        
        playlistsGrid.appendChild(card);
    });
}

// === ОБНОВЛЕНИЕ АКТИВНОГО ПЛЕЙЛИСТА (БЕЗ ПОЛНОЙ ПЕРЕРИСОВКИ) ===
function setActivePlaylist(playlistId) {
    if (!playlistsGrid) return;
    
    // Снимаем active со ВСЕХ карточек
    const allCards = playlistsGrid.querySelectorAll('.playlist-card');
    allCards.forEach(card => {
        card.classList.remove('active');
        
        // Обновляем иконку на play
        const iconElement = card.querySelector('.playlist-play-icon');
        if (iconElement) {
            iconElement.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
        }
    });
    
    // Добавляем active только на нужный плейлист
    const activeCard = playlistsGrid.querySelector(`[data-id="${playlistId}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
        
        // Обновляем иконку
        const iconElement = activeCard.querySelector('.playlist-play-icon');
        if (iconElement) {
            iconElement.innerHTML = isPlaying
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
        }
    }
}

// === ЛОГИКА ВОСПРОИЗВЕДЕНИЯ ===
function handlePlaylistClick(playlistId) {
    if (isShareModalOpen) return;
    
    const playlist = playlistsData[playlistId];
    if (!playlist || playlist.tracks.length === 0) {
        showToast('Нет треков');
        return;
    }

    if (currentPlaylistId === playlistId) {
        togglePlay();
        return;
    }
    
    currentPlaylistId = playlistId;
    shuffledIndexes = createShuffledIndexes(playlist.tracks.length);
    currentTrackIndex = 0;
    
    // Сначала обновляем UI
    setActivePlaylist(playlistId);
    loadTrack();
    playTrack();
}

function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        // Обновляем только иконку активного плейлиста
        updateActivePlaylistIcon();
    }).catch(e => console.error('Play error:', e));
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updateActivePlaylistIcon();
}

function updateActivePlaylistIcon() {
    if (!playlistsGrid || !currentPlaylistId) return;
    
    const activeCard = playlistsGrid.querySelector('.playlist-card.active');
    if (activeCard) {
        const iconElement = activeCard.querySelector('.playlist-play-icon');
        if (iconElement) {
            iconElement.innerHTML = isPlaying
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
        }
    }
}


function togglePlay() {
    if (isPlaying) pauseTrack();
    else playTrack();
}

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

// === ОБРАБОТЧИКИ СОБЫТИЙ ===
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevTrack);

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', nextTrack);

progressBar.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
});

// === GOOGLE SHEETS ===
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
                
                if (colName.includes('playlist') || colName === 'id') colName = 'playlistid';
                else if (colName.includes('src') || colName.includes('audio') || colName.includes('mp3')) colName = 'src';
                else if (colName.includes('title')) colName = 'title';
                else if (colName.includes('artist')) colName = 'artist';
                else colName = colName.replace(/\s+/g, '_');
                
                obj[colName] = cell && cell.v ? String(cell.v).trim() : "";
            });
            
            if (obj.playlistid) obj.playlistId = parseInt(obj.playlistid);
            return obj;
        });
    } catch (error) {
        console.error("Sheet load error:", error);
    }
}

function buildPlaylistsFromSheet() {
    artistLinksData.forEach(row => {
        const pId = row.playlistId;
        
        if (playlistsData[pId] && row.title && row.artist && row.src) {
            let finalSrc = row.src;
            if (!finalSrc.startsWith('http')) {
                finalSrc = `${R2_BASE_URL}${finalSrc.startsWith('/') ? '' : '/'}${finalSrc}`;
            }
            
            playlistsData[pId].tracks.push({
                title: row.title,
                artist: row.artist,
                src: finalSrc
            });
        }
    });
}

function getLinksForCurrentTrack() {
    const playlist = playlistsData[currentPlaylistId];
    if (!playlist || !playlist.tracks[shuffledIndexes[currentTrackIndex]]) {
        return {};
    }
    
    const track = playlist.tracks[shuffledIndexes[currentTrackIndex]];
    const searchTitle = track.title.trim().toLowerCase();
    const searchArtist = track.artist.trim().toLowerCase();

    return artistLinksData.find(item => {
        return item.playlistId === currentPlaylistId && 
            item.title && item.title.trim().toLowerCase() === searchTitle &&
            item.artist && item.artist.trim().toLowerCase() === searchArtist;
    }) || {};
}

// === КНОПКА ПОДЕЛИТЬСЯ ===
shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentPlaylistId) {
        showToast('Выберите трек!');
        return;
    }
    
    const links = getLinksForCurrentTrack();
    
    if (currentPlaylistId === 1) {
        showLinkModal("Исполнитель", [
            { icon: "", text: "Instagram", url: links.instagram },
            { icon: "", text: "Яндекс Музыка", url: links.yandex },
            { icon: "🎧", text: "Spotify", url: links.spotify },
            { icon: "▶️", text: "YouTube", url: links.youtube }
        ]);
    } else {
        const playlist = playlistsData[currentPlaylistId];
        showLinkModal("Плейлист", [
            { icon: "🎧", text: "Spotify", url: playlist.spotifyUrl }
        ]);
    }
});

// === МОДАЛЬНОЕ ОКНО ===
function showLinkModal(title, options) {
    closeShareModal();
    
    const validOptions = options.filter(opt => opt.url && opt.url.trim() !== "");

    if (validOptions.length === 0) {
        showToast('Нет ссылок');
        return;
    }

    // Устанавливаем флаг ДО создания модалки
    setModalState(true);

    const modal = document.createElement('div');
    modal.className = 'share-modal'; 
    
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-title">${title}</div>
            <div class="share-options">
                ${validOptions.map(opt => `
                    <button class="share-option" data-url="${opt.url}">
                        <span class="share-option-icon">${opt.icon}</span>
                        <span>${opt.text}</span>
                    </button>
                `).join('')}
            </div>
            <button class="share-close">Закрыть</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.share-modal-content').addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
    });
    
    modal.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const url = this.getAttribute('data-url');
            if (url) {
                tg.openLink(url);
                closeShareModal();
            }
        });
    });
    
    modal.querySelector('.share-close').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        closeShareModal();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            e.preventDefault();
            closeShareModal();
        }
    });
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
    // Снимаем флаг с задержкой — защита от "фантомного" клика при отпускании пальца
    setTimeout(() => {
        setModalState(false);
    }, 400);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// === ИНИЦИАЛИЗАЦИЯ ===
async function initApp() {
    try {
        await loadArtistLinks();
        buildPlaylistsFromSheet();
        renderPlaylists();
        console.log('✅ App ready, playlists:', Object.keys(playlistsData).length);
    } catch (error) {
        console.error('Init error:', error);
        showToast('Ошибка загрузки');
    }
}

initApp();
