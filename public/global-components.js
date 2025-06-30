document.addEventListener('DOMContentLoaded', () => {

    const loadComponent = (selector, filePath) => {
        const element = document.querySelector(selector);
        if (element) {
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Não foi possível carregar o componente: ${filePath}`);
                    }
                    return response.text();
                })
                .then(html => {
                    element.innerHTML = html;
                })
                .catch(error => {
                    console.error(error);
                    element.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar componente.</p>`;
                });
        }
    };

    // Carrega o rodapé em todas as páginas que tiverem o placeholder
    loadComponent('footer.main-footer-container', 'footer.html');

    // Opcional: Você pode fazer o mesmo para o cabeçalho se quiser!
    // loadComponent('header.main-header', 'header.html');
});