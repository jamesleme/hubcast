document.addEventListener('DOMContentLoaded', () => {
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

            const upcomingItems = agendaDoc.querySelectorAll('.upcoming-item');
            const top3Items = Array.from(upcomingItems).slice(0, 3);
            
            if (top3Items.length === 0) {
                sidebarListContainer.closest('section').style.display = 'none';
                return;
            }

            // Limpa o container
            sidebarListContainer.innerHTML = '';

            // Itera sobre os 3 primeiros itens
            top3Items.forEach(itemNode => {
                // Clona o nó do item da agenda
                const clonedItem = itemNode.cloneNode(true);

                // Adiciona o clone DIRETAMENTE ao container da sidebar.
                // Agora, o `gap` definido no CSS para .upcoming-list-sidebar vai funcionar.
                sidebarListContainer.appendChild(clonedItem);
            });

        } catch (error) {
            console.error("Erro ao carregar a agenda na sidebar:", error);
            sidebarListContainer.innerHTML = '<p class="error-agenda">Não foi possível carregar a agenda.</p>';
        }
    }

    fetchAndDisplayUpcoming();
});