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

    // ---- ANO DO RODAPÉ ----
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ---- VARIÁVEIS ----
    const CHANNEL_IDS_TO_MONITOR = [
        'UC4_bL9_p3s01K_T1aG8m1dA', // Podpah
        'UCp2tjaqW3S3pP_2J3qS_zaA', // Venus Podcast
        'UCoB84QGiiwV3c01m_G34S7A', // Ticaracaticast
        'UC4K-979s9ltJPROmH-eYkiA', // Flow Podcast
        'UC5-aueB1RqpUc-EeAjtx9Lw', // Flow Sport CLub
        'UC9djCiv4e85Kd8G--GWlcoQ', // Ciencia Sem Fim
        'UCWZoPPW7u2I4gZfhJBZ6NqQ', // Inteligência Ltda
    ];

    // ---- API UNIVERSAL ----
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

    // ---- RENDER LIVES ----
    async function renderLiveVideos(containerSelector, limit = null) {
        const listContainer = document.querySelector(containerSelector);
        const section = listContainer.closest('section');
        const header = section?.querySelector('.section-header');
        const title = header?.querySelector('h2');
        const button = header?.querySelector('.see-all-btn');

        const originalTitle = title?.innerHTML;
        const originalButton = button?.innerHTML;

        // Skeleton no título e botão
        if (title) title.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        if (button) button.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;

        // Skeleton no conteúdo
        listContainer.innerHTML = `<div class="live-item skeleton-item">
            <div class="skeleton-logo shimmer-bg"></div>
            <div class="item-info">
                <div class="skeleton-text shimmer-bg"></div>
                <div class="skeleton-text-short shimmer-bg"></div>
            </div>
            <div class="skeleton-button shimmer-bg"></div>
        </div>`.repeat(limit || 3);

        // Buscar dados
        const results = await Promise.all(CHANNEL_IDS_TO_MONITOR.map(id =>
            fetchFromApi(`/api/youtube?channelId=${id}&eventType=live`)
        ));
        let liveVideos = results.flatMap(result => result.items || []);
        if (limit !== null) liveVideos = liveVideos.slice(0, limit);

        if (liveVideos.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (title) title.innerHTML = originalTitle;
        if (button) button.innerHTML = originalButton;

        // Buscar logos
        const channelIds = liveVideos.map(v => v.snippet.channelId);
        const logoData = await fetchFromApi(`/api/channels?ids=${channelIds.join(',')}`);
        const logoMap = new Map();
        if (logoData.items) {
            logoData.items.forEach(channel =>
                logoMap.set(channel.id, channel.snippet.thumbnails.default.url)
            );
        }

        // Renderizar
        listContainer.innerHTML = liveVideos.map(video => {
            const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
            return `<div class="live-item">
                <div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div>
                <div class="item-info">
                    <h3>${video.snippet.title}</h3>
                    <p class="channel-name">${video.snippet.channelTitle}</p>
                </div>
                <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-live-btn">
                    <i class="fas fa-circle"></i> AO VIVO
                </a>
            </div>`;
        }).join('');
    }

    // ---- RENDER CONCLUÍDOS ----
    async function renderCompletedVideos(containerSelector, limit = null) {
        const listContainer = document.querySelector(containerSelector);
        const section = listContainer.closest('section');
        const header = section?.querySelector('.section-header');
        const title = header?.querySelector('h2');
        const button = header?.querySelector('.see-all-btn');

        const originalTitle = title?.innerHTML;
        const originalButton = button?.innerHTML;

        if (title) title.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        if (button) button.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;

        // Skeleton loader
        listContainer.innerHTML = `<div class="completed-item skeleton-item">
            <div class="skeleton-logo shimmer-bg"></div>
            <div class="item-info">
                <div class="skeleton-text shimmer-bg"></div>
                <div class="skeleton-text-short shimmer-bg"></div>
            </div>
            <div class="skeleton-button shimmer-bg"></div>
        </div>`.repeat(limit || 3);

        // Buscar dados
        const results = await Promise.all(CHANNEL_IDS_TO_MONITOR.map(id =>
            fetchFromApi(`/api/youtube?channelId=${id}&eventType=completed`)
        ));
        let videos = results.flatMap(r => r.items || []);
        videos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        if (limit !== null) videos = videos.slice(0, limit);

        if (videos.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        if (title) title.innerHTML = originalTitle;
        if (button) button.innerHTML = originalButton;

        // Buscar logos
        const channelIds = videos.map(v => v.snippet.channelId);
        const logoData = await fetchFromApi(`/api/channels?ids=${channelIds.join(',')}`);
        const logoMap = new Map();
        if (logoData.items) {
            logoData.items.forEach(channel =>
                logoMap.set(channel.id, channel.snippet.thumbnails.default.url)
            );
        }

        // Renderizar
        listContainer.innerHTML = videos.map(video => {
            const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
            return `<div class="completed-item">
                <div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div>
                <div class="item-info">
                    <h3>${video.snippet.title}</h3>
                    <p class="channel-name">${video.snippet.channelTitle}</p>
                </div>
                <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn">
                    <i class="fas fa-play"></i> ASSISTIR
                </a>
            </div>`;
        }).join('');
    }

    // ---- HOME: mostrar apenas 3
    if (document.getElementById('live-channels-section')) {
        renderLiveVideos('#live-channels-section .live-list', 3);
        renderCompletedVideos('#completed-section .completed-list', 3);
    }

    // ---- LIVES.HTML (sem limite)
    if (document.getElementById('all-live-list')) {
        renderLiveVideos('#all-live-list');
    }

    // ---- CONCLUIDOS.HTML (limite 12)
    if (document.getElementById('all-completed-list')) {
        renderCompletedVideos('#all-completed-list', 6);
    }
});
