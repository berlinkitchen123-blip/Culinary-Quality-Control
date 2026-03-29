
export const Notifications = {
    show: (message, type = 'success') => {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-[#022c22]' : 'bg-red-600';
        toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-right-10 duration-300 pointer-events-auto`;
        
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p class="text-[11px] font-bold tracking-tight">${message}</p>
            </div>
            <button class="text-white/40 hover:text-white" onclick="this.parentElement.remove()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        `;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right-10'), 3000);
        setTimeout(() => toast.remove(), 3350);
    }
};
