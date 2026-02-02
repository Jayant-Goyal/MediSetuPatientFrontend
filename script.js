// --- 1. Robust Mock Data ---
const MOCK_REPORTS = [
    { id: 101, title: "CBC (Complete Blood Count)", date: "2023-10-24", source: "Apollo Diagnostics", status: "Normal", file: "cbc_oct24.pdf", size: "1.2 MB" },
    { id: 102, title: "Lipid Profile", date: "2023-10-20", source: "City Hospital", status: "Abnormal", file: "lipid_profile.pdf", size: "0.8 MB" },
    { id: 103, title: "X-Ray Chest PA View", date: "2023-10-15", source: "Max Imaging", status: "Normal", file: "xray_chest.jpg", size: "4.5 MB" },
    { id: 104, title: "Thyroid Function Test", date: "2023-09-30", source: "Dr. Lal PathLabs", status: "Normal", file: "thyroid_sep.pdf", size: "1.1 MB" },
    { id: 105, title: "Liver Function Test", date: "2023-09-28", source: "Fortis Hospital", status: "Pending", file: "lft_pending.pdf", size: "—" },
    { id: 110, title: "Dengue Serology", date: "2023-06-15", source: "Max Imaging", status: "Abnormal", file: "dengue_pos.pdf", size: "1.0 MB" },
    { id: 112, title: "ECG", date: "2023-04-05", source: "Fortis Hospital", status: "Normal", file: "ecg_strip.pdf", size: "2.1 MB" },
];

// --- 2. State Management ---
const state = {
    view: 'login', 
    user: null,
    theme: 'light',
    reports: [],
    loading: false,
    searchQuery: '',
    filterStatus: 'All',
    sortBy: 'newest',
    selectedReport: null
};

// --- 3. Utility Functions ---
const getEl = (id) => document.getElementById(id);

