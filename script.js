body {
    background-color: var(--bg-color);
    color: var(--text-color);
    min-height: 100vh;
    padding: 20px 16px;
    padding-bottom: 320px;
    padding-top: 140px; /* Увеличенный отступ сверху */
}

header {
    text-align: center;
    margin-bottom: 20px;
    position: fixed; /* Фиксируем header */
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 500px;
    background-color: var(--bg-color);
    z-index: 50;
    padding: 20px 16px 10px;
    border-bottom: 1px solid var(--secondary-bg);
}

/* === СКРОЛЛЯЩИЕСЯ ПЛЕЙЛИСТЫ === */
.playlists-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 20px;
    max-height: calc(100vh - 400px);
    overflow-y: auto;
    padding-right: 4px;
    scroll-padding-top: 140px; /* Отступ при скролле */
    scroll-behavior: smooth;
}

/* Добавляем отступ для первой карточки */
.playlists-grid .playlist-card:first-child {
    margin-top: 10px;
}

/* Уведомление о копировании */
.toast {
    position: fixed;
    bottom: 340px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--button-color);
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    z-index: 1001;
    animation: toastIn 0.3s ease, toastOut 0.3s ease 2s forwards;
}
