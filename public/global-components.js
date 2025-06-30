document.addEventListener('DOMContentLoaded', () => {

    const loadComponent = async (selector, filePath) => {
        const element = document.querySelector(selector);
        if (element) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Componente não encontrado: ${filePath}`);
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                console.error(error);
                element.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar componente.</p>`;
            }
        }
    };

    // Cria uma lista de todas as tarefas de carregamento
    const componentLoadTasks = [
        loadComponent('header.main-header', 'header.html'),
        loadComponent('footer.main-footer-container', 'footer.html')
    ];

    // Espera que TODAS as tarefas terminem
    Promise.all(componentLoadTasks).then(() => {
        // Quando terminar, dispara um evento personalizado
        console.log("Componentes globais carregados.");
        document.dispatchEvent(new Event('componentsLoaded'));
    });
});