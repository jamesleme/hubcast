document.addEventListener('DOMContentLoaded', () => {

    /**
     * Formata uma data ISO em um texto amigável (HOJE, AMANHÃ, ou DD de Mês),
     * adaptando-se ao fuso horário local do usuário e sempre incluindo a hora.
     * @param {string} dateString - A data no formato ISO UTC (ex: "2024-07-03T23:00:00Z").
     * @returns {string} - O texto formatado.
     */
    function formatScheduleText(dateString) {
        const now = new Date();
        const eventDate = new Date(dateString);

        // Zera a hora para comparar apenas os dias, usando o fuso local do navegador
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        const diffTime = eventDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Pega a hora e minuto convertidos para o fuso horário local do usuário
        const time = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (diffDays === 0) {
            return `HOJE - ${time}`;
        } else if (diffDays === 1) {
            return `AMANHÃ - ${time}`;
        } else if (diffDays > 1) {
            const day = eventDate.getDate();
            const month = eventDate.toLocaleString('pt-BR', { month: 'long' });
            // ALTERAÇÃO APLICADA AQUI PARA MANTER A HORA
            return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} - ${time}`;
        } else {
            return `Evento encerrado`;
        }
    }

    const sidebarListContainer = document.querySelector('.upcoming-list-sidebar');
    
    if (!sidebarListContainer) {
        return; // Sai se não estiver na página da home
    }

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

            const allUpcomingItems = Array.from(agendaDoc.querySelectorAll('.upcoming-item'));
            const now = new Date();
            
            let futureItems = allUpcomingItems.filter(item => {
                const itemDatetimeStr = item.dataset.datetime;
                if (!itemDatetimeStr) return false;
                const itemDate = new Date(itemDatetimeStr);
                return itemDate > now;
            });

            futureItems.sort((a, b) => {
                const dateA = new Date(a.dataset.datetime);
                const dateB = new Date(b.dataset.datetime);
                return dateA - dateB;
            });

            const top3FutureItems = futureItems.slice(0, 3);
            
            if (top3FutureItems.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            sidebarListContainer.innerHTML = '';

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