const escapeHtml = (unsafe) => {
    if (!unsafe) return "";
    return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const showToast = (msg) => {
    const toast = getEl('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.remove('translate-y-32');
        setTimeout(() => toast.classList.add('translate-y-32'), 3000);
    }
};

const toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('medisetu_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('medisetu_theme', 'light');
    }
    // Update icon if it exists in current view
    const icon = getEl('themeIcon');
    if (icon) {
        icon.className = state.theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
};

const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    // Added dark mode classes to config
    if (s === 'normal') return { class: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', icon: 'fa-check-circle' };
    if (s === 'abnormal') return { class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: 'fa-exclamation-circle' };
    if (s === 'pending') return { class: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', icon: 'fa-clock' };
    return { class: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', icon: 'fa-circle-question' };
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// --- 4. Core Logic & Routing ---

function init() {
    // Theme Initialization
    const savedTheme = localStorage.getItem('medisetu_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        state.theme = 'dark';
        document.documentElement.classList.add('dark');
    } else {
        state.theme = 'light';
        document.documentElement.classList.remove('dark');
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && state.view === 'reports' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            const searchInput = getEl('searchInput');
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape' && state.view === 'details') history.back();
    });

    window.addEventListener('popstate', (event) => {
        if (event.state) {
            state.view = event.state.view;
            state.selectedReport = event.state.selectedReport;
            render();
        } else {
            handleInitialRoute();
        }
    });

    handleInitialRoute();
}

function handleInitialRoute() {
    const savedUser = localStorage.getItem('medisetu_patientId');
    
    if (!savedUser) {
        routeTo('login', null, true);
        return;
    }

    state.user = savedUser;
    const hash = window.location.hash;

    if (hash.startsWith('#report-')) {
        const id = parseInt(hash.replace('#report-', ''), 10);
        state.reports = MOCK_REPORTS; 
        const report = MOCK_REPORTS.find(r => r.id === id);
        
        if (report) {
            routeTo('details', report, false);
        } else {
            routeTo('reports', null, true);
        }
    } else {
        routeTo('reports', null, true);
    }
}

function routeTo(view, data = null, pushToHistory = true) {
    state.view = view;
    if (view === 'details') state.selectedReport = data;

    if (pushToHistory) {
        const url = view === 'login' ? 'login' : (view === 'reports' ? 'dashboard' : `report-${data.id}`);
        history.pushState({ view, selectedReport: data }, '', `#${url}`);
    }

    render();
}

function render() {
    const savedUser = localStorage.getItem('medisetu_patientId');
    if (!savedUser && state.view !== 'login') {
        state.view = 'login';
        state.user = null;
    }

    const app = getEl('app');
    app.innerHTML = '';
    app.scrollTop = 0;

    if (state.view === 'login') renderLogin(app);
    else if (state.view === 'reports') renderReportsLocker(app);
    else if (state.view === 'details') renderReportDetails(app);
}

// --- 5. View Renderers ---

function renderLogin(container) {
    container.innerHTML = `
        <div class="min-h-full flex flex-col items-center justify-center p-4 fade-in relative">
            <button onclick="toggleTheme()" class="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <i id="themeIcon" class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl"></i>
            </button>
            
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors" id="loginCard">
                <div class="bg-blue-600 p-6 text-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl font-bold shadow-lg">
                        <i class="fa-solid fa-heart-pulse"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-white">Medisetu</h1>
                    <p class="text-blue-100">Patient Access Portal</p>
                </div>
                <div class="p-8">
                    <h2 class="text-xl font-semibold mb-6 text-center text-gray-700 dark:text-gray-200">Login to your account</h2>
                    <div class="space-y-4">
                        <div>
                            <label for="loginInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID / Phone</label>
                            <input type="text" id="loginInput" placeholder="Enter Patient ID (e.g. 98765)" 
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition dark:placeholder-gray-400">
                            <p id="loginError" class="text-red-500 text-sm mt-1 hidden" role="alert"><i class="fa-solid fa-circle-exclamation mr-1"></i>Please enter Patient ID</p>
                        </div>
                        <button onclick="handleLogin()" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg transform active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            Continue
                        </button>
                    </div>

                    <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Trouble logging in?</p>
                        <button onclick="contactSupport()" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm flex items-center justify-center gap-2 mx-auto transition p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <i class="fa-solid fa-headset"></i> Contact Support
                        </button>
                    </div>

                    <p class="text-xs text-center text-gray-400 mt-6">Secure • Encrypted • Private</p>
                </div>
            </div>
        </div>
    `;
    
    const input = document.getElementById('loginInput');
    if(input) {
        input.focus();
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
}

function contactSupport() {
    showToast("Opening email client...");
    setTimeout(() => {
        window.location.href = "mailto:support@medisetu.com?subject=Login%20Support%20Request";
    }, 500);
}

function handleLogin() {
    const input = getEl('loginInput');
    const error = getEl('loginError');
    const card = getEl('loginCard');
    const val = input.value.trim();

    if (!val) {
        card.classList.remove('shake');
        void card.offsetWidth; 
        card.classList.add('shake');
        error.classList.remove('hidden');
        input.classList.add('border-red-500');
        input.setAttribute('aria-invalid', 'true');
        return;
    }

    state.user = val;
    localStorage.setItem('medisetu_patientId', val);
    routeTo('reports');
}

function handleLogout() {
    localStorage.removeItem('medisetu_patientId');
    state.user = null;
    state.reports = [];
    state.filterStatus = 'All';
    state.searchQuery = '';
    routeTo('login');
}

function renderReportsLocker(container) {
    if (state.reports.length === 0 && !state.loading) {
            state.loading = true;
            setTimeout(() => {
            state.loading = false;
            state.reports = MOCK_REPORTS;
            renderReportsGrid();
            }, 800);
    }

    container.innerHTML = `
        <div class="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
            <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 transition-colors border-b border-gray-100 dark:border-gray-700">
                <div class="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-heart-pulse text-blue-600 dark:text-blue-400 text-2xl"></i>
                        <span class="font-bold text-xl text-gray-800 dark:text-gray-100 tracking-tight">Medisetu</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="toggleTheme()" class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition p-2" aria-label="Toggle Theme">
                            <i id="themeIcon" class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg"></i>
                        </button>
                        <div class="hidden sm:flex flex-col items-end border-r border-gray-200 dark:border-gray-700 pr-4">
                            <span class="text-xs text-gray-500 dark:text-gray-400">Logged in as</span>
                            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 max-w-[100px] truncate" title="${escapeHtml(state.user)}">${escapeHtml(state.user)}</span>
                        </div>
                        <button onclick="handleLogout()" class="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Logout" title="Logout">
                            <i class="fa-solid fa-right-from-bracket text-lg"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Reports Locker</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">Access and manage your medical history</p>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center border border-gray-100 dark:border-gray-700 transition-colors">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                        <input type="text" id="searchInput" 
                            oninput="handleSearch(this.value)"
                            value="${escapeHtml(state.searchQuery)}"
                            placeholder="Search reports... (Press '/')" 
                            class="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm dark:placeholder-gray-400 transition-colors">
                        <button id="clearSearch" onclick="clearSearch()" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${state.searchQuery ? '' : 'hidden'}">
                            <i class="fa-solid fa-times-circle"></i>
                        </button>
                    </div>
                    
                    <div class="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
                        <div class="flex gap-2">
                            ${renderFilters()}
                        </div>
                        <div class="border-l border-gray-200 dark:border-gray-700 pl-3">
                            <select onchange="handleSort(this.value)" class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition-colors">
                                <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Newest</option>
                                <option value="oldest" ${state.sortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="reportsGrid" class="min-h-[300px]" aria-live="polite">
                    <!-- Skeleton Loading -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${[1,2,3].map(() => `
                            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-pulse">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    <div class="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (!state.loading && state.reports.length > 0) {
        renderReportsGrid();
    }
}

function renderFilters() {
    const filters = ['All', 'Normal', 'Abnormal', 'Pending'];
    return filters.map(f => `
        <button onclick="setFilter('${f}')" 
            class="filter-btn px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border
            ${state.filterStatus === f 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md dark:bg-blue-600 dark:border-blue-600' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'}"
            aria-pressed="${state.filterStatus === f}">
            ${f}
        </button>
    `).join('');
}

function setFilter(status) {
    state.filterStatus = status;
    renderReportsGrid();
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isSelected = btn.textContent.trim() === status;
        
        const activeClass = 'bg-blue-600 text-white border-blue-600 shadow-md dark:bg-blue-600 dark:border-blue-600';
        const inactiveClass = 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700';
        
        btn.className = `filter-btn px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border ${isSelected ? activeClass : inactiveClass}`;
    });
}

function handleSort(value) {
    state.sortBy = value;
    renderReportsGrid();
}

function handleSearch(query) {
    state.searchQuery = query.toLowerCase();
    const clearBtn = getEl('clearSearch');
    if (clearBtn) {
        if (query.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }
    renderReportsGrid();
}

function clearSearch() {
    const input = getEl('searchInput');
    if(input) {
        input.value = '';
        input.focus();
    }
    handleSearch('');
}

function renderReportsGrid() {
    const grid = getEl('reportsGrid');
    if (!grid) return;

    let filtered = state.reports.filter(r => {
        const title = (r.title || '').toLowerCase();
        const source = (r.source || '').toLowerCase();
        const matchesSearch = title.includes(state.searchQuery) || source.includes(state.searchQuery);
        const matchesStatus = state.filterStatus === 'All' || r.status === state.filterStatus;
        return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return state.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center fade-in">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                    <i class="fa-solid fa-file-circle-xmark text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">No reports found</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-4">Try adjusting your search or filters.</p>
                <button onclick="setFilter('All'); const si=document.getElementById('searchInput'); if(si) si.value=''; handleSearch('')" class="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">Clear Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
            ${filtered.map(report => {
                const statusConfig = getStatusConfig(report.status);
                return `
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full group">
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <i class="fa-solid fa-file-medical text-lg"></i>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusConfig.class}">
                            <i class="fa-solid ${statusConfig.icon}"></i> ${escapeHtml(report.status || 'Unknown')}
                        </span>
                    </div>
                    
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">${escapeHtml(report.title || 'Untitled Report')}</h3>
                    
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                        <div class="flex items-center gap-2">
                            <i class="fa-regular fa-calendar text-xs w-4"></i> ${formatDate(report.date)}
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-hospital text-xs w-4"></i> ${escapeHtml(report.source || 'Unknown Lab')}
                        </div>
                    </div>

                    <div class="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                        <button onclick="viewReport(${report.id})" class="w-full py-2 bg-gray-50 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            View Report <i class="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

function viewReport(id) {
    const report = state.reports.find(r => r.id === id);
    if (report) {
        routeTo('details', report);
    }
}

function renderReportDetails(container) {
    const r = state.selectedReport;
    if (!r) { 
        routeTo('reports'); 
        return; 
    }
    
    const statusConfig = getStatusConfig(r.status);

    container.innerHTML = `
        <div class="min-h-full bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-30 shadow-sm no-print transition-colors">
                <div class="max-w-3xl mx-auto w-full flex justify-between items-center">
                    <button onclick="history.back()" class="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition group font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1">
                        <span class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-gray-600 flex items-center justify-center mr-2 transition">
                            <i class="fa-solid fa-arrow-left"></i>
                        </span>
                        <span class="hidden sm:inline">Back to Reports</span>
                        <span class="sm:hidden">Back</span>
                    </button>
                    <div class="flex items-center gap-2">
                        <button onclick="toggleTheme()" class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Toggle Theme">
                            <i id="themeIcon" class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg"></i>
                        </button>
                        <button onclick="window.print()" class="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Print Report">
                            <i class="fa-solid fa-print text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 py-8 overflow-y-auto fade-in">
                <div class="max-w-3xl mx-auto w-full space-y-6">
                    
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 relative overflow-hidden print-container transition-colors">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-10 -mt-10 z-0 no-print transition-colors"></div>
                        <div class="relative z-10">
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">${escapeHtml(r.title)}</h1>
                                    <p class="text-gray-500 dark:text-gray-400">Report ID: #${r.id}</p>
                                </div>
                                <div class="self-start md:self-center">
                                    <span class="px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${statusConfig.class}">
                                        <i class="fa-solid ${statusConfig.icon}"></i> ${escapeHtml(r.status)}
                                    </span>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 mb-6 print-container transition-colors">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Date Conducted</p>
                                    <p class="text-gray-800 dark:text-gray-200 font-medium flex items-center gap-2">
                                        <i class="fa-regular fa-calendar-check text-blue-500 no-print"></i> ${formatDate(r.date)}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Source / Lab</p>
                                    <p class="text-gray-800 dark:text-gray-200 font-medium flex items-center gap-2">
                                        <i class="fa-solid fa-hospital-user text-blue-500 no-print"></i> ${escapeHtml(r.source)}
                                    </p>
                                </div>
                            </div>
                            
                            <div class="hidden print-only-visible mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
                                Printed from Medisetu Patient Portal on ${new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 no-print transition-colors">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-paperclip text-gray-400"></i> Attachments
                        </h3>
                        
                        <button onclick="downloadMockFile('${escapeHtml(r.file || 'report.pdf')}')" class="w-full text-left border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 group focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg flex items-center justify-center text-xl shadow-sm transition-colors">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-gray-800 dark:text-gray-200 font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${escapeHtml(r.file || 'report.pdf')}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${r.size || 'Unknown size'} • PDF Document</p>
                            </div>
                            <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-sm">
                                <i class="fa-solid fa-download"></i>
                            </div>
                        </button>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6 no-print transition-colors">
                        <div class="flex gap-3">
                            <i class="fa-solid fa-circle-info text-blue-500 dark:text-blue-400 mt-1"></i>
                            <div>
                                <h4 class="text-blue-900 dark:text-blue-300 font-semibold mb-1">Understanding your report</h4>
                                <p class="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                                    This report contains medical terminology. Please consult with your general physician for a detailed interpretation of these results.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function downloadMockFile(fileName) {
    showToast(`Downloading ${fileName}...`);
    const mockContent = "This is a dummy medical report file for demonstration purposes.";
    const blob = new Blob([mockContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', init);
