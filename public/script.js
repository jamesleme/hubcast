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

    // ---- ANO DO RODAPÉ ----
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ---- VARIÁVEIS E FUNÇÕES GLOBAIS DA API ----
    const CHANNEL_IDS_TO_MONITOR = [
        'UCs-6sCz2LJm1PrWQN4ErsPw', // tnt
        'UCxERJM046RIRgl5cH-ss3yw', // CNN
    ];

    async function fetchFromApi(url) {
        try {
            const cacheBustUrl = `${url}&_=${new Date().getTime()}`;
            const response = await fetch(cacheBustUrl);
            if (!response.ok) return { items: [] };
            return response.json();
        } catch (error) {
            console.error(`Erro ao acessar ${url}`, error);
            return { items: [] };
        }
    }

    // ---- FUNÇÃO GENÉRICA PARA RENDERIZAR UMA SEÇÃO ----
    async function renderSection({ sectionId, listSelector, eventType, limit, skeletonCount, renderFunction }) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const listContainer = section.querySelector(listSelector);
        const titleElement = section.querySelector('h2');
        const buttonElement = section.querySelector('.see-all-btn');

        // 1. APLICAR SKELETONS
        titleElement.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        buttonElement.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;
        listContainer.innerHTML = renderFunction(null).repeat(skeletonCount);

        // 2. BUSCAR DADOS
        const results = await Promise.all(
            CHANNEL_IDS_TO_MONITOR.map(id => fetchFromApi(`/api/youtube?channelId=${id}&eventType=${eventType}`))
        );
        let videos = results.flatMap(r => r.items || []);
        
        if (eventType === 'completed') {
            videos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        }
        if (limit !== null) {
            videos = videos.slice(0, limit);
        }

        // 3. RESTAURAR CABEÇALHO
        titleElement.innerHTML = titleElement.dataset.title;
        buttonElement.innerHTML = `Ver todos <i class="fas fa-arrow-right"></i>`;

        // 4. RENDERIZAR OU ESCONDER
        if (videos.length > 0) {
            const channelIds = videos.map(v => v.snippet.channelId);
            const logoData = await fetchFromApi(`/api/channels?ids=${channelIds.join(',')}`);
            const logoMap = new Map();
            if (logoData.items) {
                logoData.items.forEach(c => logoMap.set(c.id, c.snippet.thumbnails.default.url));
            }
            listContainer.innerHTML = videos.map(video => renderFunction(video, logoMap)).join('');
        } else {
            section.style.display = 'none';
        }
    }

    // ---- FUNÇÕES DE RENDERIZAÇÃO ESPECÍFICAS ----
    const renderLiveCard = (video, logoMap) => {
        if (!video) return `<div class="live-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`;
        const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
        return `<div class="live-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-live-btn"><i class="fas fa-circle"></i> AO VIVO</a></div>`;
    };

    const renderCompletedCard = (video, logoMap) => {
        if (!video) return `<div class="completed-item skeleton-item"><div class="skeleton-logo shimmer-bg"></div><div class="item-info"><div class="skeleton-text shimmer-bg"></div><div class="skeleton-text-short shimmer-bg"></div></div><div class="skeleton-button shimmer-bg"></div></div>`;
        const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
        return `<div class="completed-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn"><i class="fas fa-play"></i> ASSISTIR</a></div>`;
    };

    // ---- INICIALIZAÇÃO ----
    const currentPagePath = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPagePath === 'index.html') {
        renderSection({
            sectionId: 'live-channels-section',
            listSelector: '.live-list',
            eventType: 'live',
            limit: 3,
            skeletonCount: 1,
            renderFunction: renderLiveCard
        });
        renderSection({
            sectionId: 'completed-section',
            listSelector: '.completed-list',
            eventType: 'completed',
            limit: 3,
            skeletonCount: 1,
            renderFunction: renderCompletedCard
        });
    }

    if (currentPagePath === 'lives.html') {
        renderSection({
            sectionId: 'all-live-section', // Assumindo que na lives.html você tem uma section com este ID
            listSelector: '#all-live-list', // E uma lista com este ID
            eventType: 'live',
            limit: null, // Sem limite
            skeletonCount: 3, // Mostrar 3 skeletons enquanto carrega
            renderFunction: renderLiveCard
        });
    }

    if (currentPagePath === 'concluidos.html') {
        renderSection({
            sectionId: 'all-completed-section', // Assumindo que na concluidos.html você tem uma section com este ID
            listSelector: '#all-completed-list', // E uma lista com este ID
            eventType: 'completed',
            limit: 12,
            skeletonCount: 3,
            renderFunction: renderCompletedCard
        });
    }
});