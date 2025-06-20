document.addEventListener('DOMContentLoaded', () => {
    // ---- LÓGICA DO TEMA ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
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

    // ---- LÓGICA DA API DO YOUTUBE ----
    const MAX_LIVES_TO_SHOW = 3;
    const MAX_COMPLETED_TO_SHOW = 3;

    const channelsToTrack = [
        { id: 'UC5-aueB1RqpUc-EeAjtx9Lw', name: 'Flow Sport Club', logo: 'https://i.pravatar.cc/80?u=flowsportclub' },
        { id: 'UCWZoPPW7u2I4gZfhJBZ6NqQ', name: 'Inteligência Ltda', logo: 'https://i.pravatar.cc/80?u=InteligenciaLtda' },
        { id: 'UC4ncvgh5hFr5O83MH7-jRJg', name: 'Flow Podcast', logo: 'https://pbs.twimg.com/profile_images/1602640183186309122/vqh-AU0D_400x400.jpg' },
        { id: 'UCj9R9rOhl81fhnKxBpwJ-yw', name: 'Podpah', logo: 'https://i.pravatar.cc/80?u=Podpah' },
        { id: 'UC9LH3xFOJCCp2VFRcZjNdRQ', name: 'TICARACATICAST', logo: 'https://i.pravatar.cc/80?u=TICARACATICAST' },
    ];

    const liveListContainer = document.querySelector('.live-list');
    const liveSection = document.getElementById('live-channels-section');
    const completedListContainer = document.querySelector('.completed-list');
    const completedSection = document.getElementById('completed-section');

    async function checkAndDisplayLiveStreams() {
        const liveItemsHTML = [];
        let liveCount = 0;

        // ... (o loop for para buscar os dados continua exatamente o mesmo) ...
        for (const channel of channelsToTrack) {
            if (liveCount >= MAX_LIVES_TO_SHOW) {
                break;
            }
            const apiUrl = `/functions/get-youtube-data?channelId=${channel.id}&eventType=live`;
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    liveCount++;
                    const liveStream = data.items[0];
                    const liveItemHTML = `<div class="live-item">...</div>`; // Seu HTML do item aqui
                    liveItemsHTML.push(liveItemHTML);
                }
            } catch (error) {
                console.error(`Erro ao verificar o canal ${channel.name}:`, error);
            }
        }
        
        if (liveCount > 0) {
            // Encontramos lives, então vamos preencher o conteúdo
            liveListContainer.innerHTML = liveItemsHTML.join('');
            
            // ---- ALTERAÇÃO AQUI ----
            // Restaura o título da seção
            const titleElement = liveSection.querySelector('h2');
            titleElement.innerHTML = titleElement.dataset.title;
            // -------------------------

        } else {
            // Não há lives, então esconde a seção inteira (esqueletos e título)
            liveSection.style.display = 'none';
        }
    }

    async function fetchAndDisplayCompletedStreams() {
        let allCompletedStreams = [];
        // ... (a parte de Promise.all para buscar os dados continua a mesma) ...

        try {
            // ... (seu código de fetch e ordenação aqui) ...

            if (latestStreams.length > 0) {
                const completedItemsHTML = latestStreams.map(stream => `...`).join(''); // Seu HTML do item
                completedListContainer.innerHTML = completedItemsHTML;

                // Restaura o título da seção
                const titleElement = completedSection.querySelector('h2');
                titleElement.innerHTML = titleElement.dataset.title;
                
                // Restaura o botão "Ver todos"
                const seeAllBtn = liveSection.querySelector('.see-all-btn');
                seeAllBtn.innerHTML = 'Ver todos <i class="fas fa-arrow-right"></i>';

            } else {
                // Não há vídeos concluídos, então esconde a seção inteira
                completedSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao buscar vídeos concluídos:', error);
            completedSection.style.display = 'none';
        }
    }

    // Chama as duas funções para popular o site
    checkAndDisplayLiveStreams();
    fetchAndDisplayCompletedStreams();
});