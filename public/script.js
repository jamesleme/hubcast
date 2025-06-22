document.addEventListener('DOMContentLoaded', () => {
    // ---- LOGICA DO TEMA ----
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

    // ---- LOGICA DA API COM SKELETONS ABRANGENTES ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 1;
    const MAX_COMPLETED_TO_SHOW = 1;

    const CHANNEL_IDS_TO_MONITOR = [
        'UC4_bL9_p3s01K_T1aG8m1dA', // Podpah
        'UCp2tjaqW3S3pP_2J3qS_zaA', // Venus Podcast
        'UCoB84QGiiwV3c01m_G34S7A', // Ticaracaticast
        'UC4K-979s9ltJPROmH-eYkiA', // Flow Podcast
        'UCk107Q3h57M3G1_d2Q3E1DQ', // Flow Sports CLub
        'UC6nODa90W_lAYHjMOp-U9wA'  // Caze TV
    ];

    // 2. SELETORES DO DOM
    const liveSection = document.getElementById('live-channels-section');
    const liveListContainer = liveSection.querySelector('.live-list');
    const liveTitleElement = liveSection.querySelector('h2');
    const liveButtonElement = liveSection.querySelector('.see-all-btn');

    const completedSection = document.getElementById('completed-section');
    const completedListContainer = completedSection.querySelector('.completed-list');
    const completedTitleElement = completedSection.querySelector('h2');
    const completedButtonElement = completedSection.querySelector('.see-all-btn');

    // Variaveis para guardar o conteúdo original
    let originalTexts = {};
    
    // 3. FUNCOES DE API
    async function fetchYouTubeVideos(channelIds, eventType, maxResults) {
        const promises = channelIds.map(channelId => {
            const apiUrl = `/api/youtube?channelId=${channelId}&eventType=${eventType}`;
            return fetch(apiUrl).then(res => res.json()).catch(err => { console.error(err); return { items: [] }; });
        });
        try {
            const results = await Promise.all(promises);
            const allVideos = results.flatMap(result => result.items || []);
            allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
            return allVideos.slice(0, maxResults);
        } catch (error) { return []; }
    }

    async function fetchChannelLogos(channelIds) {
        if (channelIds.length === 0) return new Map();
        const apiUrl = `/api/channels?ids=${channelIds.join(',')}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
            const data = await response.json();
            const logoMap = new Map();
            if (data.items) {
                data.items.forEach(channel => logoMap.set(channel.id, channel.snippet.thumbnails.default.url));
            }
            return logoMap;
        } catch (error) { console.error(error); return new Map(); }
    }

    // 4. FUNCOES DE SKELETON E RENDERIZAÇÃO

    /** Gera o HTML para os skeletons dos cards, sempre com a cor neutra. */
    function generateCardSkeletonsHTML(count) {
        let skeletonsHTML = '';
        // ForCa o uso de 'completed-item' para que ambos os skeletons tenham a cor de fundo neutra
        const itemClass = 'completed-item'; 
        for (let i = 0; i < count; i++) {
            skeletonsHTML += `
                <div class="${itemClass}">
                    <div class="skeleton skeleton-circle"></div>
                    <div class="skeleton-info">
                        <div class="skeleton skeleton-line title"></div>
                        <div class="skeleton skeleton-line channel"></div>
                    </div>
                    <div class="skeleton skeleton-button"></div>
                </div>`;
        }
        return skeletonsHTML;
    }

    /** Aplica o estado de carregamento (skeletons) na pagina. */
    function applySkeletons() {
        // Guarda os textos originais
        originalTexts.liveTitle = liveTitleElement.innerHTML;
        originalTexts.liveButton = liveButtonElement.innerHTML;
        originalTexts.completedTitle = completedTitleElement.innerHTML;
        originalTexts.completedButton = completedButtonElement.innerHTML;

        // Aplica os skeletons nos cabecalhos
        liveTitleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        liveButtonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        completedTitleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        completedButtonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        
        // Aplica os skeletons nos cards
        liveListContainer.innerHTML = generateCardSkeletonsHTML(MAX_LIVES_TO_SHOW);
        completedListContainer.innerHTML = generateCardSkeletonsHTML(MAX_COMPLETED_TO_SHOW);
    }
    
    /** Restaura os cabecalhos e renderiza o conteudo final. */
    function renderFinalContent(liveVideos, completedVideos, logoMap) {
        // Restaura os textos dos cabeçalhos
        liveTitleElement.innerHTML = originalTexts.liveTitle;
        liveButtonElement.innerHTML = originalTexts.liveButton;
        completedTitleElement.innerHTML = originalTexts.completedTitle;
        completedButtonElement.innerHTML = originalTexts.completedButton;

        // Renderiza a secao AO VIVO
        if (liveVideos && liveVideos.length > 0) {
            liveSection.style.display = 'block';
            const liveItemsHTML = liveVideos.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || video.snippet.thumbnails.default.url;
                return `<div class="live-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-live-btn"><i class="fas fa-circle"></i> AO VIVO</a></div>`;
            }).join('');
            liveListContainer.innerHTML = liveItemsHTML;
        } else {
            liveSection.style.display = 'none';
        }

        // Renderiza a secao CONCLUIDOS
        if (completedVideos && completedVideos.length > 0) {
            completedSection.style.display = 'block';
            const completedItemsHTML = completedVideos.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || video.snippet.thumbnails.default.url;
                return `<div class="completed-item"><div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div><div class="item-info"><h3>${video.snippet.title}</h3><p class="channel-name">${video.snippet.channelTitle}</p></div><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn"><i class="fas fa-play"></i>ASSISTIR</a></div>`;
            }).join('');
            completedListContainer.innerHTML = completedItemsHTML;
        } else {
            completedSection.style.display = 'none';
        }
    }

    // 5. INICIALIZACAO (LOGICA PRINCIPAL)
    async function initializePage() {
        // Passo 1: Aplicar todos os skeletons
        applySkeletons();

        // Passo 2: Buscar os videos
        const [liveVideos, completedVideos] = await Promise.all([
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'live', MAX_LIVES_TO_SHOW),
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'completed', MAX_COMPLETED_TO_SHOW)
        ]);

        // Passo 3: Buscar os logos
        const allVideos = [...liveVideos, ...completedVideos];
        const uniqueChannelIds = [...new Set(allVideos.map(video => video.snippet.channelId))];
        const logoMap = await fetchChannelLogos(uniqueChannelIds);
        
        // Passo 4: Renderizar o conteudo final, substituindo os skeletons
        renderFinalContent(liveVideos, completedVideos, logoMap);
    }

    initializePage();
});