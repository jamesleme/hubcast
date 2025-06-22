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
        themeIcon.classList.add('bi-lightbulb-fill'); // Ícone padrão
    }

    themeToggle.addEventListener('click', () => {
        let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });


    // ---- LÓGICA DA API (MODELO PROXY) COM BUSCA DE LOGOS E SKELETON MELHORADO ----

    // 1. CONFIGURAÇÃO
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;

    // Lista de canais que você quer monitorar. A chave da API fica segura no seu servidor.
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
        const promises = channelIds.map(channelId => {
            const apiUrl = `/api/youtube?channelId=${channelId}&eventType=${eventType}`;
            return fetch(apiUrl).then(res => res.json()).catch(err => {
                console.error(`Falha na requisição para ${apiUrl}:`, err);
                return { items: [] }; // Retorna um objeto vazio em caso de falha de rede para não quebrar o Promise.all
            });
        });

        try {
            const results = await Promise.all(promises);
            const allVideos = results.flatMap(result => result.items || []);
            allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
            return allVideos.slice(0, maxResults);
        } catch (error) {
            console.error(`Erro ao processar vídeos '${eventType}' via proxy:`, error);
            return [];
        }
    }

    /** Busca os logos dos canais através do seu proxy */
    async function fetchChannelLogos(channelIds) {
        if (channelIds.length === 0) {
            return new Map();
        }
        
        const apiUrl = `/api/channels?ids=${channelIds.join(',')}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Erro na resposta do servidor: ${response.statusText}`);
            }
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

    // 4. FUNÇÕES DE RENDERIZAÇÃO HTML

    /** Gera o HTML para um número específico de skeletons, imitando o estilo dos cards. */
    function generateSkeletonsHTML(count, type) {
        let skeletonsHTML = '';
        const itemClass = type === 'live' ? 'live-item' : 'completed-item';

        for (let i = 0; i < count; i++) {
            skeletonsHTML += `
                <div class="${itemClass}">
                    <div class="skeleton skeleton-circle"></div>
                    <div class="skeleton-info">
                        <div class="skeleton skeleton-line title"></div>
                        <div class="skeleton skeleton-line channel"></div>
                    </div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            `;
        }
        return skeletonsHTML;
    }
    
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
        // Passo 1: Mostrar Skeletons com o estilo correto
        liveListContainer.innerHTML = generateSkeletonsHTML(MAX_LIVES_TO_SHOW, 'live');
        completedListContainer.innerHTML = generateSkeletonsHTML(MAX_COMPLETED_TO_SHOW, 'completed');

        // Passo 2: Buscar os vídeos via proxy
        const [liveVideos, completedVideos] = await Promise.all([
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'live', MAX_LIVES_TO_SHOW),
            fetchYouTubeVideos(CHANNEL_IDS_TO_MONITOR, 'completed', MAX_COMPLETED_TO_SHOW)
        ]);

        // Passo 3: Extrair IDs únicos dos canais
        const allVideos = [...liveVideos, ...completedVideos];
        const uniqueChannelIds = [...new Set(allVideos.map(video => video.snippet.channelId))];
        
        // Passo 4: Buscar os logos via proxy
        const logoMap = await fetchChannelLogos(uniqueChannelIds);
        
        // Passo 5: Renderizar o conteúdo real, substituindo os skeletons
        renderLiveStreams(liveVideos, logoMap);
        renderCompletedStreams(completedVideos, logoMap);
    }

    // Inicia todo o processo
    initializePage();
});
