document.addEventListener('DOMContentLoaded', () => {
    const sidebarListContainer = document.querySelector('.upcoming-list-sidebar');
    if (!sidebarListContainer) return;

    sidebarListContainer.innerHTML = '<p class="loading-agenda">Carregando agenda...</p>';

    async function fetchAndDisplayUpcoming() {
        try {
            const response = await fetch('agenda.html');
            if (!response.ok) throw new Error(`Não foi possível carregar agenda.html`);
            
            const agendaHtmlText = await response.text();
            const parser = new DOMParser();
            const agendaDoc = parser.parseFromString(agendaHtmlText, 'text/html');

            const allUpcomingItems = agendaDoc.querySelectorAll('.upcoming-item');
            const now = new Date(); // Pega a data e hora atual

            // =========================================================
            // LÓGICA DE FILTRAGEM ADICIONADA AQUI
            // =========================================================
            const futureItems = Array.from(allUpcomingItems).filter(item => {
                const itemDatetimeStr = item.dataset.datetime;
                if (!itemDatetimeStr) return false; // Ignora itens sem data
                
                const itemDate = new Date(itemDatetimeStr);
                return itemDate > now; // Mantém o item apenas se a data dele for no futuro
            });
            // =========================================================

            const top3FutureItems = futureItems.slice(0, 3); // Pega os 3 primeiros do futuro

            if (top3FutureItems.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            sidebarListContainer.innerHTML = '';
            top3FutureItems.forEach(itemNode => {
                const clonedItem = itemNode.cloneNode(true);
                sidebarListContainer.appendChild(clonedItem);
                // Não precisa de link, pois o CSS já trata
            });

        } catch (error) {
            console.error("Erro ao carregar a agenda na sidebar:", error);
            sidebarListContainer.innerHTML = '<p class="error-agenda">Não foi possível carregar a agenda.</p>';
        }
    }

    fetchAndDisplayUpcoming();
});