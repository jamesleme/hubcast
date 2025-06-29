document.addEventListener('DOMContentLoaded', () => {
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

            // Encontra os itens na página da agenda
            const upcomingItems = agendaDoc.querySelectorAll('.upcoming-item');
            const top3Items = Array.from(upcomingItems).slice(0, 3);
            
            if (top3Items.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            // Limpa o container
            sidebarListContainer.innerHTML = '';

            // Itera sobre os 3 primeiros itens e os adiciona à sidebar
            top3Items.forEach(itemNode => {
                // Cria um link para envolver o card
                const link = document.createElement('a');
                link.href = 'agenda.html';
                link.style.textDecoration = 'none';
                link.style.color = 'inherit';

                // Adiciona o HTML do item original dentro do link.
                // O CSS contextual (.sidebar-column .upcoming-item) fará o resto.
                link.appendChild(itemNode.cloneNode(true));
                
                sidebarListContainer.appendChild(link);
            });

        } catch (error) {
            console.error("Erro ao carregar a agenda na sidebar:", error);
            sidebarListContainer.innerHTML = '<p class="error-agenda">Não foi possível carregar a agenda.</p>';
        }
    }

    fetchAndDisplayUpcoming();
});