document.addEventListener('DOMContentLoaded', () => {
    const upcomingList = document.querySelector('.upcoming-list');
    if (!upcomingList) return;

    const allItems = upcomingList.querySelectorAll('.upcoming-item');
    const now = new Date();

    allItems.forEach(item => {
        const itemDatetimeStr = item.dataset.datetime;
        if (itemDatetimeStr) {
            const itemDate = new Date(itemDatetimeStr);
            if (itemDate <= now) {
                // Se o evento já passou, remove o elemento da página
                item.remove();
            }
        }
    });
});