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

    // ---- LÓGICA DO SELETOR DE IDIOMA LOCAL ----
    const langSwitchContainer = document.querySelector('.local-lang-switch');
    if (langSwitchContainer) {
        const langButtons = langSwitchContainer.querySelectorAll('[data-lang-btn]');
        const langSections = document.querySelectorAll('[data-lang-section]');
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedLang = button.dataset.langBtn;
                langButtons.forEach(btn => btn.classList.remove('active'));
                langSections.forEach(sec => sec.classList.remove('lang-active'));
                button.classList.add('active');
                document.querySelector(`[data-lang-section="${selectedLang}"]`).classList.add('lang-active');
            });
        });
    }

    // ---- LÓGICA DO ANO DO RODAPÉ ----
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ---- LÓGICA DA API (REESTRUTURADA PARA ISOLAMENTO TOTAL) ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;
    const SKELETONS_TO_SHOW = 1; // <-- NOVA CONSTANTE PARA CONTROLAR OS SKELETONS

    const CHANNEL_IDS_TO_MONITOR = [
        'UCK7bm74oRVnp_PXDfF2S1sA', // mount
    ];

    // 2. FUNÇÃO DE API GENÉRICA
    async function fetchFromApi(url) {
        try {
            const cacheBustUrl = `${url}&_=${new Date().getTime()}`;
            const response = await fetch(cacheBustUrl);
            if (!response.ok) {
                if (response.status === 403) console.error(`Erro 403 (Quota Excedida?) ao acessar ${url}.`);
                return { items: [] };
            }
            return response.json();
        } catch (error) {
            console.error(`Falha ao fazer fetch da URL: ${url}`, error);
            return { items: [] };
        }
    }

    // 3. LÓGICA DA SEÇÃO "AO VIVO" - TOTALMENTE INDEPENDENTE
    async function initializeLiveSection() {
        const section = document.getElementById('live-channels-section');
        if (!section) return;
        const listContainer = section.querySelector('.live-list');
        const titleElement = section.querySelector('h2');
        const buttonElement = section.querySelector('.see-all-btn');

        // Passo 1: Aplicar Skeletons
        const originalTitle = titleElement.innerHTML;
        const originalButton = buttonElement.innerHTML;
        titleElement.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        buttonElement.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;
        // USA A NOVA CONSTANTE PARA OS SKELETONS
        listContainer.innerHTML = `<div class="live-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`.repeat(SKELETONS_TO_SHOW);

        // Passo 2: Buscar Dados
        const promises = CHANNEL_IDS_TO_MONITOR.map(id => fetchFromApi(`/api/youtube?channelId=${id}&eventType=live`));
        const results = await Promise.all(promises);
        const liveVideos = results.flatMap(result => result.items || []).slice(0, MAX_LIVES_TO_SHOW);

        // Passo 3: Restaurar cabeçalho
        titleElement.innerHTML = originalTitle;
        buttonElement.innerHTML = originalButton;

        // Passo 4: Renderizar ou Esconder
        if (liveVideos.length > 0) {
            const channelIdsForLogos = liveVideos.map(video => video.snippet.channelId);
            const logoData = await fetchFromApi(`/api/channels?ids=${channelIdsForLogos.join(',')}`);
            const logoMap = new Map();
            if(logoData.items) {
                logoData.items.forEach(channel => logoMap.set(channel.id, channel.snippet.thumbnails.default.url));
            }

            const liveItemsHTML = liveVideos.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
                return `<div class="live-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-live-btn"><i class="fas fa-circle"></i> AO VIVO</a></div>`;
            }).join('');
            
            listContainer.innerHTML = liveItemsHTML;
        } else {
            section.style.display = 'none';
        }
    }

    // 4. LÓGICA DA SEÇÃO "CONCLUÍDOS" - TOTALMENTE INDEPENDENTE
    async function initializeCompletedSection() {
        const section = document.getElementById('completed-section');
        if (!section) return;
        const listContainer = section.querySelector('.completed-list');
        const titleElement = section.querySelector('h2');
        const buttonElement = section.querySelector('.see-all-btn');

        // Passo 1: Aplicar Skeletons
        const originalTitle = titleElement.innerHTML;
        const originalButton = buttonElement.innerHTML;
        titleElement.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        buttonElement.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;
        // USA A NOVA CONSTANTE PARA OS SKELETONS
        listContainer.innerHTML = `<div class="completed-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`.repeat(SKELETONS_TO_SHOW);
        
        // Passo 2: Buscar Dados
        const promises = CHANNEL_IDS_TO_MONITOR.map(id => fetchFromApi(`/api/youtube?channelId=${id}&eventType=completed`));
        const results = await Promise.all(promises);
        let allCompletedVideos = results.flatMap(result => result.items || []);
        
        allCompletedVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        const latestCompleted = allCompletedVideos.slice(0, MAX_COMPLETED_TO_SHOW);

        // Passo 3: Restaurar cabeçalho
        titleElement.innerHTML = originalTitle;
        buttonElement.innerHTML = originalButton;

        // Passo 4: Renderizar ou Esconder
        if (latestCompleted.length > 0) {
            const channelIdsForLogos = latestCompleted.map(video => video.snippet.channelId);
            const logoData = await fetchFromApi(`/api/channels?ids=${channelIdsForLogos.join(',')}`);
            const logoMap = new Map();
            if(logoData.items) {
                logoData.items.forEach(channel => logoMap.set(channel.id, channel.snippet.thumbnails.default.url));
            }

            const completedItemsHTML = latestCompleted.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
                return `<div class="completed-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn"><i class="fas fa-play"></i>ASSISTIR</a></div>`;
            }).join('');
            
            listContainer.innerHTML = completedItemsHTML;
        } else {
            section.style.display = 'none';
        }
    }

    // 5. INICIALIZAÇÃO
    if (document.getElementById('live-channels-section')) {
        initializeLiveSection();
        initializeCompletedSection();
    }
});