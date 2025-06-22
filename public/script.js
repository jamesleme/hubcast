document.addEventListener('DOMContentLoaded', () => {
    // ---- LÓGICA DO TEMA (Mantida como estava) ----
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


    // ---- LÓGICA DA API (MODELO PROXY) COM BUSCA DE LOGOS ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;

    const CHANNEL_IDS_TO_MONITOR = [
        'UCk_iCg2GfTUW_4O_TzT4Aaw', // Podpah
        'UCy-Iu_J_An9i4SA9m1g5oNA', // Venus Podcast
        'UCTU2v_xY6g4bIO7N3aU5ylw', // Ticaracaticast
        'UC3tNb3_MhdgAS2i_2i3d_3g', // Flow Podcast
        'UCdcn1G4y_K0t2h2i0B02H_w', // Ciência Sem Fim
        'UCR_M40u_Tj_2mJj2aIHaJ3g'  // Nerdcast
    ];

    // 2. SELETORES DO DOM
    const liveListContainer = document.querySelector('.live-list');
    const liveSection = document.getElementById('live-channels-section');
    const completedListContainer = document.querySelector('.completed-list');
    const completedSection = document.getElementById('completed-section');
    
    // 3. FUNÇÕES DE API (Chamadas para o seu servidor proxy)

    /** Busca vídeos (live ou completed) através do seu proxy */
    async function fetchYouTubeVideos(channelIds, eventType, maxResults) {
        // As chamadas agora são para o seu endpoint /api/youtube
        const promises = channelIds.map(channelId => {
            const apiUrl = `/api/youtube?channelId=${channelId}&eventType=${eventType}`;
            return fetch(apiUrl).then(res => res.json());
        });

        try {
            const results = await Promise.all(promises);
            const allVideos = results.flatMap(result => result.items || []);
            allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
            return allVideos.slice(0, maxResults);
        } catch (error) {
            console.error(`Erro ao buscar vídeos '${eventType}' via proxy:`, error);
            return [];
        }
    }

    /** Busca os logos dos canais através do seu proxy */
    async function fetchChannelLogos(channelIds) {
        if (channelIds.length === 0) {
            return new Map();
        }
        
        // A chamada agora é para o seu novo endpoint /api/channels
        // O backend deve pegar o parâmetro 'ids' e fazer a chamada para a API do Google
        const apiUrl = `/api/channels?ids=${channelIds.join(',')}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const logoMap = new Map();
            if (data.items) {
                data.items.forEach(channel => {
                    logoMap.set(channel.id, channel.snippet.thumbnails.default.url);
                });
            }
            return logoMap;
        } catch (error) {
            console.error('Erro ao buscar logos dos canais via proxy:', error);
            return new Map();
        }
    }

    // 4. FUNÇÕES DE RENDERIZAÇÃO HTML (Sem alterações, já são flexíveis)
    
    function renderLiveStreams(videos, logoMap) {
        if (videos && videos.length > 0) {
            liveSection.style.display = 'block';
            const liveItemsHTML = videos.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || video.snippet.thumbnails.default.url;
                return `
                <div class="live-item">
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
            liveListContainer.innerHTML = liveItemsHTML;
        } else {
            liveSection.style.display = 'none';
        }
    }
    
    function renderCompletedStreams(videos, logoMap) {
        if (videos && videos.length > 0) {
            completedSection.style.display = 'block';
            const completedItemsHTML = videos.map(video => {
                const logoUrl = logoMap.get(video.snippet.channelId) || video.snippet.thumbnails.default.url;
                return `
                <div class="completed-item">
                    <div class="channel-logo-circle"><img src="${logoUrl}" alt="Logo ${video.snippet.channelTitle}"></div>
                    <div class="item-info">
                        <h3>${video.snippet.title}</h3>
                        <p class="channel-name">${video.snippet.channelTitle}</p>
                    </div>
                    <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-vod-btn">
                        <i class="fas fa-play"></i>ASSISTIR
                    </a>
                </div>`;
            }).join('');
            completedListContainer.innerHTML = completedItemsHTML;
        } else {
            completedSection.style.display = 'none';
        }
    }

    // 5. INICIALIZAÇÃO (LÓGICA PRINCIPAL)
    async function initializePage() {
        liveListContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Carregando lives...</p>';
        completedListContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Carregando episódios...</p>';
        
        // Passo 1: Buscar os vídeos via proxy
        const [liveVideos, completedVideos] = await Promise.all([
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'live', MAX_LIVES_TO_SHOW),
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'completed', MAX_COMPLETED_TO_SHOW)
        ]);

        // Passo 2: Extrair IDs únicos dos canais
        const allVideos = [...liveVideos, ...completedVideos];
        const uniqueChannelIds = [...new Set(allVideos.map(video => video.snippet.channelId))];
        
        // Passo 3: Buscar os logos via proxy
        const logoMap = await fetchChannelLogos(uniqueChannelIds);
        
        // Passo 4: Renderizar o conteúdo
        renderLiveStreams(liveVideos, logoMap);
        renderCompletedStreams(completedVideos, logoMap);
    }

    initializePage();
});
