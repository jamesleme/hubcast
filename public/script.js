// --- START OF FILE script.js ---

// OUVINTE DE EVENTO: Espera o sinal do 'global-components.js' para começar a rodar.
// Isso garante que o header e o footer já existem na página.
document.addEventListener('componentsLoaded', () => {

    console.log("Evento 'componentsLoaded' recebido. Inicializando script principal...");

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
        // Garante que o ícone inicial esteja correto se não houver tema salvo
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.add('bi-lightbulb-off-fill');
        } else {
            themeIcon.classList.add('bi-lightbulb-fill');
        }
    }

    // A verificação 'if (themeToggle)' garante que o script não quebre em páginas sem o botão.
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }


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

    // ---- LÓGICA DA API ----

    const CHANNEL_IDS_TO_MONITOR = [
        'UCj9R9rOhl81fhnKxBpwJ-yw', // Podpah
        'UCTBhsXf_XRxk8w4rMj6WBOA', // Venus Podcast
        'UC9LH3xFOJCCp2VFRcZjNdRQ', // Ticaracaticast
        'UC4ncvgh5hFr5O83MH7-jRJg', // Flow Podcast
        'UC5-aueB1RqpUc-EeAjtx9Lw', // Flow Sport CLub
        'UC9djCiv4e85Kd8G--GWlcoQ', // Ciencia Sem Fim
        'UCWZoPPW7u2I4gZfhJBZ6NqQ', // Inteligência Ltda
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

    async function renderLiveVideos(containerSelector, limit = null) {
        const listContainer = document.querySelector(containerSelector);
        if (!listContainer) return;
        const section = listContainer.closest('section');
        const header = section?.querySelector('.section-header');
        const title = header?.querySelector('h2');
        const button = header?.querySelector('.see-all-btn');

        const originalTitle = title?.dataset.title || title?.innerText;
        const originalButton = button?.innerHTML;

        if (title) title.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        if (button) button.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;

        listContainer.innerHTML = `<div class="live-item skeleton-item">...</div>`.repeat(limit || 1);

        const results = await Promise.all(CHANNEL_IDS_TO_MONITOR.map(id =>
            fetchFromApi(`/api/youtube?channelId=${id}&eventType=live`)
        ));
        let liveVideos = results.flatMap(result => result.items || []);
        if (limit !== null) liveVideos = liveVideos.slice(0, limit);

        if (title) title.innerHTML = originalTitle;
        if (button) button.innerHTML = originalButton;

        if (liveVideos.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        const channelIds = liveVideos.map(v => v.snippet.channelId);
        const logoData = await fetchFromApi(`/api/channels?ids=${channelIds.join(',')}`);
        const logoMap = new Map();
        if (logoData.items) {
            logoData.items.forEach(channel =>
                logoMap.set(channel.id, channel.snippet.thumbnails.default.url)
            );
        }

        listContainer.innerHTML = liveVideos.map(video => {
            const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
            return `<div class="live-item">...</div>`; // Seu HTML aqui
        }).join('');
    }

    async function renderCompletedVideos(containerSelector, limit = null) {
        const listContainer = document.querySelector(containerSelector);
        if (!listContainer) return;
        const section = listContainer.closest('section');
        const header = section?.querySelector('.section-header');
        const title = header?.querySelector('h2');
        const button = header?.querySelector('.see-all-btn');

        const originalTitle = title?.dataset.title || title?.innerText;
        const originalButton = button?.innerHTML;

        if (title) title.innerHTML = `<span class="skeleton-title shimmer-bg"></span>`;
        if (button) button.innerHTML = `<span class="skeleton-button-small shimmer-bg"></span>`;

        listContainer.innerHTML = `<div class="completed-item skeleton-item">...</div>`.repeat(limit || 1);

        const results = await Promise.all(CHANNEL_IDS_TO_MONITOR.map(id =>
            fetchFromApi(`/api/youtube?channelId=${id}&eventType=completed`)
        ));
        let videos = results.flatMap(r => r.items || []);
        videos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        if (limit !== null) videos = videos.slice(0, limit);

        if (title) title.innerHTML = originalTitle;
        if (button) button.innerHTML = originalButton;

        if (videos.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }

        const channelIds = videos.map(v => v.snippet.channelId);
        const logoData = await fetchFromApi(`/api/channels?ids=${channelIds.join(',')}`);
        const logoMap = new Map();
        if (logoData.items) {
            logoData.items.forEach(channel =>
                logoMap.set(channel.id, channel.snippet.thumbnails.default.url)
            );
        }

        listContainer.innerHTML = videos.map(video => {
            const logoUrl = logoMap.get(video.snippet.channelId) || 'img/placeholder.png';
            return `<div class="completed-item">...</div>`; // Seu HTML aqui
        }).join('');
    }

    // ---- INICIALIZAÇÃO ----
    if (document.getElementById('live-channels-section')) {
        renderLiveVideos('#live-channels-section .live-list', 3);
        renderCompletedVideos('#completed-section .completed-list', 3);
    }
    if (document.getElementById('all-live-list')) {
        renderLiveVideos('#all-live-list');
    }
    if (document.getElementById('all-completed-list')) {
        renderCompletedVideos('#all-completed-list', 6);
    }
});