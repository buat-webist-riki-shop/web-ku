document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const productFormScreen = document.getElementById('product-form-screen');
    const toastContainer = document.getElementById('toast-container');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const passwordToggle = document.getElementById('passwordToggle');
    const themeSwitchBtnLogin = document.getElementById('themeSwitchBtnLogin');
    const themeSwitchBtnPanel = document.getElementById('themeSwitchBtnPanel');
    const body = document.body;
    const categorySelect = document.getElementById('category');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const descriptionInput = document.getElementById('product-description');
    const productWhatsappNumberInput = document.getElementById('product-whatsapp-number');
    const scriptMenuSection = document.getElementById('scriptMenuSection');
    const scriptMenuContentInput = document.getElementById('script-menu-content');
    const stockPhotoSection = document.getElementById('stock-photo-section');
    const photosInput = document.getElementById('product-photos');
    const addButton = document.getElementById('add-product-button');
    const manageCategorySelect = document.getElementById('manage-category');
    const manageProductList = document.getElementById('manage-product-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const bulkPriceEditContainer = document.getElementById('bulk-price-edit-container');
    const bulkPriceInput = document.getElementById('bulk-price-input');
    const applyBulkPriceBtn = document.getElementById('apply-bulk-price-btn');
    const resetPricesBtn = document.getElementById('reset-prices-btn');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const globalWhatsappNumberInput = document.getElementById('global-whatsapp-number');
    const categoryWhatsappNumbersContainer = document.getElementById('category-whatsapp-numbers-container');
    const editModal = document.getElementById('editProductModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editProductId = document.getElementById('edit-product-id');
    const editProductCategory = document.getElementById('edit-product-category');
    const editNameInput = document.getElementById('edit-name');
    const editPriceInput = document.getElementById('edit-price');
    const editDiscountPriceInput = document.getElementById('edit-discount-price');
    const editDiscountDateInput = document.getElementById('edit-discount-date');
    const editDescInput = document.getElementById('edit-desc');
    const editWhatsappNumberInput = document.getElementById('edit-whatsapp-number');
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;
    const API_BASE_URL = '/api';
    let activeToastTimeout = null;

    function showToast(message, type = 'info', duration = 4000) {
        if (activeToastTimeout) clearTimeout(activeToastTimeout);
        toastContainer.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
        toastContainer.appendChild(toast);
        activeToastTimeout = setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }

    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        customConfirmModal.classList.add('is-visible');
        return new Promise(resolve => { resolveConfirmPromise = resolve; });
    }

    function validatePhoneNumber(number) {
        if (!number) return true;
        const phoneRegex = /^62\d{9,15}$/;
        return phoneRegex.test(number);
    }

    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
    body.className = savedTheme;
    updateThemeButton();
    themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) themeSwitchBtnPanel.addEventListener('click', toggleTheme);

    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
    }
    function toggleTheme() {
        body.classList.toggle('dark-mode');
        localStorage.setItem('admin-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        updateThemeButton();
    }

    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
    async function handleLogin() {
        const password = passwordInput.value;
        if (!password) return showToast('Password tidak boleh kosong.', 'error');
        loginButton.textContent = 'Memverifikasi...';
        loginButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            loginScreen.style.display = 'none';
            productFormScreen.style.display = 'block';
            showToast('Login berhasil!', 'success');
            await loadSettings();
            document.querySelector('.tab-button[data-tab="addProduct"]').click();
        } catch (e) {
            showToast(e.message || 'Password salah.', 'error');
        } finally {
            loginButton.textContent = 'Masuk';
            loginButton.disabled = false;
        }
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        stockPhotoSection.style.display = ['Stock Akun', 'Logo'].includes(category) ? 'block' : 'none';
        scriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
    });

    addButton.addEventListener('click', async () => {
        const waNumber = productWhatsappNumberInput.value.trim();
        if (waNumber && !validatePhoneNumber(waNumber)) {
            return showToast('Format Nomor WA salah. Contoh: 628123456789', 'error');
        }
        const productData = {
            category: categorySelect.value,
            nama: nameInput.value.trim(),
            harga: parseInt(priceInput.value, 10),
            hargaAsli: parseInt(priceInput.value, 10),
            deskripsiPanjang: descriptionInput.value.trim().replace(/\n/g, ' || '),
            images: photosInput.value.split(',').map(l => l.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            nomorWA: waNumber,
            discountPrice: null,
            discountEndDate: null,
        };
        if (productData.category === 'Script') {
            productData.menuContent = scriptMenuContentInput.value.trim();
        }
        if (!productData.nama || isNaN(productData.harga) || productData.harga <= 0) {
            return showToast('Nama dan Harga Asli wajib diisi dengan valid.', 'error');
        }
        addButton.textContent = 'Memproses...';
        addButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/addProduct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
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

    manageCategorySelect.addEventListener('change', async () => {
        const category = manageCategorySelect.value;
        manageProductList.innerHTML = category ? 'Memuat...' : '<p>Pilih kategori untuk dikelola.</p>';
        saveOrderButton.style.display = 'none';
        bulkPriceEditContainer.style.display = 'none';
        if (!category) return;

        try {
            const res = await fetch(`/products.json?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`Gagal memuat produk.`);
            const data = await res.json();
            const productsInCat = data[category] || [];
            if (productsInCat.length === 0) {
                manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
            } else {
                renderManageList(productsInCat, category);
                saveOrderButton.style.display = 'block';
                bulkPriceEditContainer.style.display = 'flex';
            }
        } catch (err) {
            showToast(err.message, 'error');
            manageProductList.innerHTML = `<p>${err.message}</p>`;
        }
    });

    function renderManageList(products, category) {
        manageProductList.innerHTML = '';
        products.forEach(prod => {
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            item.innerHTML = `
                <div class="item-header">
                    <span>${prod.nama}</span>
                    <div class="item-actions">
                        <button type="button" class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="delete-btn"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>
                </div>`;
            manageProductList.appendChild(item);
        });
        setupManageActions(category, products);
    }

    function setupManageActions(category, products) {
        manageProductList.querySelectorAll('.delete-btn, .edit-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const parent = e.target.closest('.delete-item');
                const id = parseInt(parent.dataset.id);
                if (btn.classList.contains('delete-btn')) {
                    if (!await showCustomConfirm(`Yakin ingin menghapus produk ini?`)) return;
                    showToast('Menghapus...', 'info');
                    // ... fetch delete
                } else {
                    const product = products.find(p => p.id === id);
                    if (!product) return showToast('Produk tidak ditemukan.', 'error');
                    editProductId.value = product.id;
                    editProductCategory.value = category;
                    document.getElementById('editModalTitle').textContent = `Edit: ${product.nama}`;
                    editNameInput.value = product.nama;
                    editPriceInput.value = product.hargaAsli || product.harga;
                    editDescInput.value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                    editWhatsappNumberInput.value = product.nomorWA || '';
                    editDiscountPriceInput.value = product.discountPrice || '';
                    editDiscountDateInput.value = product.discountEndDate ? product.discountEndDate.slice(0, 16) : '';
                    editModal.classList.add('is-visible');
                }
            });
        });
    }
    
    saveEditBtn.addEventListener('click', async () => {
        const newWaNumber = editWhatsappNumberInput.value.trim();
        if (newWaNumber && !validatePhoneNumber(newWaNumber)) {
            return showToast('Format Nomor WA salah. Contoh: 628123456789', 'error');
        }
        const discountPrice = editDiscountPriceInput.value ? parseFloat(editDiscountPriceInput.value) : null;
        const price = parseFloat(editPriceInput.value);

        const updatedData = {
            id: parseInt(editProductId.value),
            category: editProductCategory.value,
            newName: editNameInput.value.trim(),
            hargaAsli: price,
            harga: (discountPrice && discountPrice < price) ? discountPrice : price,
            newDesc: editDescInput.value.trim().replace(/\n/g, ' || '),
            nomorWA: newWaNumber,
            discountPrice: discountPrice,
            discountEndDate: editDiscountDateInput.value ? new Date(editDiscountDateInput.value).toISOString() : null,
        };

        saveEditBtn.textContent = 'Menyimpan...';
        saveEditBtn.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/updateProduct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
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
    
    resetPricesBtn.addEventListener('click', async () => {
        const category = manageCategorySelect.value;
        if (!category) return;
        if (!await showCustomConfirm(`Yakin ingin mengembalikan semua harga di kategori <strong>${category}</strong> ke harga awal?`)) return;
        
        resetPricesBtn.disabled = true;
        showToast('Memproses...', 'info');
        try {
            const res = await fetch(`${API_BASE_URL}/resetCategoryPrices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast(result.message, 'success');
            manageCategorySelect.dispatchEvent(new Event('change'));
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            resetPricesBtn.disabled = false;
        }
    });

    async function loadSettings() {
        try {
            const res = await fetch(`${API_BASE_URL}/getSettings`);
            if (!res.ok) throw new Error('Gagal memuat pengaturan.');
            const settings = await res.json();
            globalWhatsappNumberInput.value = settings.globalPhoneNumber || '';
            const categories = [...manageCategorySelect.options].filter(opt => opt.value).map(opt => opt.value);
            categoryWhatsappNumbersContainer.innerHTML = '<h3><i class="fas fa-list-alt"></i> Nomor WA per Kategori (Opsional)</h3>';
            categories.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-wa-input';
                div.innerHTML = `<label for="wa-${cat}">${cat}:</label><input type="text" id="wa-${cat}" data-category="${cat}" value="${settings.categoryPhoneNumbers[cat] || ''}" placeholder="Gunakan nomor global">`;
                categoryWhatsappNumbersContainer.appendChild(div);
            });
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    saveSettingsButton.addEventListener('click', async () => {
        const globalNumber = globalWhatsappNumberInput.value.trim();
        if (!validatePhoneNumber(globalNumber)) return showToast('Format Nomor WA Global salah. Contoh: 628123456789', 'error');
        
        const categoryNumbers = {};
        let isValid = true;
        categoryWhatsappNumbersContainer.querySelectorAll('input').forEach(input => {
            const num = input.value.trim();
            if (num && !validatePhoneNumber(num)) {
                showToast(`Format nomor untuk ${input.dataset.category} salah.`, 'error');
                isValid = false;
            }
            categoryNumbers[input.dataset.category] = num;
        });
        if (!isValid) return;

        saveSettingsButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/updateSettings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ globalPhoneNumber: globalNumber, categoryPhoneNumbers }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast('Pengaturan disimpan!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            saveSettingsButton.disabled = false;
        }
    });

    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        loadSettings();
    }
    confirmCancelBtn.addEventListener('click', () => { customConfirmModal.classList.remove('is-visible'); if (resolveConfirmPromise) resolveConfirmPromise(false); });
    confirmOkBtn.addEventListener('click', () => { customConfirmModal.classList.remove('is-visible'); if (resolveConfirmPromise) resolveConfirmPromise(true); });
    closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('is-visible'));
});
