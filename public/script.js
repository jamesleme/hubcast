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

    // ---- LÓGICA DA API COM SKELETONS ABRANGENTES (VERSÃO REVISADA) ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 1;
    const MAX_COMPLETED_TO_SHOW = 1;

    const CHANNEL_IDS_TO_MONITOR = [
        'UCk_iCg2GfTUW_4O_TzT4Aaw', // Podpah
        'UCy-Iu_J_An9i4SA9m1g5oNA', // Venus Podcast
        'UCTU2v_xY6g4bIO7N3aU5ylw', // Ticaracaticast
        'UC3tNb3_MhdgAS2i_2i3d_3g', // Flow Podcast
        'UCdcn1G4y_K0t2h2i0B02H_w', // Ciência Sem Fim
        'UCFYYhd9-VxkHnaA5cOiSybA'  // Nerdcast
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

    // Variáveis para guardar o conteúdo original
    let originalTexts = {};
    
    // 3. FUNÇÕES DE API (sem alterações)
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

    // 4. FUNÇÕES DE SKELETON E RENDERIZAÇÃO (REVISADAS)

    /** Gera o HTML para os skeletons dos cards, sempre com a cor neutra. */
    function generateCardSkeletonsHTML(count) {
        let skeletonsHTML = '';
        // Força o uso de 'completed-item' para que ambos os skeletons tenham a cor de fundo neutra
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

    /** Aplica o estado de carregamento (skeletons) na página. */
    function applySkeletons() {
        // Guarda os textos originais
        originalTexts.liveTitle = liveTitleElement.innerHTML;
        originalTexts.liveButton = liveButtonElement.innerHTML;
        originalTexts.completedTitle = completedTitleElement.innerHTML;
        originalTexts.completedButton = completedButtonElement.innerHTML;

        // Aplica os skeletons nos cabeçalhos
        liveTitleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        liveButtonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        completedTitleElement.innerHTML = `<span class="skeleton skeleton-line header-title"></span>`;
        completedButtonElement.innerHTML = `<span class="skeleton skeleton-line header-button"></span>`;
        
        // Aplica os skeletons nos cards
        liveListContainer.innerHTML = generateCardSkeletonsHTML(MAX_LIVES_TO_SHOW);
        completedListContainer.innerHTML = generateCardSkeletonsHTML(MAX_COMPLETED_TO_SHOW);
    }
    
    /** Restaura os cabeçalhos e renderiza o conteúdo final. */
    function renderFinalContent(liveVideos, completedVideos, logoMap) {
        // Restaura os textos dos cabeçalhos
        liveTitleElement.innerHTML = originalTexts.liveTitle;
        liveButtonElement.innerHTML = originalTexts.liveButton;
        completedTitleElement.innerHTML = originalTexts.completedTitle;
        completedButtonElement.innerHTML = originalTexts.completedButton;

        // Renderiza a seção AO VIVO
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

        // Renderiza a seção CONCLUÍDOS
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

    // 5. INICIALIZAÇÃO (LÓGICA PRINCIPAL)
    async function initializePage() {
        // Passo 1: Aplicar todos os skeletons
        applySkeletons();

        // Passo 2: Buscar os vídeos
        const [liveVideos, completedVideos] = await Promise.all([
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'live', MAX_LIVES_TO_SHOW),
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'completed', MAX_COMPLETED_TO_SHOW)
        ]);

        // Passo 3: Buscar os logos
        const allVideos = [...liveVideos, ...completedVideos];
        const uniqueChannelIds = [...new Set(allVideos.map(video => video.snippet.channelId))];
        const logoMap = await fetchChannelLogos(uniqueChannelIds);
        
        // Passo 4: Renderizar o conteúdo final, substituindo os skeletons
        renderFinalContent(liveVideos, completedVideos, logoMap);
    }

    initializePage();
});
