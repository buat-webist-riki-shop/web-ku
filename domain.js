document.addEventListener('DOMContentLoaded', () => {
    const apikeyScreen = document.getElementById('apikey-screen');
    const domainManagementScreen = document.getElementById('domain-management-screen');
    const apiKeyInput = document.getElementById('api-key-input');
    const verifyApiKeyButton = document.getElementById('verify-api-key-button');

    const toastContainer = document.getElementById('toast-container');
    let activeToastTimeout = null;

    const themeSwitchBtnLogin = document.getElementById('themeSwitchBtnLogin');
    const themeSwitchBtnPanel = document.getElementById('themeSwitchBtnPanel');
    const body = document.body;

    // Elemen untuk Custom Confirmation Modal
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;

    // Elemen untuk Domain Success Modal
    const domainSuccessModal = document.getElementById('domainSuccessModal');
    const closeDomainSuccessModalBtn = document.getElementById('closeDomainSuccessModal');
    const displayDomainName = document.getElementById('displayDomainName');
    const displayNodeName = document.getElementById('displayNodeName');
    const copyButtons = document.querySelectorAll('.domain-success-modal-content .copy-button');


    // Domain Management Elements
    const domainCategorySelect = document.getElementById('domain-category-select');
    const hostInput = document.getElementById('host-input');
    const ipInput = document.getElementById('ip-input');
    const createDomainForm = document.getElementById('createDomainForm');
    const createSubdomainBtn = document.getElementById('create-subdomain-btn');
    const createdDomainList = document.getElementById('created-domain-list');

    const API_BASE_URL = '/api';

    // Menyimpan API Key di sessionStorage setelah diverifikasi
    let userApiKey = sessionStorage.getItem('userApiKey') || null;

    // --- Theme Toggling ---
    const savedTheme = localStorage.getItem('domain-theme') || 'light-mode';
    body.className = savedTheme;

    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) {
            themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
        }
    }
    updateThemeButton();

    function toggleTheme() {
        if (body.classList.contains('light-mode')) {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('domain-theme', 'dark-mode');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('domain-theme', 'light-mode');
        }
        updateThemeButton();
    }
    themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) {
        themeSwitchBtnPanel.addEventListener('click', toggleTheme);
    }

    // --- Toast Notifications ---
    function showToast(message, type = 'info', duration = 3000) {
        if (toastContainer.firstChild) {
            clearTimeout(activeToastTimeout);
            toastContainer.innerHTML = '';
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        toastContainer.appendChild(toast);
        activeToastTimeout = setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }

    // --- Custom Confirmation Modal ---
    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        customConfirmModal.classList.add('is-visible');
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    }

    confirmOkBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) {
            resolveConfirmPromise(true);
            resolveConfirmPromise = null;
        }
    });

    confirmCancelBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) {
            resolveConfirmPromise(false);
            resolveConfirmPromise = null;
        }
    });

    customConfirmModal.addEventListener('click', (e) => {
        if (e.target === customConfirmModal) {
            customConfirmModal.classList.remove('is-visible');
            if (resolveConfirmPromise) {
                resolveConfirmPromise(false);
                resolveConfirmPromise = null;
            }
        }
    });

    // --- Domain Success Modal ---
    closeDomainSuccessModalBtn.addEventListener('click', () => {
        domainSuccessModal.classList.remove('is-visible');
    });

    window.addEventListener('click', (e) => {
        if (e.target === domainSuccessModal) {
            domainSuccessModal.classList.remove('is-visible');
        }
    });

    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const elementToCopy = document.getElementById(targetId);
            if (elementToCopy) {
                const textToCopy = elementToCopy.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`${targetId === 'displayDomainName' ? 'Domain' : 'Node'} berhasil disalin!`, 'success');
                }).catch(err => {
                    console.error('Gagal menyalin:', err);
                    showToast('Gagal menyalin.', 'error');
                });
            }
        });
    });

    // --- API Key Verification ---
    verifyApiKeyButton.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showToast('API Key tidak boleh kosong.', 'error');
            return;
        }
        verifyApiKeyButton.textContent = 'Memverifikasi...';
        verifyApiKeyButton.disabled = true;

        try {
            // Kita tidak perlu API khusus untuk verifikasi, cukup cek apakah ada di daftar
            // Untuk demo ini, kita akan mock verifikasi
            const res = await fetch(`${API_BASE_URL}/apikeys`);
            if (!res.ok) throw new Error(`Gagal memuat API Keys: Status ${res.status}`);
            const apiKeys = await res.json();
            const validKey = apiKeys.find(k => k.key === key);

            if (validKey) {
                if (validKey.expiryDate && new Date(validKey.expiryDate) < new Date()) {
                    throw new Error('API Key sudah kadaluarsa.');
                }
                userApiKey = key;
                sessionStorage.setItem('userApiKey', key);
                apikeyScreen.style.display = 'none';
                domainManagementScreen.style.display = 'block';
                showToast('Verifikasi API Key berhasil!', 'success');
                // Load initial data for domain management
                loadDomainCategoriesForSelect();
                document.querySelector('.tab-button[data-tab="createDomain"]').click();
            } else {
                throw new Error('API Key tidak valid.');
            }
        } catch (e) {
            console.error('API Key verification error:', e);
            showToast(e.message || 'Verifikasi API Key gagal.', 'error');
        } finally {
            verifyApiKeyButton.textContent = 'Verifikasi API Key';
            verifyApiKeyButton.disabled = false;
        }
    });

    // --- Domain Management Tabs ---
    const tabButtons = document.querySelectorAll('.domain-tabs .tab-button');
    const tabContents = document.querySelectorAll('.domain-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');

            if (button.dataset.tab === 'listDomains') {
                renderCreatedDomains();
            }
        });
    });

    // --- Load Domain Categories for Select ---
    async function loadDomainCategoriesForSelect() {
        domainCategorySelect.innerHTML = '<option value="">-- Memuat Kategori --</option>';
        try {
            const res = await fetch(`${API_BASE_URL}/domainCategories`);
            if (!res.ok) throw new Error(`Gagal memuat kategori domain: Status ${res.status}`);
            const categories = await res.json();
            
            if (categories.length === 0) {
                domainCategorySelect.innerHTML = '<option value="">-- Tidak ada kategori --</option>';
                return;
            }

            domainCategorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                domainCategorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading domain categories for select:', error);
            showToast(error.message || 'Gagal memuat kategori domain.', 'error');
            domainCategorySelect.innerHTML = '<option value="">-- Gagal memuat kategori --</option>';
        }
    }

    // --- Create Subdomain ---
    createDomainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userApiKey) {
            showToast('API Key belum diverifikasi. Silakan verifikasi API Key Anda terlebih dahulu.', 'error');
            return;
        }

        const host = hostInput.value.trim();
        const domainCategory = domainCategorySelect.value;
        const ip = ipInput.value.trim();

        if (!host || !domainCategory || !ip) {
            showToast('Semua kolom wajib diisi.', 'error');
            return;
        }
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
            showToast('Format IP tidak valid.', 'error');
            return;
        }

        createSubdomainBtn.textContent = 'Membuat...';
        createSubdomainBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/createSubdomain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: userApiKey, host, domainCategory, ip })
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || 'Terjadi kesalahan saat membuat subdomain.');
            }

            showToast('Subdomain berhasil dibuat!', 'success');
            
            // Tampilkan popup sukses
            displayDomainName.textContent = result.domain;
            displayNodeName.textContent = result.node;
            domainSuccessModal.classList.add('is-visible');

            // Simpan domain yang dibuat secara lokal (untuk ditampilkan di tab "Daftar Domain Dibuat")
            saveCreatedDomainLocally({
                host: host,
                category: domainCategory,
                ip: ip,
                fullDomain: result.domain,
                fullNode: result.node,
                createdAt: new Date().toISOString()
            });

            // Reset form
            hostInput.value = '';
            ipInput.value = '';
            domainCategorySelect.value = ''; // Reset ke pilihan kosong
            
        } catch (error) {
            console.error('Error creating subdomain:', error);
            showToast(error.message || 'Gagal membuat subdomain.', 'error');
        } finally {
            createSubdomainBtn.textContent = 'Buat Domain';
            createSubdomainBtn.disabled = false;
        }
    });

    // --- Manage Created Domains (Local Storage) ---
    function getCreatedDomains() {
        return JSON.parse(localStorage.getItem('createdDomains')) || [];
    }

    function saveCreatedDomainLocally(domain) {
        const domains = getCreatedDomains();
        domains.push(domain);
        localStorage.setItem('createdDomains', JSON.stringify(domains));
        renderCreatedDomains(); // Perbarui daftar di UI jika tab aktif
    }

    function renderCreatedDomains() {
        const domains = getCreatedDomains();
        createdDomainList.innerHTML = '';

        if (domains.length === 0) {
            createdDomainList.innerHTML = '<p>Anda belum membuat domain apapun.</p>';
            return;
        }

        domains.forEach(domain => {
            const item = document.createElement('div');
            item.className = 'domain-item';
            item.innerHTML = `
                <div class="domain-display"><b>Domain:</b> ${domain.fullDomain}</div>
                <div class="domain-display"><b>Node:</b> ${domain.fullNode}</div>
                <div class="domain-meta">IP: ${domain.ip} | Kategori: ${domain.category} | Dibuat: ${new Date(domain.createdAt).toLocaleString('id-ID')}</div>
                <div class="item-actions">
                    <button type="button" class="copy-button" data-copy-text="${domain.fullDomain}"><i class="fas fa-copy"></i> Salin Domain</button>
                    <button type="button" class="copy-button" data-copy-text="${domain.fullNode}" style="margin-left: 10px;"><i class="fas fa-copy"></i> Salin Node</button>
                </div>
            `;
            createdDomainList.appendChild(item);
        });

        createdDomainList.querySelectorAll('.copy-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const textToCopy = e.currentTarget.dataset.copyText;
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        showToast('Berhasil disalin!', 'success');
                    }).catch(err => {
                        console.error('Gagal menyalin:', err);
                        showToast('Gagal menyalin.', 'error');
                    });
                }
            });
        });
    }

    // --- Initial Check ---
    if (userApiKey) {
        // Jika API Key sudah ada di sessionStorage, coba verifikasi lagi (opsional, bisa juga langsung tampilkan)
        // Untuk saat ini, kita akan langsung menampilkan layar manajemen domain
        apikeyScreen.style.display = 'none';
        domainManagementScreen.style.display = 'block';
        loadDomainCategoriesForSelect();
        // Load tab default
        document.querySelector('.tab-button[data-tab="createDomain"]').click();
    }
});