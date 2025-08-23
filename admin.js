document.addEventListener('DOMContentLoaded', () => {
    // ELEMEN DASAR
    const loginScreen = document.getElementById('login-screen');
    const productFormScreen = document.getElementById('product-form-screen');
    const toastContainer = document.getElementById('toast-container');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const passwordToggle = document.getElementById('passwordToggle');
    const themeSwitchBtnLogin = document.getElementById('themeSwitchBtnLogin');
    const themeSwitchBtnPanel = document.getElementById('themeSwitchBtnPanel');
    const body = document.body;

    // ELEMEN TAB TAMBAH PRODUK
    const categorySelect = document.getElementById('category');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const whatsappInput = document.getElementById('product-whatsapp');
    const descriptionInput = document.getElementById('product-description');
    const scriptMenuSection = document.getElementById('scriptMenuSection');
    const scriptMenuContentInput = document.getElementById('script-menu-content');
    const stockPhotoSection = document.getElementById('stock-photo-section');
    const photosInput = document.getElementById('product-photos');
    const addButton = document.getElementById('add-product-button');
    
    // ELEMEN TAB KELOLA PRODUK
    const manageCategorySelect = document.getElementById('manage-category');
    const manageProductList = document.getElementById('manage-product-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const bulkEditSections = document.getElementById('bulk-edit-sections');
    const bulkPriceInput = document.getElementById('bulk-price-input');
    const applyBulkPriceBtn = document.getElementById('apply-bulk-price-btn');
    const bulkWhatsappInput = document.getElementById('bulk-whatsapp-input');
    const applyBulkWhatsappBtn = document.getElementById('apply-bulk-whatsapp-btn');
    const selectedCategoryName = document.getElementById('selected-category-name');
    const applyGlobalBulkWhatsappBtn = document.getElementById('apply-global-bulk-whatsapp-btn');

    // ELEMEN MODAL
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;
    const editModal = document.getElementById('editProductModal');

    // ELEMEN TAB KELOLA DOMAIN & API
    const generateApiKeyBtn = document.getElementById('generate-api-key-btn');
    const apiKeyList = document.getElementById('api-key-list');
    const addDomainBtn = document.getElementById('add-domain-btn');
    const domainList = document.getElementById('domain-list');
    const subdomainList = document.getElementById('subdomain-list');
    const apiKeyResultModal = document.getElementById('apiKeyResultModal');
    const closeApiKeyModal = document.getElementById('closeApiKeyModal');
    const apiKeyResultDiv = document.getElementById('apiKeyResult');

    // KONFIGURASI
    const API_BASE_URL = '/api';
    let activeToastTimeout = null;

    // --- FUNGSI-FUNGSI PEMBANTU ---
    function showToast(message, type = 'info', duration = 3000) {
        if (activeToastTimeout) clearTimeout(activeToastTimeout);
        toastContainer.innerHTML = '';
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

    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        customConfirmModal.classList.add('is-visible');
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    }

    confirmOkBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) resolveConfirmPromise(true);
    });

    confirmCancelBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) resolveConfirmPromise(false);
    });

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE_URL}/admin${endpoint}`, options);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        return result;
    }

    // --- LOGIKA UTAMA ---

    // Tema & Login
    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
    body.className = savedTheme;
    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        if(themeSwitchBtnLogin) themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
    }
    updateThemeButton();
    function toggleTheme() {
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');
        localStorage.setItem('admin-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        updateThemeButton();
    }
    if(themeSwitchBtnLogin) themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) themeSwitchBtnPanel.addEventListener('click', toggleTheme);
    
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    const handleLogin = async () => {
        const password = passwordInput.value;
        if (!password) return showToast('Password tidak boleh kosong.', 'error');
        loginButton.textContent = 'Memverifikasi...';
        loginButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            loginScreen.style.display = 'none';
            productFormScreen.style.display = 'block';
            showToast('Login berhasil!', 'success');
        } catch (e) {
            showToast(e.message || 'Password salah.', 'error');
        } finally {
            loginButton.textContent = 'Masuk';
            loginButton.disabled = false;
        }
    };
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleLogin();
    });

    // Navigasi Tab
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            
            if (button.dataset.tab === 'manageProducts' && manageCategorySelect.value) {
                manageCategorySelect.dispatchEvent(new Event('change'));
            } else if (button.dataset.tab === 'manageDomains') {
                loadApiKeys();
                loadDomains();
                loadSubdomains();
            }
        });
    });

    // Logika Tab Tambah Produk
    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        stockPhotoSection.style.display = (category === 'Stock Akun' || category === 'Logo') ? 'block' : 'none';
        scriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
    });

    addButton.addEventListener('click', async () => {
        const whatsappNumber = whatsappInput.value.trim();
        if (whatsappNumber && !/^\d+$/.test(whatsappNumber)) {
            return showToast('Format nomor WhatsApp salah. Harus berupa angka saja.', 'error');
        }

        const productData = {
            category: categorySelect.value,
            nama: nameInput.value.trim(),
            harga: parseInt(priceInput.value, 10),
            nomorWA: whatsappNumber,
            deskripsiPanjang: descriptionInput.value.trim(),
            images: photosInput.value.split(',').map(l => l.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            menuContent: scriptMenuContentInput.value.trim()
        };

        if (!productData.nama || isNaN(productData.harga) || !productData.deskripsiPanjang) {
            return showToast('Nama, Harga, dan Deskripsi wajib diisi.', 'error');
        }
        
        addButton.textContent = 'Memproses...';
        addButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/addProduct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast(`Produk "${productData.nama}" berhasil ditambahkan.`, 'success');
            document.getElementById('addProductForm').reset();
            categorySelect.dispatchEvent(new Event('change'));
        } catch (err) {
            showToast(err.message || 'Gagal menambahkan produk.', 'error');
        } finally {
            addButton.textContent = 'Tambah Produk';
            addButton.disabled = false;
        }
    });

    // Logika Tab Kelola Produk
    manageCategorySelect.addEventListener('change', async () => {
        manageProductList.innerHTML = 'Memuat...';
        const category = manageCategorySelect.value;
        selectedCategoryName.textContent = category;
        if (!category) {
            manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
            saveOrderButton.style.display = 'none';
            bulkEditSections.style.display = 'none';
            return;
        }
        try {
            const res = await fetch(`/products.json?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`Gagal memuat produk`);
            const data = await res.json();
            const productsInCat = data[category] || [];
            if (productsInCat.length === 0) {
                manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
                saveOrderButton.style.display = 'none';
                bulkEditSections.style.display = 'none';
                return;
            }
            renderManageList(productsInCat, category);
            saveOrderButton.style.display = 'block';
            bulkEditSections.style.display = 'block';
        } catch (err) {
            showToast(err.message, 'error');
            manageProductList.innerHTML = `<p>Gagal memuat produk.</p>`;
        }
    });

    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            
            const priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
            const waDisplay = prod.nomorWA ? `<span style="font-size:0.8em; color:green; margin-left:8px;"><i class="fab fa-whatsapp"></i> ${prod.nomorWA}</span>` : '';

            item.innerHTML = `
                <div class="item-header">
                    <span>${prod.nama} - ${priceDisplay}${waDisplay}</span>
                    <div class="item-actions">
                        <button type="button" class="edit-btn" data-id="${prod.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="delete-btn" data-id="${prod.id}"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>
                </div>`;
            manageProductList.appendChild(item);
        });
        setupManageActions(category, productsToRender);
    }
    
    function setupManageActions(category, productsInCat) {
        manageProductList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = productsInCat.find(p => p.id === parseInt(btn.dataset.id));
                if (!product) return;
                
                document.getElementById('edit-product-id').value = product.id;
                document.getElementById('edit-product-category').value = category;
                document.getElementById('editModalTitle').textContent = `Edit: ${product.nama}`;
                document.getElementById('edit-name').value = product.nama;
                document.getElementById('edit-price').value = product.harga;
                document.getElementById('edit-whatsapp').value = product.nomorWA || '';
                document.getElementById('edit-desc').value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                editModal.classList.add('is-visible');
            });
        });

        document.getElementById('save-edit-btn').onclick = async () => {
            const newWhatsapp = document.getElementById('edit-whatsapp').value.trim();
             if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
                return showToast('Format nomor WhatsApp salah.', 'error');
            }

            const updatedData = {
                id: parseInt(document.getElementById('edit-product-id').value),
                category: document.getElementById('edit-product-category').value,
                newName: document.getElementById('edit-name').value.trim(),
                newPrice: parseInt(document.getElementById('edit-price').value, 10),
                newWhatsapp: newWhatsapp,
                newDesc: document.getElementById('edit-desc').value.trim().replace(/\n/g, ' || '),
            };

            const saveBtn = document.getElementById('save-edit-btn');
            saveBtn.textContent = 'Menyimpan...';
            saveBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/updateProduct`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showToast('Produk berhasil diperbarui.', 'success');
                editModal.classList.remove('is-visible');
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                saveBtn.textContent = 'Simpan Perubahan';
                saveBtn.disabled = false;
            }
        };

        applyBulkWhatsappBtn.onclick = async () => {
            const newWhatsapp = bulkWhatsappInput.value.trim();
            if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
                return showToast('Format nomor WhatsApp salah.', 'error');
            }
            if (!await showCustomConfirm(`Yakin ubah No. WA semua produk di kategori "<b>${category}</b>"?`)) return;

            applyBulkWhatsappBtn.disabled = true;
            try {
                 const res = await fetch(`${API_BASE_URL}/updateBulkWhatsapp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, newWhatsapp: newWhatsapp || null })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showToast(result.message, 'success');
                bulkWhatsappInput.value = '';
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                applyBulkWhatsappBtn.disabled = false;
            }
        };
    }

    applyGlobalBulkWhatsappBtn.addEventListener('click', async () => {
        const newWhatsapp = document.getElementById('global-bulk-whatsapp-input').value.trim();
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
            return showToast('Format nomor WhatsApp salah.', 'error');
        }
        const confirmMsg = `Anda YAKIN ingin mengubah No. WA untuk **SEMUA PRODUK** menjadi "${newWhatsapp || '(dihapus)'}"? Tindakan ini tidak dapat diurungkan.`;
        if (!await showCustomConfirm(confirmMsg)) return showToast('Tindakan dibatalkan.', 'info');

        showToast('Memproses perubahan global...', 'info');
        applyGlobalBulkWhatsappBtn.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/updateAllProductsWhatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newWhatsapp: newWhatsapp || null })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast(result.message, 'success');
            document.getElementById('global-bulk-whatsapp-input').value = '';
            if (manageCategorySelect.value) {
                manageCategorySelect.dispatchEvent(new Event('change'));
            }
        } catch (err) {
            showToast(`Gagal: ${err.message}`, 'error');
        } finally {
            applyGlobalBulkWhatsappBtn.disabled = false;
        }
    });

    // Logika Tab Kelola Domain & API
    async function loadApiKeys() {
        apiKeyList.innerHTML = 'Memuat...';
        try {
            const { keys } = await apiRequest('/apiKeys');
            apiKeyList.innerHTML = keys.length ? keys.map(key => `
                <div class="api-key-item">
                    <span><b>${key.identifier}</b>: <code>${key.key}</code></span>
                    <small>Expires: ${new Date(key.expiresAt).toLocaleString('id-ID')}</small>
                    <button class="delete-api-key-btn" data-key="${key.key}">&times;</button>
                </div>`).join('') : '<p>Belum ada API Key.</p>';
        } catch (error) {
            apiKeyList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function loadDomains() {
        domainList.innerHTML = 'Memuat...';
        try {
            const { domains } = await apiRequest('/domains');
            const domainNames = Object.keys(domains);
            domainList.innerHTML = domainNames.length ? domainNames.map(d => `
                <div class="domain-item">
                    <span>${d}</span>
                    <button class="delete-domain-btn" data-domain="${d}">&times;</button>
                </div>`).join('') : '<p>Belum ada domain ditambahkan.</p>';
        } catch (error) {
            domainList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }
    
    async function loadSubdomains() {
        subdomainList.innerHTML = 'Memuat...';
        try {
            const { subdomains } = await apiRequest('/subdomains');
            subdomainList.innerHTML = subdomains.length ? subdomains.map(s => `
                <div class="subdomain-item">
                    <span><b>${s.full_domain}</b> -> ${s.ip}</span>
                    <small>Dibuat pada: ${new Date(s.createdAt).toLocaleString('id-ID')}</small>
                </div>`).join('') : '<p>Belum ada subdomain yang dibuat.</p>';
        } catch(e) {
             subdomainList.innerHTML = `<p class="error">${e.message}</p>`;
        }
    }

    generateApiKeyBtn.addEventListener('click', async () => {
        const identifier = document.getElementById('api-user-identifier').value.trim();
        const duration = parseInt(document.getElementById('api-duration').value, 10);
        if (!identifier || isNaN(duration) || duration <= 0) {
            return showToast('Identifier dan masa aktif (hari) harus diisi.', 'error');
        }
        try {
            const result = await apiRequest('/apiKeys', 'POST', { identifier, duration });
            apiKeyResultDiv.innerHTML = `
                <p><strong>Identifier:</strong> ${result.identifier}</p>
                <p><strong>API Key:</strong> <code>${result.key}</code></p>
                <p><strong>Berlaku sampai:</strong> ${new Date(result.expiresAt).toLocaleString('id-ID')}</p>`;
            apiKeyResultModal.classList.add('is-visible');
            loadApiKeys();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    closeApiKeyModal.addEventListener('click', () => apiKeyResultModal.classList.remove('is-visible'));
    
    addDomainBtn.addEventListener('click', async () => {
        const domain = document.getElementById('domain-name').value.trim();
        const zoneId = document.getElementById('domain-zone-id').value.trim();
        const apiToken = document.getElementById('domain-api-token').value.trim();
        if (!domain || !zoneId || !apiToken) return showToast('Semua field domain wajib diisi.', 'error');
        try {
            await apiRequest('/domains', 'POST', { domain, zoneId, apiToken });
            showToast('Domain berhasil ditambahkan.', 'success');
            loadDomains();
            document.getElementById('domain-manager-form').reset();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    apiKeyList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-api-key-btn')) {
            const key = e.target.dataset.key;
            if (await showCustomConfirm('Yakin ingin menghapus API Key ini?')) {
                try {
                    await apiRequest('/apiKeys', 'DELETE', { key });
                    showToast('API Key berhasil dihapus.', 'success');
                    loadApiKeys();
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        }
    });
    
    domainList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-domain-btn')) {
            const domain = e.target.dataset.domain;
            if (await showCustomConfirm(`Yakin ingin menghapus domain <b>${domain}</b>?`)) {
                try {
                    await apiRequest('/domains', 'DELETE', { domain });
                    showToast('Domain berhasil dihapus.', 'success');
                    loadDomains();
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        }
    });

    // Inisialisasi
    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
    }
});
