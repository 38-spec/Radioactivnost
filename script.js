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

// Данные плейлистов (теперь здесь только аудио, ссылки уехали в таблицу)
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

// ... (Состояние приложения и DOM элементы оставляем БЕЗ ИЗМЕНЕНИЙ) ...
let currentPlaylistId = null;
let currentTrackIndex = 0;
let isPlaying = false;
let shuffledIndexes = [];

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

// ... (Все функции: createShuffledIndexes, renderPlaylists, handlePlaylistClick, 
// loadTrack, playTrack, pauseTrack, updatePlayPauseIcon, togglePlay, 
// nextTrack, prevTrack, обработчики кнопок, прогресс-бар, formatTime 
// ОСТАВЛЯЕМ БЕЗ ИЗМЕНЕНИЙ) ...


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
    
    // Берем названия и приводим к нижнему регистру, убирая лишние пробелы
    // Это спасет от ошибок, если в таблице случайно поставили пробел в конце
    const searchTitle = track.title.trim().toLowerCase();
    const searchArtist = track.artist.trim().toLowerCase();

    const linkData = artistLinksData.find(item => 
        item.playlistId === currentPlaylistId && 
        item.title && item.title.trim().toLowerCase() === searchTitle &&
        item.artist && item.artist.trim().toLowerCase() === searchArtist
    );

    // Если нашли - возвращаем, если нет - пустые ссылки
    return linkData || { instagram: "", yandex: "", spotify: "" };
}

// 3. Обновленный клик по кнопке "Поделиться"
shareBtn.addEventListener('click', () => {
    if (!currentPlaylistId) {
        showToast('Сначала выбери трек!');
        return;
    }
    
    const links = getLinksForCurrentTrack();
    
    if (currentPlaylistId === 1) { // Логика для Ma Hood / My Broths
        showLinkModal("Перейти к исполнителю", [
            { icon: "📸", text: "Instagram", url: links.instagram },
            { icon: "🎵", text: "Яндекс Музыка", url: links.yandex }
        ]);
    } else { // Логика для остальных плейлистов
        showLinkModal("Слушать плейлист", [
            { icon: "🎧", text: "Открыть в Spotify", url: links.spotify }
        ]);
    }
});

// 4. Универсальное модальное окно (использует ваши старые CSS классы)
function showLinkModal(title, options) {
    closeShareModal(); // Удаляем старое окно, если оно было

    // Фильтруем кнопки: если ссылки нет, кнопку не показываем
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
    await loadArtistLinks(); // Сначала ждем загрузки таблицы
    renderPlaylists();       // Потом рисуем интерфейс
}

initApp();
