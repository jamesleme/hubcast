document.addEventListener('DOMContentLoaded', () => {
    // ---- LÓGICA DO TEMA ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    if (currentTheme) {
        applyTheme(currentTheme);
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

    // ---- LÓGICA DA API DO YOUTUBE (AMBIENTE DE PRODUÇÃO) ----
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;

    const channelsToTrack = [
        { id: 'UC4_bL9_p3s01K_T1aG8m1dA', name: 'Podpah', logo: 'https://i.pravatar.cc/80?u=podpah' },
        { id: 'UCp2tjaqW3S3pP_2J3qS_zaA', name: 'Venus Podcast', logo: 'https://i.pravatar.cc/80?u=venus' },
        { id: 'UCoB84QGiiwV3c01m_G34S7A', name: 'Ticaracaticast', logo: 'https://i.pravatar.cc/80?u=ticaracaticast' },
        { id: 'UC4K-979s9ltJPROmH-eYkiA', name: 'Flow Podcast', logo: 'https://i.pravatar.cc/80?u=flow' },
        { id: 'UCk107Q3h57M3G1_d2Q3E1DQ', name: 'Flow Sport Club', logo: 'https://i.pravatar.cc/80?u=flowsportclub' },
        { id: 'UC6nODa90W_lAYHjMOp-U9wA', name: 'CazéTV', logo: 'https://i.pravatar.cc/80?u=cazetv' },
    ];

    const liveListContainer = document.querySelector('.live-list');
    const liveSection = document.getElementById('live-channels-section');
    const completedListContainer = document.querySelector('.completed-list');
    const completedSection = document.getElementById('completed-section');

    function restoreSectionHeader(sectionElement) {
        const titleElement = sectionElement.querySelector('h2');
        if (titleElement) titleElement.innerHTML = titleElement.dataset.title;
        const seeAllBtn = sectionElement.querySelector('.see-all-btn');
        if (seeAllBtn) seeAllBtn.innerHTML = 'Ver todos <i class="fas fa-arrow-right"></i>';
    }

    async function checkAndDisplayLiveStreams() {
        const liveItemsHTML = [];
        let liveCount = 0;

        for (const channel of channelsToTrack) {
            if (liveCount >= MAX_LIVES_TO_SHOW) break;
            
            const apiUrl = `/api/youtube?channelId=${channel.id}&eventType=live`;
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    liveCount++;
                    const liveStream = data.items[0];
                    liveItemsHTML.push(`<div class="live-item"><div class="channel-logo-circle"><img src="${channel.logo}" alt="Logo ${channel.name}"></div><div class="item-info"><h3>${liveStream.snippet.title}</h3><p class="channel-name">${channel.name}</p></div><a href="https://www.youtube.com/watch?v=${liveStream.id.videoId}" target="_blank" class="watch-live-btn"><i class="fas fa-circle"></i> AO VIVO</a></div>`);
                }
            } catch (error) {
                console.error(`Erro ao verificar o canal ${channel.name}:`, error);
            }
        }
        
        if (liveCount > 0) {
            liveListContainer.innerHTML = liveItemsHTML.join('');
            restoreSectionHeader(liveSection);
        } else {
            liveSection.style.display = 'none';
        }
    }

    async function fetchAndDisplayCompletedStreams() {
        const promises = channelsToTrack.map(channel => {
            const apiUrl = `/api/youtube?channelId=${channel.id}&eventType=completed`;
            return fetch(apiUrl).then(res => res.ok ? res.json() : Promise.reject(res));
        });

        try {
            const results = await Promise.allSettled(promises);
            let allCompletedStreams = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.items) {
                    const channelInfo = channelsToTrack[index];
                    const videosWithChannelInfo = result.value.items.map(item => ({...item, channelName: channelInfo.name, channelLogo: channelInfo.logo }));
                    allCompletedStreams.push(...videosWithChannelInfo);
                }
            });

            allCompletedStreams.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
            const latestStreams = allCompletedStreams.slice(0, MAX_COMPLETED_TO_SHOW);

            if (latestStreams.length > 0) {
                completedListContainer.innerHTML = latestStreams.map(stream => `<div class="completed-item"><div class="channel-logo-circle"><img src="${stream.channelLogo}" alt="Logo ${stream.channelName}"></div><div class="item-info"><h3>${stream.snippet.title}</h3><p class="channel-name">${stream.channelName}</p></div><a href="https://www.youtube.com/watch?v=${stream.id.videoId}" target="_blank" class="watch-vod-btn"><i class="fas fa-play"></i>ASSISTIR</a></div>`).join('');
                restoreSectionHeader(completedSection);
            } else {
                completedSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao buscar vídeos concluídos:', error);
            completedSection.style.display = 'none';
        }
    }

    checkAndDisplayLiveStreams();
    fetchAndDisplayCompletedStreams();
});