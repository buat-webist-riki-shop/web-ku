document.addEventListener('DOMContentLoaded', () => {
    // ... (deklarasi variabel elemen tetap sama seperti sebelumnya) ...
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
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;
    const saveSettingsButton = document.getElementById('save-settings-button');
    const globalWhatsappNumberInput = document.getElementById('global-whatsapp-number');
    const categoryWhatsappNumbersContainer = document.getElementById('category-whatsapp-numbers-container');
    const editWhatsappNumberInput = document.getElementById('edit-whatsapp-number');
    const resetPricesBtn = document.getElementById('reset-prices-btn');

    // CHANGED: Alamat API sekarang hanya satu untuk semua produk
    const API_PRODUCTS_URL = '/api/products';
    const API_BASE_URL = '/api'; // Tetap untuk login, settings, dll
    let activeToastTimeout = null;
    let siteSettings = {};

    // ... (fungsi tema, toast, confirm, validatePhoneNumber, dan login tetap sama) ...
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
        if (body.classList.contains('light-mode')) {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('admin-theme', 'dark-mode');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('admin-theme', 'light-mode');
        }
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

    function validatePhoneNumber(number) {
        if (!number) return true;
        const phoneRegex = /^[1-9]\d*$/;
        return phoneRegex.test(number);
    }

    const handleLogin = async () => {
        const password = passwordInput.value;
        if (!password) {
            showToast('Password tidak boleh kosong.', 'error');
            return;
        }
        loginButton.textContent = 'Memverifikasi...';
        loginButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            loginScreen.style.display = 'none';
            productFormScreen.style.display = 'block';
            showToast('Login berhasil!', 'success');
            await loadSettings();
            document.querySelector('.tab-button[data-tab="addProduct"]').click();
        } catch (e) {
            console.error('Login error:', e);
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

    // --- ADD PRODUCT (CHANGED) ---
    addButton.addEventListener('click', async (e) => { 
        e.preventDefault(); 
        const waNumber = productWhatsappNumberInput.value.trim();
        if (!validatePhoneNumber(waNumber)) {
            return showToast("Format Nomor WA salah. Harus diawali kode negara (contoh: 628...)", 'error');
        }

        const productData = {
            category: categorySelect.value,
            nama: nameInput.value.trim(),
            harga: parseInt(priceInput.value, 10),
            deskripsiPanjang: descriptionInput.value.trim(),
            images: photosInput.value.split(',').map(l => l.trim()).filter(Boolean),
            nomorWA: waNumber,
            menuContent: scriptMenuContentInput.value.trim()
        };

        if (!productData.nama || isNaN(productData.harga) || productData.harga < 0 || !productData.deskripsiPanjang) {
            return showToast('Semua kolom wajib diisi dan harga harus angka positif.', 'error');
        }
        
        addButton.textContent = 'Memproses...';
        addButton.disabled = true;
        try {
            const res = await fetch(API_PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addProduct', data: productData })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            showToast(`Produk "${productData.nama}" berhasil ditambahkan.`, 'success');
            // Reset form
            nameInput.value = '';
            priceInput.value = '';
            descriptionInput.value = '';
            photosInput.value = '';
            scriptMenuContentInput.value = '';
            productWhatsappNumberInput.value = '';
            categorySelect.value = 'Panel'; 
            categorySelect.dispatchEvent(new Event('change'));
        } catch (err) {
            console.error('Error adding product:', err);
            showToast(err.message || 'Gagal menambahkan produk.', 'error');
        } finally {
            addButton.textContent = 'Tambah Produk';
            addButton.disabled = false;
        }
    });

    // ... (fungsi navigasi tab tetap sama) ...
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            if (button.dataset.tab === 'manageProducts') {
                const currentCategory = manageCategorySelect.value;
                if (currentCategory) { 
                    manageCategorySelect.dispatchEvent(new Event('change'));
                } else {
                    manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
                    saveOrderButton.style.display = 'none';
                    bulkPriceEditContainer.style.display = 'none'; 
                }
            }
        });
    });


    // ... (fungsi manageCategorySelect.addEventListener tetap sama) ...
    manageCategorySelect.addEventListener('change', async () => {
        manageProductList.innerHTML = 'Memuat...';
        const category = manageCategorySelect.value;
        if (!category) {
            manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
            saveOrderButton.style.display = 'none';
            bulkPriceEditContainer.style.display = 'none';
            return;
        }
        try {
            const timestamp = new Date().getTime();
            const res = await fetch(`/products.json?v=${timestamp}`);
            if (!res.ok) {
                const errorText = await res.text(); 
                throw new Error(`Gagal memuat produk: Status ${res.status}. Detail: ${errorText.substring(0, 100)}...`);
            }
            const data = await res.json(); 
            const productsInCat = data[category] || [];
            if (productsInCat.length === 0) {
                manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
                saveOrderButton.style.display = 'none';
                bulkPriceEditContainer.style.display = 'none';
                return;
            }
            renderManageList(productsInCat, category);
            saveOrderButton.style.display = 'block';
            bulkPriceEditContainer.style.display = 'flex'; 
        } catch (err) {
            console.error("Error loading products for management:", err); 
            showToast(err.message || 'Gagal memuat produk. Periksa konsol browser untuk detail.', 'error');
            manageProductList.innerHTML = `<p>Gagal memuat produk. ${err.message || ''}</p>`;
            saveOrderButton.style.display = 'none';
            bulkPriceEditContainer.style.display = 'none';
        }
    });

    // ... (fungsi renderManageList dan formatRupiah tetap sama) ...
    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const isNew = prod.createdAt && Date.now() - new Date(prod.createdAt).getTime() < 24 * 60 * 60 * 1000;
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            
            let priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
            if (prod.hargaAsli && prod.hargaAsli > prod.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(prod.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(prod.harga)}</span>`;
            } else if (prod.hargaAsli) {
                priceDisplay = `<span>${formatRupiah(prod.hargaAsli)}</span>`;
            }
            
            item.innerHTML = `
                <div class="item-header">
                    <span>${prod.nama} - ${priceDisplay} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</span>
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
        // --- DELETE PRODUCT (CHANGED) ---
        manageProductList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.preventDefault();
                const parent = e.target.closest('.delete-item');
                const id = parseInt(parent.dataset.id);
                const confirmMessageHtml = `Apakah Anda yakin ingin menghapus produk <b>${parent.querySelector('.item-header span').textContent.split(' - ')[0]}</b>?`;
                const userConfirmed = await showCustomConfirm(confirmMessageHtml);

                if (!userConfirmed) return showToast('Penghapusan dibatalkan.', 'info');

                showToast('Menghapus produk...', 'info', 5000);
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'deleteProduct', data: { id, category } })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    
                    parent.remove();
                    showToast(result.message, 'success');
                } catch (err) {
                    console.error('Error deleting product:', err);
                    showToast(err.message || 'Gagal menghapus produk.', 'error');
                }
            });
        });

        // --- EDIT PRODUCT SETUP (tidak berubah) ---
        const editModal = document.getElementById('editProductModal');
        // ... (semua deklarasi variabel untuk modal edit tetap sama) ...
        const closeEditModalBtn = document.getElementById('closeEditModal');
        const editModalTitle = document.getElementById('editModalTitle');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const editProductId = document.getElementById('edit-product-id');
        const editProductCategory = document.getElementById('edit-product-category');
        const editNameInput = document.getElementById('edit-name');
        const editPriceInput = document.getElementById('edit-price');
        const editDiscountPriceInput = document.getElementById('edit-discount-price');
        const editDiscountDateInput = document.getElementById('edit-discount-date');
        const editDescInput = document.getElementById('edit-desc');
        const editPhotoSection = document.getElementById('edit-photo-section');
        const editPhotoGrid = document.getElementById('edit-photo-grid');
        const addPhotoInput = document.getElementById('add-photo-input');
        const addPhotoBtn = document.getElementById('add-photo-btn');
        const editScriptMenuSection = document.getElementById('edit-script-menu-section');
        const editScriptMenuContent = document.getElementById('edit-script-menu-content');


        manageProductList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = parseInt(e.target.closest('.edit-btn').dataset.id);
                const product = productsInCat.find(p => p.id === productId);
                if (!product) {
                    showToast('Produk tidak ditemukan.', 'error');
                    return;
                }
                
                editProductId.value = product.id;
                editProductCategory.value = category;
                editModalTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Produk: ${product.nama}`;
                editNameInput.value = product.nama;
                editPriceInput.value = product.hargaAsli || product.harga;
                editDiscountPriceInput.value = product.discountPrice || '';
                editDiscountDateInput.value = product.discountEndDate ? product.discountEndDate.slice(0, 16) : '';
                editDescInput.value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                editWhatsappNumberInput.value = product.nomorWA || '';
                
                editPhotoSection.style.display = (category === 'Stock Akun' || category === 'Logo') ? 'block' : 'none';
                if (category === 'Stock Akun' || category === 'Logo') {
                    editPhotoGrid.innerHTML = '';
                    (product.images || []).forEach(img => {
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `<img src="${img}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                        editPhotoGrid.appendChild(photoItem);
                        photoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => e_photo.target.closest('.photo-item').remove());
                    });
                }
                
                editScriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
                if (category === 'Script') {
                    editScriptMenuContent.value = product.menuContent || '';
                }
                
                editModal.classList.add('is-visible');
            });
        });

        closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('is-visible'));
        window.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.remove('is-visible'); });
        
        addPhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newPhotoUrl = addPhotoInput.value.trim();
            if (newPhotoUrl) {
                const newPhotoItem = document.createElement('div');
                newPhotoItem.className = 'photo-item';
                newPhotoItem.innerHTML = `<img src="${newPhotoUrl}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                editPhotoGrid.appendChild(newPhotoItem);
                newPhotoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => e_photo.target.closest('.photo-item').remove());
                addPhotoInput.value = '';
            } else {
                showToast('URL foto tidak boleh kosong.', 'error');
            }
        });

        // --- SAVE EDITED PRODUCT (CHANGED) ---
        saveEditBtn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            const newWaNumber = editWhatsappNumberInput.value.trim();
            if (!validatePhoneNumber(newWaNumber)) {
                return showToast("Format Nomor WA salah. Harus diawali kode negara (contoh: 628...)", 'error');
            }

            const hargaAsli = parseInt(editPriceInput.value, 10);
            const discountPrice = editDiscountPriceInput.value ? parseInt(editDiscountPriceInput.value, 10) : null;
            const discountEndDate = editDiscountDateInput.value ? new Date(editDiscountDateInput.value).toISOString() : null;

            let harga = hargaAsli;
            if (discountPrice !== null && discountPrice > 0 && discountEndDate && new Date(discountEndDate) > new Date()) {
                harga = discountPrice;
            }

            const productData = {
                id: parseInt(editProductId.value),
                category: editProductCategory.value,
                newName: editNameInput.value.trim(),
                hargaAsli,
                harga,
                discountPrice,
                discountEndDate,
                newDesc: editDescInput.value.trim().replace(/\n/g, ' || '),
                newImages: [...editPhotoGrid.querySelectorAll('.photo-item img')].map(img => img.src),
                newMenuContent: editScriptMenuContent.value.trim(),
                nomorWA: newWaNumber
            };

            if (isNaN(productData.hargaAsli) || productData.hargaAsli < 0 || !productData.newName || !productData.newDesc) {
                return showToast('Data tidak valid (Nama, Harga Asli, Deskripsi harus diisi).', 'error');
            }
            
            saveEditBtn.textContent = 'Menyimpan...';
            saveEditBtn.disabled = true;

            try {
                const res = await fetch(API_PRODUCTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'updateProduct', data: productData })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                
                showToast('Produk berhasil diperbarui.', 'success');
                editModal.classList.remove('is-visible'); 
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                console.error('Error updating product:', err);
                showToast(err.message || 'Gagal memperbarui produk.', 'error');
            } finally {
                saveEditBtn.textContent = 'Simpan Perubahan';
                saveEditBtn.disabled = false;
            }
        });
        
        // --- DRAG AND DROP (tidak berubah) ---
        let draggingItem = null;
        manageProductList.addEventListener('dragstart', (e) => {
            draggingItem = e.target.closest('.delete-item');
            if (draggingItem) setTimeout(() => draggingItem.classList.add('dragging'), 0);
        });
        manageProductList.addEventListener('dragend', () => {
            if (draggingItem) {
                draggingItem.classList.remove('dragging');
                draggingItem = null;
            }
        });
        manageProductList.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            const afterElement = getDragAfterElement(manageProductList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                 if (afterElement == null) manageProductList.appendChild(draggable);
                 else manageProductList.insertBefore(draggable, afterElement);
            }
        });

        // --- SAVE ORDER (CHANGED) ---
        saveOrderButton.addEventListener('click', async (e) => {
            e.preventDefault(); 
            const newOrder = [...manageProductList.children].map(item => parseInt(item.dataset.id));
            const category = manageCategorySelect.value;
            if (!category || newOrder.length === 0) {
                return showToast('Pilih kategori dan pastikan ada produk untuk diurutkan.', 'error');
            }

            showToast('Menyimpan urutan...', 'info', 5000);
            saveOrderButton.disabled = true;
            try {
                const res = await fetch(API_PRODUCTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reorderProducts', data: { category, order: newOrder } })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);

                showToast('Urutan berhasil disimpan.', 'success');
            } catch (err) {
                console.error('Error saving order:', err);
                showToast(err.message || 'Gagal menyimpan urutan.', 'error');
            } finally {
                saveOrderButton.disabled = false;
            }
        });

        // --- BULK PRICE UPDATE (CHANGED) ---
        applyBulkPriceBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = manageCategorySelect.value;
            const newBulkPrice = parseInt(bulkPriceInput.value, 10);

            if (!category) return showToast('Pilih kategori terlebih dahulu.', 'error');
            if (isNaN(newBulkPrice) || newBulkPrice < 0) return showToast('Harga massal tidak valid.', 'error');

            const confirmMessageHtml = `Yakin ingin mengubah harga SEMUA produk di "<b>${category}</b>" menjadi <b>${formatRupiah(newBulkPrice)}</b>?`;
            const userConfirmed = await showCustomConfirm(confirmMessageHtml);
            
            if (!userConfirmed) return showToast('Pembaruan dibatalkan.', 'info');

            showToast(`Menerapkan harga massal...`, 'info', 5000);
            applyBulkPriceBtn.disabled = true;

            try {
                const res = await fetch(API_PRODUCTS_URL, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'updateProductsInCategory', data: { category, newPrice: newBulkPrice } })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message || await res.text());
                
                showToast(result.message, 'success');
                bulkPriceInput.value = ''; 
                manageCategorySelect.dispatchEvent(new Event('change')); 
            } catch (err) {
                console.error('Error applying bulk price:', err);
                showToast(`Gagal: ${err.message}`, 'error');
            } finally {
                applyBulkPriceBtn.disabled = false;
            }
        });
        
        // --- RESET PRICES (CHANGED) ---
        resetPricesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = manageCategorySelect.value;
            if (!category) return showToast('Pilih kategori terlebih dahulu.', 'error');

            const confirmMessageHtml = `Yakin ingin mengembalikan harga SEMUA produk di "<b>${category}</b>" ke harga awal?`;
            const userConfirmed = await showCustomConfirm(confirmMessageHtml);

            if (!userConfirmed) return showToast('Aksi dibatalkan.', 'info');

            showToast(`Mengembalikan harga...`, 'info', 5000);
            resetPricesBtn.disabled = true;

            try {
                const res = await fetch(API_PRODUCTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'resetCategoryPrices', data: { category } })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                
                showToast(result.message, 'success');
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                console.error('Error resetting prices:', err);
                showToast(`Gagal: ${err.message}`, 'error');
            } finally {
                resetPricesBtn.disabled = false;
            }
        });
    }
    
    // ... (fungsi getDragAfterElement tetap sama) ...
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.delete-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ... (fungsi loadSettings dan saveSettingsButton.addEventListener tetap sama) ...
    async function loadSettings() {
        try {
            const res = await fetch(`${API_BASE_URL}/getSettings`);
            if (!res.ok) throw new Error('Gagal memuat pengaturan. Pastikan file settings.json ada.');
            siteSettings = await res.json();
            
            globalWhatsappNumberInput.value = siteSettings.globalPhoneNumber || '';
            categoryWhatsappNumbersContainer.innerHTML = '<h3><i class="fas fa-list-alt"></i> Nomor WA per Kategori (Opsional)</h3>';
            const categoriesInSettings = siteSettings.categoryPhoneNumbers || {};
            const allCategories = [...manageCategorySelect.options].filter(opt => opt.value).map(opt => opt.value);
            
            allCategories.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-wa-input';
                div.innerHTML = `
                    <label for="wa-${cat}">${cat}:</label>
                    <input type="text" id="wa-${cat}" data-category="${cat}" value="${categoriesInSettings[cat] || ''}" placeholder="Kosongkan untuk pakai nomor global">
                `;
                categoryWhatsappNumbersContainer.appendChild(div);
            });
        } catch (err) {
            showToast(err.message, 'error', 5000);
            console.error('Error loading settings:', err);
        }
    }

    saveSettingsButton.addEventListener('click', async () => {
        const globalNumber = globalWhatsappNumberInput.value.trim();
        if (!validatePhoneNumber(globalNumber)) {
            return showToast("Format Nomor WA Global salah. Harus diawali kode negara (contoh: 628...)", 'error');
        }
        if (!globalNumber) {
            return showToast('Nomor WA Global wajib diisi.', 'error');
        }

        const categoryNumbers = {};
        let isCategoryValid = true;
        categoryWhatsappNumbersContainer.querySelectorAll('input[data-category]').forEach(input => {
            const cat = input.dataset.category;
            const num = input.value.trim();
            if (num && !validatePhoneNumber(num)) {
                showToast(`Format Nomor WA untuk kategori ${cat} salah. Harus diawali kode negara.`, 'error');
                isCategoryValid = false;
            }
            categoryNumbers[cat] = num;
        });

        if (!isCategoryValid) return;

        saveSettingsButton.textContent = 'Menyimpan...';
        saveSettingsButton.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/updateSettings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    globalPhoneNumber: globalNumber,
                    categoryPhoneNumbers: categoryNumbers
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            showToast('Pengaturan berhasil disimpan!', 'success');
            await loadSettings();
        } catch (err) {
            showToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
        } finally {
            saveSettingsButton.textContent = 'Simpan Pengaturan';
            saveSettingsButton.disabled = false;
        }
    });


    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        loadSettings();
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
    }
});