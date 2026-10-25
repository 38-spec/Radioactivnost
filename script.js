// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// ССЫЛКА НА ВАШУ GOOGLE ТАБЛИЦУ
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv';

// Состояние
let playlists = [];
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

// Парсинг CSV (улучшенный)
function parseCSV(text) {
    console.log('Получен CSV:', text.substring(0, 200));
    
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    console.log('Строк в CSV:', lines.length);
    
    if (lines.length < 2) {
        throw new Error('CSV пуст или имеет неверный формат');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('Заголовки:', headers);
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Разбиваем с учётом кавычек
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        if (values.length < headers.length) continue;
        
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        data.push(obj);
    }
    
    console.log('Распаршенные данные:', data);
    return data;
}

// Преобразование данных таблицы в плейлисты
function buildPlaylists(data) {
    const playlistMap = {};
    
    data.forEach((row, index) => {
        const playlistId = row.playlistId || row.playlistid;
        const artist = row.artist || '';
        const title = row.title || '';
        const src = row.src || '';
        
        console.log(`Строка ${index}:`, { playlistId, artist, title, src: src ? 'есть' : 'нет' });
        
        if (!playlistId || !artist || !title) {
            console.log('Пропущена строка - нет обязательных полей');
            return;
        }
        
        if (!playlistMap[playlistId]) {
            const playlistInfo = getPlaylistInfo(playlistId);
            playlistMap[playlistId] = {
                id: playlistId,
                title: playlistInfo.title,
                emoji: playlistInfo.emoji,
                color: playlistInfo.color,
                tracks: []
            };
        }
        
        if (src) {
            playlistMap[playlistId].tracks.push({
                title: title,
                artist: artist,
                src: src
            });
        }
    });
    
    console.log('Итоговые плейлисты:', playlistMap);
    return Object.values(playlistMap);
}

// Информация о плейлистах
function getPlaylistInfo(id) {
    const playlists = {
        '1': { title: 'Ma Hood', emoji: '☀️', color: 'linear-gradient(135deg, #f6d365, #fda085)' },
        '2': { title: 'Старый звук', emoji: '🎧', color: 'linear-gradient(135deg, #141e30, #243b55)' },
        '3': { title: 'Late Night', emoji: '🌙', color: 'linear-gradient(135deg, #141e30, #243b55)' },
        '4': { title: 'Chill Zone', emoji: '🍃', color: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
        '5': { title: 'Beats', emoji: '🔥', color: 'linear-gradient(135deg, #f093fb, #f5576c)' }
    };
    
    return playlists[id] || { 
        title: `Playlist ${id}`, 
        emoji: '🎵', 
        color: 'linear-gradient(135deg, #667eea, #764ba2)' 
    };
}

// Загрузка данных из Google Sheets
async function loadPlaylistsFromSheet() {
    try {
        container.innerHTML = '<p style="text-align: center; color: var(--hint-color);">Загрузка...</p>';
        
        console.log('Загрузка с URL:', SHEET_URL);
        
        const response = await fetch(SHEET_URL);
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        playlists = buildPlaylists(data);
        
        console.log('Загружено плейлистов:', playlists.length);
        renderPlaylists();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                <p style="margin-bottom: 10px;">❌ Ошибка загрузки</p>
                <p style="font-size: 12px; color: var(--hint-color);">${error.message}</p>
                <p style="font-size: 11px; margin-top: 10px;">Проверьте:</p>
                <ul style="font-size: 11px; text-align: left; display: inline-block; margin-top: 5px;">
                    <li>Таблица опубликована (Файл → Поделиться → Опубликовать)</li>
                    <li>URL правильный (output=csv)</li>
                    <li>Есть доступ по ссылке</li>
                </ul>
            </div>
        `;
    }
}

// Рендер плейлистов
function renderPlaylists() {
    container.innerHTML = '';
    
    if (playlists.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--hint-color);">Нет плейлистов</p>';
        return;
    }
    
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
    document.querySelectorAll('.playlist-card').forEach(c => c.classList.remove('active'));
    if (cardElement) cardElement.classList.add('active');

    currentPlaylist = playlist;
    currentTrackIndex = 0;
    
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
    
    trackCover.style.background = currentPlaylist.color;
    
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
    if (!currentPlaylist && playlists.length > 0) {
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

// Логика прогресс-бара
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

// Загрузка при старте
loadPlaylistsFromSheet();
