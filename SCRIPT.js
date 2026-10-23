// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Настройка темы
document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
document.body.style.color = tg.themeParams.text_color || '#000000';

// Данные плейлистов (замените URL на ваши файлы)
const playlists = {
    playlist1: [
        { name: 'Autlo - XXX', url: 'https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev/MaBroths/autlo_hpp.mp3' },
        { name: 'Шаныч - Come and find me', url: 'https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev/OldSchool/SiR%20-%20Hair%20Down.mp3' }
    ],
    playlist2: [
        { name: 'Truffel the Phunky Phaqir - Bionic Muscle', url: 'https://pub-7c17c9badb4645aea8c6a386c544cca3.r2.dev/OldSchool/Truffel%20the%20Phunky%20Phaqir%20-%20Bionic%20Muscle.mp3' },
        { name: 'SiR - Hair Down', url: 'https://example.com/track5.mp3' }
    ]
};

// Состояние плеера
let currentPlaylist = null;
let currentTrackIndex = 0;
let isPlaying = false;

// Создаем аудио элемент
const audio = new Audio();
audio.preload = 'auto';

// Элементы DOM
const playlist1El = document.getElementById('playlist1');
const playlist2El = document.getElementById('playlist2');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentTrackName = document.getElementById('currentTrackName');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// Функция для отображения плейлиста
function renderPlaylist(playlistData, containerId, playlistName) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    playlistData.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.name;
        li.dataset.playlist = playlistName;
        li.dataset.index = index;
        
        li.addEventListener('click', () => {
            playTrack(playlistName, index);
        });
        
        container.appendChild(li);
    });
}

// Функция воспроизведения трека
function playTrack(playlistName, index) {
    currentPlaylist = playlistName;
    currentTrackIndex = index;
    
    const track = playlists[playlistName][index];
    audio.src = track.url;
    audio.play();
    isPlaying = true;
    
    currentTrackName.textContent = track.name;
    playPauseBtn.textContent = '⏸️';
    
    // Обновляем активный трек в UI
    updateActiveTrack();
    
    // Отправляем событие в Telegram
    tg.HapticFeedback.impactOccurred('light');
}

// Обновление активного трека в UI
function updateActiveTrack() {
    document.querySelectorAll('.playlist li').forEach(li => {
        li.classList.remove('active');
    });
    
    const activeLi = document.querySelector(
        `li[data-playlist="${currentPlaylist}"][data-index="${currentTrackIndex}"]`
    );
    if (activeLi) {
        activeLi.classList.add('active');
    }
}

// Play/Pause
playPauseBtn.addEventListener('click', () => {
    if (!audio.src) {
        // Если трек не выбран, запускаем первый трек из первого плейлиста
        playTrack('playlist1', 0);
        return;
    }
    
    if (isPlaying) {
        audio.pause();
        playPauseBtn.textContent = '▶️';
        isPlaying = false;
    } else {
        audio.play();
        playPauseBtn.textContent = '⏸️';
        isPlaying = true;
    }
    
    tg.HapticFeedback.impactOccurred('light');
});

// Previous track
prevBtn.addEventListener('click', () => {
    if (!currentPlaylist) return;
    
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = playlists[currentPlaylist].length - 1;
    }
    
    playTrack(currentPlaylist, currentTrackIndex);
    tg.HapticFeedback.impactOccurred('light');
});

// Next track
nextBtn.addEventListener('click', () => {
    if (!currentPlaylist) return;
    
    currentTrackIndex++;
    if (currentTrackIndex >= playlists[currentPlaylist].length) {
        currentTrackIndex = 0;
    }
    
    playTrack(currentPlaylist, currentTrackIndex);
    tg.HapticFeedback.impactOccurred('light');
});

// Обновление прогресса
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
});

// Установка длительности
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

// Перемотка
progressBar.addEventListener('input', (e) => {
    if (audio.duration) {
        const seekTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    }
});

// Автопереход на следующий трек
audio.addEventListener('ended', () => {
    nextBtn.click();
});

// Форматирование времени
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Обработка фонового воспроизведения
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying) {
        // Пытаемся продолжить воспроизведение в фоне
        audio.play().catch(err => {
            console.log('Фоновое воспроизведение заблокировано:', err);
        });
    }
});

// Инициализация плейлистов
renderPlaylist(playlists.playlist1, 'playlist1', 'playlist1');
renderPlaylist(playlists.playlist2, 'playlist2', 'playlist2');

// Уведомляем Telegram, что WebApp готов
tg.ready();

