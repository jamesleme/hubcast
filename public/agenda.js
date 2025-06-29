document.addEventListener('DOMContentLoaded', () => {
    const sidebarListContainer = document.querySelector('.upcoming-list-sidebar');
    
    if (!sidebarListContainer) {
        return; // Sai se não estiver na página correta
    }

    // Passo 1: Mostrar um estado de carregamento imediatamente
    sidebarListContainer.innerHTML = '<p class="loading-agenda">Carregando agenda...</p>';

    async function fetchAndDisplayUpcoming() {
        try {
            const response = await fetch('agenda.html');
            if (!response.ok) {
                throw new Error('Não foi possível carregar a página da agenda.');
            }
            const agendaHtmlText = await response.text();

            const parser = new DOMParser();
            const agendaDoc = parser.parseFromString(agendaHtmlText, 'text/html');

            const upcomingItems = agendaDoc.querySelectorAll('.upcoming-item');
            const top3Items = Array.from(upcomingItems).slice(0, 3);
            
            if (top3Items.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            let sidebarHtml = '';
            top3Items.forEach(item => {
                const imgSrc = item.querySelector('img')?.src || '';
                const channelName = item.querySelector('.channel-name')?.textContent || '';
                const title = item.querySelector('h3')?.textContent || '';
                const scheduleHTML = item.querySelector('.item-schedule')?.innerHTML || '';

                sidebarHtml += `
                    <a href="agenda.html" class="upcoming-item-sidebar">
                        <img src="${imgSrc}" alt="${channelName}">
                        <div class="sidebar-item-info">
                            <h4>${title}</h4>
                            <p>${channelName}</p>
                            <div class="item-schedule">${scheduleHTML}</div>
                        </div>
                    </a>
                `;
            });

            sidebarListContainer.innerHTML = sidebarHtml;

        } catch (error) {
            console.error("Erro ao carregar a agenda na sidebar:", error);
            sidebarListContainer.innerHTML = '<p class="error-agenda">Não foi possível carregar a agenda.</p>';
        }
    }

    fetchAndDisplayUpcoming();
});