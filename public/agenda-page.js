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
            // Se a data já passou
            return `Evento encerrado`;
        }
    }

    const upcomingList = document.querySelector('.upcoming-list');
    if (!upcomingList) return; // Sai se não estiver na página da agenda

    const allItems = upcomingList.querySelectorAll('.upcoming-item');
    const now = new Date();

    let futureEventsFound = false;

    allItems.forEach(item => {
        const itemDatetimeStr = item.dataset.datetime;
        if (itemDatetimeStr) {
            const itemDate = new Date(itemDatetimeStr);
            if (itemDate <= now) {
                // Se o evento já passou, remove o elemento da página
                item.remove();
            } else {
                // Se o evento está no futuro, atualiza o texto e marca que encontramos eventos
                futureEventsFound = true;
                const scheduleSpan = item.querySelector('.item-schedule span');
                if (scheduleSpan) {
                    scheduleSpan.textContent = formatScheduleText(itemDatetimeStr);
                }
            }
        }
    });

    // Se, após a filtragem, não sobrar nenhum evento futuro, exibe uma mensagem
    if (!futureEventsFound) {
        upcomingList.innerHTML = '<p class="no-events-message">Nenhum episódio agendado no momento.</p>';
    }
});