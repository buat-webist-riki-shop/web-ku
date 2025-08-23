document.addEventListener('DOMContentLoaded', () => {
    // ... (kode dari awal sampai const API_BASE_URL) ...
    const loginScreen = document.getElementById('login-screen');
    const productFormScreen = document.getElementById('product-form-screen');
    const toastContainer = document.getElementById('toast-container');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const passwordToggle = document.getElementById('passwordToggle');
    const themeSwitchBtnLogin = document.getElementById('themeSwitchBtnLogin');
    const themeSwitchBtnPanel = document.getElementById('themeSwitchBtnPanel');
    const body = document.body;
    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
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
        body.classList.toggle('light-mode');
        body.classList.toggle('dark-mode');
        localStorage.setItem('admin-theme', body.className);
        updateThemeButton();
    }
    themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) {
        themeSwitchBtnPanel.addEventListener('click', toggleTheme);
    }
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    // Tambah Produk
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

    // Kelola Produk
    const manageCategorySelect = document.getElementById('manage-category');
    const manageProductList = document.getElementById('manage-product-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const bulkEditSections = document.getElementById('bulk-edit-sections');
    const bulkPriceInput = document.getElementById('bulk-price-input');
    const applyBulkPriceBtn = document.getElementById('apply-bulk-price-btn');
    const bulkWhatsappInput = document.getElementById('bulk-whatsapp-input');
    const applyBulkWhatsappBtn = document.getElementById('apply-bulk-whatsapp-btn');

    // Modal Konfirmasi
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;

    // Kelola Domain & API
    const generateApiKeyBtn = document.getElementById('generate-api-key-btn');
    const apiKeyList = document.getElementById('api-key-list');
    const addDomainBtn = document.getElementById('add-domain-btn');
    const domainList = document.getElementById('domain-list');
    const subdomainList = document.getElementById('subdomain-list');
    const apiKeyResultModal = document.getElementById('apiKeyResultModal');
    const closeApiKeyModal = document.getElementById('closeApiKeyModal');
    const apiKeyResultDiv = document.getElementById('apiKeyResult');

    const API_BASE_URL = '/api';
    let activeToastTimeout = null;

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
    
    customConfirmModal.addEventListener('click', (e) => {
        if (e.target === customConfirmModal) confirmCancelBtn.click();
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
            document.querySelector('.tab-button[data-tab="addProduct"]').click();
        } catch (e) {
            showToast(e.message || 'Password salah.', 'error');
        } finally {
            loginButton.textContent = 'Masuk';
            loginButton.disabled = false;
        }
    };
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    });

    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        stockPhotoSection.style.display = (category === 'Stock Akun' || category === 'Logo') ? 'block' : 'none';
        scriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
    });


    addButton.addEventListener('click', async (e) => {
        e.preventDefault();
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
            createdAt: new Date().toISOString()
        };
        if (productData.category === 'Script') {
            productData.menuContent = scriptMenuContentInput.value.trim();
        }

        if (!productData.nama || isNaN(productData.harga) || productData.harga < 0 || !productData.deskripsiPanjang) {
            return showToast('Semua kolom wajib diisi dan harga harus valid.', 'error');
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
            // Reset form
            [nameInput, priceInput, whatsappInput, descriptionInput, photosInput, scriptMenuContentInput].forEach(input => input.value = '');
            categorySelect.value = 'Panel';
            categorySelect.dispatchEvent(new Event('change'));
        } catch (err) {
            showToast(err.message || 'Gagal menambahkan produk.', 'error');
        } finally {
            addButton.textContent = 'Tambah Produk';
            addButton.disabled = false;
        }
    });

    // Logika tab
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const activeTab = document.getElementById(button.dataset.tab);
            activeTab.classList.add('active');
            
            if (button.dataset.tab === 'manageProducts') {
                manageCategorySelect.value ? manageCategorySelect.dispatchEvent(new Event('change')) : manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
            } else if (button.dataset.tab === 'manageDomains') {
                loadApiKeys();
                loadDomains();
                loadSubdomains();
            }
        });
    });
    
    // Kelola Produk
    manageCategorySelect.addEventListener('change', async () => {
        manageProductList.innerHTML = 'Memuat...';
        const category = manageCategorySelect.value;
        if (!category) {
            manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
            saveOrderButton.style.display = 'none';
            bulkEditSections.style.display = 'none';
            return;
        }
        try {
            const res = await fetch(`/products.json?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`Gagal memuat produk: Status ${res.status}`);
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
            showToast(err.message || 'Gagal memuat produk.', 'error');
            manageProductList.innerHTML = `<p>Gagal memuat produk. ${err.message || ''}</p>`;
        }
    });

    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            
            let priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
            if (prod.hargaAsli && prod.hargaAsli > prod.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(prod.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(prod.harga)}</span>`;
            }
            
            const waDisplay = prod.nomorWA ? `<span class="wa-badge"><i class="fab fa-whatsapp"></i> ${prod.nomorWA}</span>` : '';

            item.innerHTML = `
                <div class="item-header">
                    <span>${prod.nama} - ${priceDisplay} ${waDisplay}</span>
                    <div class="item-actions">
                        <button type="button" class="edit-btn" data-id="${prod.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="delete-btn"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>
                </div>
            `;
            manageProductList.appendChild(item);
        });

        setupManageActions(category, productsToRender);
    }
    
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    function setupManageActions(category, productsInCat) {
        manageProductList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const parent = e.target.closest('.delete-item');
                const id = parseInt(parent.dataset.id);
                const productName = parent.querySelector('.item-header span').textContent.split(' - ')[0];
                const userConfirmed = await showCustomConfirm(`Yakin ingin menghapus <b>${productName}</b>?`);

                if (!userConfirmed) return showToast('Penghapusan dibatalkan.', 'info');

                showToast('Menghapus produk...', 'info');
                try {
                    const res = await fetch(`${API_BASE_URL}/deleteProduct`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, category })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    parent.remove();
                    showToast(result.message, 'success');
                } catch (err) {
                    showToast(err.message || 'Gagal menghapus produk.', 'error');
                }
            });
        });

        // Logika Modal Edit
        const editModal = document.getElementById('editProductModal');
        const closeEditModalBtn = document.getElementById('closeEditModal');
        const editModalTitle = document.getElementById('editModalTitle');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const editProductId = document.getElementById('edit-product-id');
        const editProductCategory = document.getElementById('edit-product-category');
        const editNameInput = document.getElementById('edit-name');
        const editPriceInput = document.getElementById('edit-price');
        const editWhatsappInput = document.getElementById('edit-whatsapp');
        const editDescInput = document.getElementById('edit-desc');
        // ... (sisa elemen modal edit)
        
        manageProductList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('.edit-btn').dataset.id);
                const product = productsInCat.find(p => p.id === productId);
                if (!product) return showToast('Produk tidak ditemukan.', 'error');
                
                editProductId.value = product.id;
                editProductCategory.value = category;
                editModalTitle.innerHTML = `<i class="fas fa-edit"></i> Edit: ${product.nama}`;
                editNameInput.value = product.nama;
                editPriceInput.value = product.harga;
                editWhatsappInput.value = product.nomorWA || '';
                editDescInput.value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                
                // ... (logika untuk foto dan script)
                
                editModal.classList.add('is-visible');
            });
        });

        closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('is-visible'));
        window.addEventListener('click', e => {
            if (e.target === editModal) editModal.classList.remove('is-visible');
        });
        
        saveEditBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const newWhatsapp = editWhatsappInput.value.trim();
            if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
                return showToast('Format nomor WhatsApp salah. Harus berupa angka saja.', 'error');
            }
            
            const updatedData = {
                id: parseInt(editProductId.value),
                category: editProductCategory.value,
                newName: editNameInput.value.trim(),
                newPrice: parseInt(editPriceInput.value, 10),
                newWhatsapp: newWhatsapp,
                newDesc: editDescInput.value.trim().replace(/\n/g, ' || '),
                // ... (logika untuk foto dan script)
            };

            if (isNaN(updatedData.newPrice) || updatedData.newPrice < 0 || !updatedData.newName || !updatedData.newDesc) {
                return showToast('Data tidak valid.', 'error');
            }
            
            saveEditBtn.textContent = 'Menyimpan...';
            saveEditBtn.disabled = true;

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
                showToast(err.message || 'Gagal memperbarui produk.', 'error');
            } finally {
                saveEditBtn.textContent = 'Simpan Perubahan';
                saveEditBtn.disabled = false;
            }
        });
        
        // ... (Logika drag & drop tidak diubah)

        // Simpan Urutan
        saveOrderButton.addEventListener('click', async (e) => {
             // ... (Logika Simpan Urutan tidak diubah)
        });

        // Edit Harga Massal
        applyBulkPriceBtn.addEventListener('click', async (e) => {
             // ... (Logika Harga Massal tidak diubah, tapi panggil endpoint yang benar)
             // Pastikan endpoint yang dipanggil adalah `/api/updateProductsInCategory`
        });

        // --- BARU: Logika Edit WhatsApp Massal ---
        applyBulkWhatsappBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = manageCategorySelect.value;
            const newWhatsapp = bulkWhatsappInput.value.trim();

            if (!category) return showToast('Pilih kategori terlebih dahulu.', 'error');
            if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
                return showToast('Format nomor WhatsApp salah. Harus berupa angka saja.', 'error');
            }

            const confirmMsg = newWhatsapp 
                ? `Yakin ingin mengubah No. WA semua produk di "<b>${category}</b>" menjadi <b>${newWhatsapp}</b>?`
                : `Yakin ingin menghapus No. WA dari semua produk di "<b>${category}</b>"?`;
            
            if (!await showCustomConfirm(confirmMsg)) return showToast('Pembaruan dibatalkan.', 'info');

            showToast(`Menerapkan No. WA untuk kategori "${category}"...`, 'info');
            applyBulkWhatsappBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/updateBulkWhatsapp`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, newWhatsapp: newWhatsapp || null }) // Kirim null jika kosong
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showToast(result.message, 'success');
                bulkWhatsappInput.value = ''; 
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(`Gagal menerapkan No. WA massal: ${err.message}`, 'error');
            } finally {
                applyBulkWhatsappBtn.disabled = false;
            }
        });
    }

    // --- BARU: Logika Kelola Domain & API ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_BASE_URL}/admin${endpoint}`, options);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        return result;
    }

    async function loadApiKeys() {
        apiKeyList.innerHTML = 'Memuat...';
        try {
            const { keys } = await apiRequest('/apiKeys');
            if (keys.length === 0) {
                apiKeyList.innerHTML = '<p>Belum ada API Key.</p>';
                return;
            }
            apiKeyList.innerHTML = keys.map(key => `
                <div class="api-key-item">
                    <span><b>${key.identifier}</b>: <code>${key.key}</code></span>
                    <small>Expires: ${new Date(key.expiresAt).toLocaleString('id-ID')}</small>
                    <button class="delete-api-key-btn" data-key="${key.key}">&times;</button>
                </div>
            `).join('');
        } catch (error) {
            apiKeyList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function loadDomains() {
        domainList.innerHTML = 'Memuat...';
        try {
            const { domains } = await apiRequest('/domains');
            const domainNames = Object.keys(domains);
             if (domainNames.length === 0) {
                domainList.innerHTML = '<p>Belum ada domain ditambahkan.</p>';
                return;
            }
            domainList.innerHTML = domainNames.map(d => `
                <div class="domain-item">
                    <span>${d}</span>
                    <button class="delete-domain-btn" data-domain="${d}">&times;</button>
                </div>
            `).join('');
        } catch (error) {
            domainList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }
    
    async function loadSubdomains() {
        subdomainList.innerHTML = 'Memuat...';
        try {
            const { subdomains } = await apiRequest('/subdomains');
            if (subdomains.length === 0) {
                subdomainList.innerHTML = '<p>Belum ada subdomain yang dibuat.</p>';
                return;
            }
            subdomainList.innerHTML = subdomains.map(s => `
                <div class="subdomain-item">
                    <span><b>${s.full_domain}</b> -> ${s.ip}</span>
                    <small>Dibuat pada: ${new Date(s.createdAt).toLocaleString('id-ID')}</small>
                </div>
            `).join('');
        } catch(e) {
             subdomainList.innerHTML = `<p class="error">${e.message}</p>`;
        }
    }


    generateApiKeyBtn.addEventListener('click', async () => {
        const identifier = document.getElementById('api-user-identifier').value.trim();
        const duration = parseInt(document.getElementById('api-duration').value, 10);
        if (!identifier || isNaN(duration) || duration <= 0) {
            return showToast('Identifier dan masa aktif (hari) harus diisi dengan benar.', 'error');
        }
        try {
            const result = await apiRequest('/apiKeys', 'POST', { identifier, duration });
            apiKeyResultDiv.innerHTML = `
                <p><strong>Identifier:</strong> ${result.identifier}</p>
                <p><strong>API Key:</strong> <code>${result.key}</code></p>
                <p><strong>Berlaku sampai:</strong> ${new Date(result.expiresAt).toLocaleString('id-ID')}</p>
            `;
            apiKeyResultModal.classList.add('is-visible');
            loadApiKeys();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    closeApiKeyModal.addEventListener('click', () => apiKeyResultModal.classList.remove('is-visible'));

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

    addDomainBtn.addEventListener('click', async () => {
        const domain = document.getElementById('domain-name').value.trim();
        const zoneId = document.getElementById('domain-zone-id').value.trim();
        const apiToken = document.getElementById('domain-api-token').value.trim();
        if (!domain || !zoneId || !apiToken) {
            return showToast('Semua field domain wajib diisi.', 'error');
        }
        try {
            await apiRequest('/domains', 'POST', { domain, zoneId, apiToken });
            showToast('Domain berhasil ditambahkan.', 'success');
            loadDomains();
            // Clear inputs
            document.getElementById('domain-name').value = '';
            document.getElementById('domain-zone-id').value = '';
            document.getElementById('domain-api-token').value = '';
        } catch (error) {
            showToast(error.message, 'error');
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

    // Cek status login saat halaman dimuat
    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
    }
});
