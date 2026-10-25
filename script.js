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
    
    // Останавливаем всплытие на контенте модального окна
    modal.querySelector('.share-modal-content').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    modal.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.getAttribute('data-url');
            if (url) {
                tg.openLink(url);
                closeShareModal();
            }
        });
    });
    
    modal.querySelector('.share-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeShareModal();
    });
    
    // Закрытие по клику на backdrop
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeShareModal();
        }
    });
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// =========================================================================
// === ИНИЦИАЛИЗАЦИЯ ===
// =========================================================================

async function initApp() {
    console.log('🚀 Инициализация приложения...');
    
    try {
        await loadArtistLinks();
        buildPlaylistsFromSheet();
        renderPlaylists();
        
        console.log('✅ Приложение готово!');
    } catch (error) {
        console.error(' Ошибка инициализации:', error);
        showToast('Ошибка загрузки приложения');
    }
}

// Запускаем
initApp();
