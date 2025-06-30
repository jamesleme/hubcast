document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Formata uma data ISO em um texto amigável (HOJE, AMANHÃ, ou DD de Mês),
     * adaptando-se ao fuso horário local do usuário.
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
            // Formata a data para "DD de Mês"
            const day = eventDate.getDate(); // Usa getDate() para o dia local
            const month = eventDate.toLocaleString('pt-BR', { month: 'long' });
            return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} - ${time}`;
        } else {
            return `Evento encerrado`;
        }
    }

    const upcomingList = document.querySelector('.upcoming-list');
    if (!upcomingList) return; // Sai se não estiver na página da agenda

    const allItems = upcomingList.querySelectorAll('.upcoming-item');
    const now = new Date();

    // ORDENAÇÃO
    allItems.sort((a, b) => {
        const dateA = new Date(a.dataset.datetime);
        const dateB = new Date(b.dataset.datetime);
        return dateA - dateB; // Ordena do mais próximo para o mais distante no futuro
    });

    // Limpa a lista atual para reinserir os itens na ordem correta
    upcomingList.innerHTML = ''; 

    let futureEventsFound = false;

    allItems.forEach(item => {
        const itemDatetimeStr = item.dataset.datetime;
        if (itemDatetimeStr) {
            const itemDate = new Date(itemDatetimeStr);
            if (itemDate > now) {
                // Se o evento está no futuro, o processamos
                futureEventsFound = true;
                const scheduleSpan = item.querySelector('.item-schedule span');
                if (scheduleSpan) {
                    scheduleSpan.textContent = formatScheduleText(itemDatetimeStr);
                }
                // Adiciona o item ordenado de volta à lista
                upcomingList.appendChild(item);
            }
            // Itens que já passaram são simplesmente ignorados e não são adicionados de volta
        }
    });

    // Se, após a filtragem, não sobrar nenhum evento futuro, exibe uma mensagem
    if (!futureEventsFound && allItems.length > 0) {
        upcomingList.innerHTML = '<p class="no-events-message">Nenhum episódio agendado no momento.</p>';
    }
});