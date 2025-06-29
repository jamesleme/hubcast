document.addEventListener('DOMContentLoaded', () => {

    /**
     * Formata uma data ISO em um texto amigável (HOJE, AMANHÃ, ou DD de Mês).
     * @param {string} dateString - A data no formato ISO (ex: "2024-06-22T22:00:00Z").
     * @returns {string} - O texto formatado.
     */
    function formatScheduleText(dateString) {
        const now = new Date();
        const eventDate = new Date(dateString);

        // Zera a hora, minuto e segundo para comparar apenas os dias (baseado em UTC para consistência)
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const eventDay = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));
        
        const diffTime = eventDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Pega a hora e minuto no fuso horário local do navegador
        const time = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

        if (diffDays === 0) {
            return `HOJE - ${time}`;
        } else if (diffDays === 1) {
            return `AMANHÃ - ${time}`;
        } else if (diffDays > 1) {
            // Formata a data para "DD de Mês"
            const day = eventDate.getUTCDate();
            const month = eventDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
            return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} - ${time}`;
        } else {
            return `Evento encerrado`;
        }
    }

    const sidebarListContainer = document.querySelector('.upcoming-list-sidebar');
    
    if (!sidebarListContainer) {
        return; // Sai se não estiver na página da home
    }

    // Mostra um estado de carregamento
    sidebarListContainer.innerHTML = '<p class="loading-agenda">Carregando agenda...</p>';

    async function fetchAndDisplayUpcoming() {
        try {
            const response = await fetch('agenda.html');
            if (!response.ok) {
                throw new Error(`Não foi possível carregar agenda.html (status: ${response.status})`);
            }
            const agendaHtmlText = await response.text();

            const parser = new DOMParser();
            const agendaDoc = parser.parseFromString(agendaHtmlText, 'text/html');

            const allUpcomingItems = agendaDoc.querySelectorAll('.upcoming-item');
            const now = new Date();
            
            // Filtra para pegar apenas os itens futuros
            const futureItems = Array.from(allUpcomingItems).filter(item => {
                const itemDatetimeStr = item.dataset.datetime;
                if (!itemDatetimeStr) return false;
                const itemDate = new Date(itemDatetimeStr);
                return itemDate > now;
            });

            const top3FutureItems = futureItems.slice(0, 3);
            
            if (top3FutureItems.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            // Limpa o container
            sidebarListContainer.innerHTML = '';

            // Itera sobre os 3 primeiros itens, formata o texto e os adiciona à sidebar
            top3FutureItems.forEach(itemNode => {
                const datetime = itemNode.dataset.datetime;
                const scheduleSpan = itemNode.querySelector('.item-schedule span');
                if (scheduleSpan && datetime) {
                    scheduleSpan.textContent = formatScheduleText(datetime);
                }

                const clonedItem = itemNode.cloneNode(true);
                sidebarListContainer.appendChild(clonedItem);
            });

        } catch (error) {
            console.error("Erro ao carregar a agenda na sidebar:", error);
            sidebarListContainer.innerHTML = '<p class="error-agenda">Não foi possível carregar a agenda.</p>';
        }
    }

    fetchAndDisplayUpcoming();
});