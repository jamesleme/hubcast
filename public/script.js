document.addEventListener('DOMContentLoaded', () => {
    // ---- LÓGICA DO TEMA ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('bi-lightbulb-fill');
            themeIcon.classList.add('bi-lightbulb-off-fill');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('bi-lightbulb-off-fill');
            themeIcon.classList.add('bi-lightbulb-fill');
        }
    };

    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        themeIcon.classList.add('bi-lightbulb-fill');
    }

    themeToggle.addEventListener('click', () => {
        let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // ---- LÓGICA DO ANO DO RODAPÉ ----
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ---- LÓGICA DA API (ESTRUTURA INDEPENDENTE) ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;

    const CHANNEL_IDS_TO_MONITOR = [
        'UCs-6sCz2LJm1PrWQN4ErsPw', // TNT
    ];

    // 2. FUNÇÃO DE API GENÉRICA
    async function fetchFromApi(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status} para a URL: ${url}`);
                return { items: [] }; // Retorna vazio para não quebrar a lógica
            }
            return response.json();
        } catch (error) {
            console.error(`Falha de rede ao fazer fetch da URL: ${url}`, error);
            return { items: [] }; // Retorna vazio em caso de falha de rede
        }
    }

    // 3. LÓGICA DA SEÇÃO "AO VIVO"
    async function initializeLiveSection() {
        const section = document.getElementById('live-channels-section');
        const listContainer = section.querySelector('.live-list');
        const titleElement = section.querySelector('h2');
        const buttonElement = section.querySelector('.see-all-btn');

        // Aplica Skeletons
        const originalTitle = titleElement.innerHTML;
        const originalButton = buttonElement.innerHTML;
        titleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        buttonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        listContainer.innerHTML = `<div class="live-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`.repeat(MAX_LIVES_TO_SHOW);

        // Busca Dados
        const promises = CHANNEL_IDS_TO_MONITOR.map(id => fetchFromApi(`/api/youtube?channelId=${id}&eventType=live`));
        const results = await Promise.all(promises);
        const liveVideos = results.flatMap(result => result.items || []).slice(0, MAX_LIVES_TO_SHOW);

        // Renderiza ou Esconde
        if (liveVideos.length > 0) {
            const liveItemsHTML = liveVideos.map(video => {
                return `<div class="live-item"><div class="channel-logo-circle"><img src="${video.snippet.thumbnails.default.url}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-live-btn"><i class="fas fa-circle"></i> AO VIVO</a></div>`;
            }).join('');
            
            listContainer.innerHTML = liveItemsHTML;
            titleElement.innerHTML = originalTitle;
            buttonElement.innerHTML = originalButton;
        } else {
            section.style.display = 'none';
        }
    }

    // 4. LÓGICA DA SEÇÃO "CONCLUÍDOS"
    async function initializeCompletedSection() {
        const section = document.getElementById('completed-section');
        const listContainer = section.querySelector('.completed-list');
        const titleElement = section.querySelector('h2');
        const buttonElement = section.querySelector('.see-all-btn');

        // Aplica Skeletons
        const originalTitle = titleElement.innerHTML;
        const originalButton = buttonElement.innerHTML;
        titleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        buttonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        listContainer.innerHTML = `<div class="completed-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`.repeat(MAX_COMPLETED_TO_SHOW);
        
        // Busca Dados
        const promises = CHANNEL_IDS_TO_MONITOR.map(id => fetchFromApi(`/api/youtube?channelId=${id}&eventType=completed`));
        const results = await Promise.all(promises);
        let allCompletedVideos = results.flatMap(result => result.items || []);
        
        allCompletedVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        const latestCompleted = allCompletedVideos.slice(0, MAX_COMPLETED_TO_SHOW);

        // Renderiza ou Esconde
        if (latestCompleted.length > 0) {
            const completedItemsHTML = latestCompleted.map(video => {
                return `<div class="completed-item"><div class="channel-logo-circle"><img src="${video.snippet.thumbnails.default.url}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn"><i class="fas fa-play"></i>ASSISTIR</a></div>`;
            }).join('');
            
            listContainer.innerHTML = completedItemsHTML;
            titleElement.innerHTML = originalTitle;
            buttonElement.innerHTML = originalButton;
        } else {
            section.style.display = 'none';
        }
    }

    // 5. INICIALIZAÇÃO
    // Chama cada função de forma independente.
    initializeLiveSection();
    initializeCompletedSection();
});