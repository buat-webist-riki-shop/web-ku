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
    
    // Toggle Password Visibility
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    const categorySelect = document.getElementById('category');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const descriptionInput = document.getElementById('product-description');
    const scriptMenuSection = document.getElementById('scriptMenuSection');
    const scriptMenuContentInput = document.getElementById('script-menu-content');
    const stockPhotoSection = document.getElementById('stock-photo-section');
    const photosInput = document.getElementById('product-photos');
    const addButton = document.getElementById('add-product-button');

    const manageCategorySelect = document.getElementById('manage-category');
    const manageProductList = document.getElementById('manage-product-list');
    const saveOrderButton = document.getElementById('save-order-button');

    // Elemen untuk fitur edit harga massal
    const bulkPriceEditContainer = document.getElementById('bulk-price-edit-container');
    const bulkPriceInput = document.getElementById('bulk-price-input');
    const applyBulkPriceBtn = document.getElementById('apply-bulk-price-btn');
    const resetBulkPriceBtn = document.getElementById('reset-bulk-price-btn'); // Tombol baru

    // Elemen untuk Custom Confirmation Modal
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise; // Untuk menyimpan resolve dari Promise konfirmasi

    // Elemen untuk Kelola Domain & API Keys
    const addDomainCategoryForm = document.getElementById('addDomainCategoryForm');
    const domainCategoryNameInput = document.getElementById('domain-category-name');
    const domainCategoryZoneInput = document.getElementById('domain-category-zone');
    const domainCategoryApiTokenInput = document.getElementById('domain-category-apitoken');
    const domainCategoryListDiv = document.getElementById('domain-category-list');

    const createApiKeyForm = document.getElementById('createApiKeyForm');
    const apiKeyNameInput = document.getElementById('api-key-name');
    const apiKeyDurationSelect = document.getElementById('api-key-duration');
    const apiKeyListDiv = document.getElementById('api-key-list');


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

    // Fungsi untuk menampilkan modal konfirmasi kustom
    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        customConfirmModal.classList.add('is-visible');
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    }

    // Event listener untuk tombol OK di modal konfirmasi kustom
    confirmOkBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) {
            resolveConfirmPromise(true);
            resolveConfirmPromise = null;
        }
    });

    // Event listener untuk tombol Batal di modal konfirmasi kustom
    confirmCancelBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-visible');
        if (resolveConfirmPromise) {
            resolveConfirmPromise(false);
            resolveConfirmPromise = null;
        }
    });

    // Tutup modal konfirmasi jika klik di luar area konten
    customConfirmModal.addEventListener('click', (e) => {
        if (e.target === customConfirmModal) {
            customConfirmModal.classList.remove('is-visible');
            if (resolveConfirmPromise) {
                resolveConfirmPromise(false);
                resolveConfirmPromise = null;
            }
        }
    });


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


    addButton.addEventListener('click', async (e) => { 
        e.preventDefault(); 
        const productData = {
            category: categorySelect.value,
            nama: nameInput.value.trim(),
            harga: parseInt(priceInput.value, 10),
            deskripsiPanjang: descriptionInput.value.trim(),
            images: photosInput.value.split(',').map(l => l.trim()).filter(Boolean),
            createdAt: new Date().toISOString()
        };
        if (productData.category === 'Script') {
            productData.menuContent = scriptMenuContentInput.value.trim();
        }

        if (!productData.nama || isNaN(productData.harga) || productData.harga < 0 || !productData.deskripsiPanjang) {
            return showToast('Semua kolom wajib diisi dan harga harus angka positif.', 'error');
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
            if (!res.ok) {
                throw new Error(result.message);
            }
            showToast(`Produk "${productData.nama}" berhasil ditambahkan.`, 'success');
            // Langsung perbarui daftar kelola produk jika tab aktif
            if (document.getElementById('manageProducts').classList.contains('active')) {
                // Trigger reload produk untuk kategori yang sama
                if (manageCategorySelect.value === productData.category) {
                    manageCategorySelect.dispatchEvent(new Event('change'));
                }
            }
            // Kosongkan form setelah berhasil
            nameInput.value = '';
            priceInput.value = '';
            descriptionInput.value = '';
            photosInput.value = '';
            scriptMenuContentInput.value = '';
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

    // Logika tab
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
            } else if (button.dataset.tab === 'manageDomains') {
                loadApiKeys();
                loadDomainCategories();
            }
        });
    });

    // Kelola Produk (sekarang berada di tab)
    manageCategorySelect.addEventListener('change', async () => {
        manageProductList.innerHTML = 'Memuat...';
        const category = manageCategorySelect.value;
        if (!category) {
            manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
            saveOrderButton.style.display = 'none';
            bulkPriceEditContainer.style.display = 'none';
            resetBulkPriceBtn.style.display = 'none'; // Sembunyikan juga tombol reset
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
                resetBulkPriceBtn.style.display = 'none';
                return;
            }
            renderManageList(productsInCat, category);
            saveOrderButton.style.display = 'block';
            bulkPriceEditContainer.style.display = 'flex'; 

            // Tampilkan tombol reset jika ada setidaknya satu produk yang memiliki hargaAsli
            const hasOriginalPrice = productsInCat.some(p => p.hargaAsli !== undefined);
            resetBulkPriceBtn.style.display = hasOriginalPrice ? 'block' : 'none';

        } catch (err) {
            console.error("Error loading products for management:", err); 
            showToast(err.message || 'Gagal memuat produk. Periksa konsol browser untuk detail.', 'error');
            manageProductList.innerHTML = `<p>Gagal memuat produk. ${err.message || ''}</p>`;
            saveOrderButton.style.display = 'none';
            bulkPriceEditContainer.style.display = 'none';
            resetBulkPriceBtn.style.display = 'none';
        }
    });

    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const isNew = prod.createdAt && Date.now() - new Date(prod.createdAt).getTime() < 24 * 60 * 60 * 1000;
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            
            let priceDisplay = `<span class="product-price-list">${formatRupiah(prod.harga)}</span>`;
            if (prod.hargaAsli && prod.hargaAsli > prod.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(prod.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(prod.harga)}</span>`;
            } else if (prod.hargaAsli !== undefined) { // Jika ada hargaAsli tapi sama dengan harga sekarang (sudah direset)
                priceDisplay = `<span>${formatRupiah(prod.harga)}</span> <span class="original-price">(Awal: ${formatRupiah(prod.hargaAsli)})</span>`;
            } else {
                priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
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
    
    // Helper function untuk format rupiah
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    function setupManageActions(category, productsInCat) {
        // Hapus Produk
        manageProductList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.preventDefault(); 
                const parent = e.target.closest('.delete-item');
                const id = parseInt(parent.dataset.id);
                
                const confirmMessageHtml = `Apakah Anda yakin ingin menghapus produk <b>${parent.querySelector('.item-header span').textContent.split(' - ')[0]}</b>?`;
                const userConfirmed = await showCustomConfirm(confirmMessageHtml);

                if (!userConfirmed) {
                    showToast('Penghapusan dibatalkan.', 'info');
                    return;
                }

                showToast('Menghapus produk...', 'info', 5000); 
                try {
                    const res = await fetch(`${API_BASE_URL}/deleteProduct`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, category: category })
                    });
                    const result = await res.json();
                    if (!res.ok) {
                        throw new Error(result.message);
                    }
                    // Hapus dari UI langsung
                    parent.remove(); 
                    showToast(result.message, 'success');
                    // Perbarui hitungan jika perlu
                    if (manageProductList.children.length === 0) {
                        manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
                        saveOrderButton.style.display = 'none';
                        bulkPriceEditContainer.style.display = 'none';
                        resetBulkPriceBtn.style.display = 'none';
                    }
                } catch (err) {
                    console.error('Error deleting product:', err);
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
        const editDescInput = document.getElementById('edit-desc');
        const editPhotoSection = document.getElementById('edit-photo-section');
        const editPhotoGrid = document.getElementById('edit-photo-grid');
        const addPhotoInput = document.getElementById('add-photo-input');
        const addPhotoBtn = document.getElementById('add-photo-btn');
        const editScriptMenuSection = document.getElementById('edit-script-menu-section');
        const editScriptMenuContent = document.getElementById('edit-script-menu-content');
        
        // Buka Modal
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
                editPriceInput.value = product.harga;
                editDescInput.value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                
                if (category === 'Stock Akun' || category === 'Logo') {
                    editPhotoSection.style.display = 'block';
                    editPhotoGrid.innerHTML = '';
                    (product.images || []).forEach(img => {
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `<img src="${img}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                        editPhotoGrid.appendChild(photoItem);
                        photoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => {
                            e_photo.stopPropagation(); 
                            e_photo.target.closest('.photo-item').remove();
                        });
                    });
                } else {
                    editPhotoSection.style.display = 'none';
                }
                
                if (category === 'Script') {
                    editScriptMenuSection.style.display = 'block';
                    editScriptMenuContent.value = product.menuContent || '';
                } else {
                    editScriptMenuSection.style.display = 'none';
                }
                
                editModal.classList.add('is-visible');
            });
        });

        // Tutup Modal
        closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('is-visible'));
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.remove('is-visible');
            }
        });
        
        // Tambah Foto dari Modal
        addPhotoBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            const newPhotoUrl = addPhotoInput.value.trim();
            if (newPhotoUrl) {
                const newPhotoItem = document.createElement('div');
                newPhotoItem.className = 'photo-item';
                newPhotoItem.innerHTML = `<img src="${newPhotoUrl}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                editPhotoGrid.appendChild(newPhotoItem);
                newPhotoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => {
                    e_photo.stopPropagation(); 
                    e_photo.target.closest('.photo-item').remove();
                });
                addPhotoInput.value = '';
            } else {
                showToast('URL foto tidak boleh kosong.', 'error');
            }
        });

        // Simpan Perubahan dari Modal
        saveEditBtn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            const id = parseInt(editProductId.value);
            const categoryToUpdate = editProductCategory.value;
            const newName = editNameInput.value.trim();
            const newPrice = parseInt(editPriceInput.value, 10);
            const newDesc = editDescInput.value.trim().replace(/\n/g, ' || ');
            
            let newImages = null;
            if (categoryToUpdate === 'Stock Akun' || categoryToUpdate === 'Logo') {
                newImages = [...editPhotoGrid.querySelectorAll('.photo-item img')].map(img => img.src);
            }
            
            let newMenuContent = null;
            if (categoryToUpdate === 'Script') {
                newMenuContent = editScriptMenuContent.value.trim();
            }

            if (isNaN(newPrice) || newPrice < 0 || !newName || !newDesc) {
                return showToast('Data tidak valid (Nama, Harga, Deskripsi harus diisi dan harga harus angka positif).', 'error');
            }
            
            saveEditBtn.textContent = 'Menyimpan...';
            saveEditBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/updateProduct`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, category: categoryToUpdate, newName, newPrice, newDesc, newImages, newMenuContent })
                });
                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message);
                }
                showToast('Produk berhasil diperbarui.', 'success');
                editModal.classList.remove('is-visible'); 
                // Perbarui item di UI tanpa reload seluruh daftar
                const updatedProduct = result.product;
                const itemToUpdate = manageProductList.querySelector(`.delete-item[data-id="${updatedProduct.id}"]`);
                if (itemToUpdate) {
                    let priceDisplay = `<span class="product-price-list">${formatRupiah(updatedProduct.harga)}</span>`;
                    if (updatedProduct.hargaAsli && updatedProduct.hargaAsli > updatedProduct.harga) {
                        priceDisplay = `<span class="original-price"><del>${formatRupiah(updatedProduct.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(updatedProduct.harga)}</span>`;
                    } else if (updatedProduct.hargaAsli !== undefined) {
                        priceDisplay = `<span>${formatRupiah(updatedProduct.harga)}</span> <span class="original-price">(Awal: ${formatRupiah(updatedProduct.hargaAsli)})</span>`;
                    } else {
                        priceDisplay = `<span>${formatRupiah(updatedProduct.harga)}</span>`;
                    }

                    // Buat elemen span sementara untuk menampung HTML baru
                    const tempSpan = document.createElement('span');
                    tempSpan.innerHTML = `${updatedProduct.nama} - ${priceDisplay}`;
                    
                    // Ganti konten item yang relevan
                    itemToUpdate.querySelector('.item-header span').innerHTML = tempSpan.innerHTML;
                }
            } catch (err) {
                console.error('Error updating product:', err);
                showToast(err.message || 'Gagal memperbarui produk.', 'error');
            } finally {
                saveEditBtn.textContent = 'Simpan Perubahan';
                saveEditBtn.disabled = false;
            }
        });
        
        // Geser Produk
        let draggingItem = null;
        let autoScrollAnimationFrame = null; 
        const SCROLL_SPEED = 25; // Kecepatan scroll ditingkatkan lagi
        const SCROLL_AREA_HEIGHT = 150; // Tinggi area pemicu scroll ditingkatkan lagi

        function scrollManageProductList(direction) {
            if (direction === 'up') {
                manageProductList.scrollTop -= SCROLL_SPEED;
            } else if (direction === 'down') {
                manageProductList.scrollTop += SCROLL_SPEED;
            }
            if (autoScrollAnimationFrame) {
                const containerRect = manageProductList.getBoundingClientRect();
                const currentMouseY = lastDragoverY; 
                
                const isInScrollArea = (currentMouseY < containerRect.top + SCROLL_AREA_HEIGHT && direction === 'up') ||
                                       (currentMouseY > containerRect.bottom - SCROLL_AREA_HEIGHT && direction === 'down');

                if (isInScrollArea) {
                    autoScrollAnimationFrame = requestAnimationFrame(() => scrollManageProductList(direction));
                } else {
                    cancelAnimationFrame(autoScrollAnimationFrame);
                    autoScrollAnimationFrame = null;
                }
            }
        }

        let lastDragoverY = 0; 

        manageProductList.addEventListener('dragstart', (e) => {
            draggingItem = e.target.closest('.delete-item');
            if (draggingItem) {
                setTimeout(() => draggingItem.classList.add('dragging'), 0);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', draggingItem.innerHTML);
            }
        });

        manageProductList.addEventListener('dragend', () => {
            if (draggingItem) {
                draggingItem.classList.remove('dragging');
                draggingItem = null;
            }
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
            }
        });
        
        manageProductList.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            lastDragoverY = e.clientY; 

            const afterElement = getDragAfterElement(manageProductList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (!draggable || draggable === afterElement) return;

            if (afterElement == null) {
                manageProductList.appendChild(draggable);
            } else {
                manageProductList.insertBefore(draggable, afterElement);
            }

            const containerRect = manageProductList.getBoundingClientRect();
            const mouseY = e.clientY;

            if (!autoScrollAnimationFrame) {
                if (mouseY < containerRect.top + SCROLL_AREA_HEIGHT) {
                    autoScrollAnimationFrame = requestAnimationFrame(() => scrollManageProductList('up'));
                } else if (mouseY > containerRect.bottom - SCROLL_AREA_HEIGHT) {
                    autoScrollAnimationFrame = requestAnimationFrame(() => scrollManageProductList('down'));
                }
            } else {
                const currentDirection = mouseY < containerRect.top + SCROLL_AREA_HEIGHT ? 'up' : 
                                         (mouseY > containerRect.bottom - SCROLL_AREA_HEIGHT ? 'down' : null);
                
                if (currentDirection !== getCurrentScrollDirection() && currentDirection !== null) {
                    cancelAnimationFrame(autoScrollAnimationFrame);
                    autoScrollAnimationFrame = null; 
                    autoScrollAnimationFrame = requestAnimationFrame(() => scrollManageProductList(currentDirection));
                } else if (currentDirection === null) {
                    cancelAnimationFrame(autoScrollAnimationFrame);
                    autoScrollAnimationFrame = null;
                }
            }
        });

        function getCurrentScrollDirection() {
            if (!autoScrollAnimationFrame) return null;
            const containerRect = manageProductList.getBoundingClientRect();
            if (lastDragoverY < containerRect.top + SCROLL_AREA_HEIGHT) return 'up';
            if (lastDragoverY > containerRect.bottom - SCROLL_AREA_HEIGHT) return 'down';
            return null;
        }


        manageProductList.addEventListener('dragleave', () => {
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
            }
            manageProductList.classList.remove('drag-over');
        });

        manageProductList.addEventListener('dragenter', (e) => {
            e.preventDefault();
            manageProductList.classList.add('drag-over');
        });
        
        manageProductList.addEventListener('drop', (e) => {
            e.preventDefault(); 
            manageProductList.classList.remove('drag-over');
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
            }
        });


        saveOrderButton.addEventListener('click', async (e) => {
            e.preventDefault(); 
            const newOrder = [...manageProductList.children].map(item => parseInt(item.dataset.id));
            const category = manageCategorySelect.value;
            if (!category) {
                return showToast('Pilih kategori terlebih dahulu.', 'error');
            }
            if (newOrder.length === 0) {
                return showToast('Tidak ada produk untuk diurutkan.', 'error');
            }

            showToast('Menyimpan urutan...', 'info', 5000);
            saveOrderButton.disabled = true;
            try {
                const res = await fetch(`${API_BASE_URL}/reorderProducts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, order: newOrder })
                });
                const result = await res.json();
                if (!res.ok) {
                    throw new Error(result.message);
                }
                showToast('Urutan berhasil disimpan.', 'success');
                // Tidak perlu dispatchEvent('change') karena UI sudah terbarui oleh drag/drop
                // Cukup pastikan state internal sudah sesuai jika ada
            } catch (err) {
                console.error('Error saving order:', err);
                showToast(err.message || 'Gagal menyimpan urutan.', 'error');
            } finally {
                saveOrderButton.disabled = false;
            }
        });

        // --- Logika Fitur Edit Harga Massal ---
        applyBulkPriceBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = manageCategorySelect.value;
            const newBulkPrice = parseInt(bulkPriceInput.value, 10);

            if (!category) {
                return showToast('Pilih kategori terlebih dahulu untuk menerapkan harga massal.', 'error');
            }
            if (isNaN(newBulkPrice) || newBulkPrice < 0) {
                return showToast('Harga massal tidak valid. Masukkan angka positif.', 'error');
            }

            const confirmMessageHtml = `Apakah Anda yakin ingin mengubah harga SEMUA produk di kategori "<b>${category}</b>" menjadi <b>${formatRupiah(newBulkPrice)}</b>? Ini akan menyimpan harga saat ini sebagai harga asli.`;
            const userConfirmed = await showCustomConfirm(confirmMessageHtml);
            
            if (!userConfirmed) {
                showToast('Pembaruan harga massal dibatalkan.', 'info');
                return; 
            }

            showToast(`Menerapkan harga massal untuk kategori "${category}"...`, 'info', 5000);
            applyBulkPriceBtn.disabled = true;
            resetBulkPriceBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/updateProduct`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, newPrice: newBulkPrice })
                });
                const result = await res.json();

                if (!res.ok) {
                    const errorDetail = result.message || await res.text();
                    throw new Error(errorDetail);
                }
                showToast(result.message, 'success');
                bulkPriceInput.value = ''; 
                manageCategorySelect.dispatchEvent(new Event('change')); // Reload daftar untuk update UI
            } catch (err) {
                console.error('Error applying bulk price:', err);
                showToast(`Gagal menerapkan harga massal. Detail: ${err.message || 'Terjadi kesalahan tidak dikenal.'}`, 'error');
            } finally {
                applyBulkPriceBtn.disabled = false;
                resetBulkPriceBtn.disabled = false;
            }
        });

        // --- Logika Fitur Kembalikan Harga Awal ---
        resetBulkPriceBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = manageCategorySelect.value;

            if (!category) {
                return showToast('Pilih kategori terlebih dahulu untuk mengembalikan harga.', 'error');
            }

            const confirmMessageHtml = `Apakah Anda yakin ingin mengembalikan harga SEMUA produk di kategori "<b>${category}</b>" ke harga semula?`;
            const userConfirmed = await showCustomConfirm(confirmMessageHtml);

            if (!userConfirmed) {
                showToast('Pengembalian harga dibatalkan.', 'info');
                return;
            }

            showToast(`Mengembalikan harga produk di kategori "${category}"...`, 'info', 5000);
            applyBulkPriceBtn.disabled = true;
            resetBulkPriceBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/resetBulkPriceInCategory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category })
                });
                const result = await res.json();

                if (!res.ok) {
                    const errorDetail = result.message || await res.text();
                    throw new Error(errorDetail);
                }
                showToast(result.message, 'success');
                manageCategorySelect.dispatchEvent(new Event('change')); // Reload daftar untuk update UI
            } catch (err) {
                console.error('Error resetting bulk price:', err);
                showToast(`Gagal mengembalikan harga awal. Detail: ${err.message || 'Terjadi kesalahan tidak dikenal.'}`, 'error');
            } finally {
                applyBulkPriceBtn.disabled = false;
                resetBulkPriceBtn.disabled = false;
            }
        });
    }
    
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

    // --- Logika Manajemen API Keys ---
    async function loadApiKeys() {
        apiKeyListDiv.innerHTML = '<p>Memuat API Keys...</p>';
        try {
            const res = await fetch(`${API_BASE_URL}/apikeys`);
            if (!res.ok) throw new Error(`Gagal memuat API Keys: Status ${res.status}`);
            const apiKeys = await res.json();
            renderApiKeys(apiKeys);
        } catch (error) {
            console.error('Error loading API Keys:', error);
            showToast(error.message || 'Gagal memuat API Keys.', 'error');
            apiKeyListDiv.innerHTML = `<p>Gagal memuat API Keys. ${error.message || ''}</p>`;
        }
    }

    function renderApiKeys(apiKeys) {
        apiKeyListDiv.innerHTML = '';
        if (apiKeys.length === 0) {
            apiKeyListDiv.innerHTML = '<p>Tidak ada API Key yang dibuat.</p>';
            return;
        }
        apiKeys.forEach(key => {
            const item = document.createElement('div');
            item.className = 'key-item';
            item.dataset.key = key.key;

            const expiryText = key.expiryDate ? `Berakhir: ${new Date(key.expiryDate).toLocaleDateString('id-ID')}` : 'Permanen';

            item.innerHTML = `
                <div class="key-display"><b>${key.name}</b>: ${key.key}</div>
                <div class="key-meta">Durasi: ${key.duration} | ${expiryText}</div>
                <div class="item-actions">
                    <button type="button" class="copy-btn" data-key="${key.key}"><i class="fas fa-copy"></i> Salin</button>
                    <button type="button" class="delete-btn" data-key="${key.key}"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>
            `;
            apiKeyListDiv.appendChild(item);
        });

        apiKeyListDiv.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const keyToCopy = e.target.dataset.key;
                if (keyToCopy) {
                    navigator.clipboard.writeText(keyToCopy).then(() => {
                        showToast('API Key berhasil disalin!', 'success');
                    }).catch(err => {
                        console.error('Gagal menyalin API Key:', err);
                        showToast('Gagal menyalin API Key.', 'error');
                    });
                }
            });
        });

        apiKeyListDiv.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const keyToDelete = e.target.dataset.key;
                const confirmMessageHtml = `Apakah Anda yakin ingin menghapus API Key <b>${keyToDelete}</b>?`;
                const userConfirmed = await showCustomConfirm(confirmMessageHtml);

                if (!userConfirmed) {
                    showToast('Penghapusan API Key dibatalkan.', 'info');
                    return;
                }

                showToast('Menghapus API Key...', 'info', 5000);
                try {
                    const res = await fetch(`${API_BASE_URL}/deleteApiKey`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: keyToDelete })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast(result.message, 'success');
                    loadApiKeys(); // Muat ulang daftar
                } catch (error) {
                    console.error('Error deleting API Key:', error);
                    showToast(error.message || 'Gagal menghapus API Key.', 'error');
                }
            });
        });
    }

    createApiKeyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = apiKeyNameInput.value.trim();
        const duration = apiKeyDurationSelect.value;

        if (!name) {
            return showToast('Nama API Key tidak boleh kosong.', 'error');
        }

        const createButton = createApiKeyForm.querySelector('button[type="submit"]');
        createButton.textContent = 'Membuat...';
        createButton.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/createApiKey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, duration })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast(`API Key "${name}" berhasil dibuat.`, 'success');
            apiKeyNameInput.value = '';
            apiKeyDurationSelect.value = 'day';
            loadApiKeys(); // Muat ulang daftar
        } catch (error) {
            console.error('Error creating API Key:', error);
            showToast(error.message || 'Gagal membuat API Key.', 'error');
        } finally {
            createButton.textContent = 'Buat API Key';
            createButton.disabled = false;
        }
    });

    // --- Logika Manajemen Kategori Domain ---
    async function loadDomainCategories() {
        domainCategoryListDiv.innerHTML = '<p>Memuat kategori domain...</p>';
        try {
            const res = await fetch(`${API_BASE_URL}/domainCategories`);
            if (!res.ok) throw new Error(`Gagal memuat kategori domain: Status ${res.status}`);
            const domainCategories = await res.json();
            renderDomainCategories(domainCategories);
        } catch (error) {
            console.error('Error loading domain categories:', error);
            showToast(error.message || 'Gagal memuat kategori domain.', 'error');
            domainCategoryListDiv.innerHTML = `<p>Gagal memuat kategori domain. ${error.message || ''}</p>`;
        }
    }

    function renderDomainCategories(categories) {
        domainCategoryListDiv.innerHTML = '';
        if (categories.length === 0) {
            domainCategoryListDiv.innerHTML = '<p>Tidak ada kategori domain yang dibuat.</p>';
            return;
        }
        categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'domain-category-item';
            item.dataset.name = cat.name;

            const preloadedBadge = cat.preloaded ? '<span class="new-badge" style="background-color: #007bff; margin-left: 10px;">Bawaan</span>' : '';

            item.innerHTML = `
                <div class="category-name"><b>${cat.name}</b> ${preloadedBadge}</div>
                <div class="category-meta">Zone ID: ${cat.zone}</div>
                <div class="item-actions">
                    ${!cat.preloaded ? `<button type="button" class="delete-btn" data-name="${cat.name}"><i class="fas fa-trash-alt"></i> Hapus</button>` : ''}
                </div>
            `;
            domainCategoryListDiv.appendChild(item);
        });

        domainCategoryListDiv.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const nameToDelete = e.target.dataset.name;
                const confirmMessageHtml = `Apakah Anda yakin ingin menghapus kategori domain <b>${nameToDelete}</b>?`;
                const userConfirmed = await showCustomConfirm(confirmMessageHtml);

                if (!userConfirmed) {
                    showToast('Penghapusan kategori domain dibatalkan.', 'info');
                    return;
                }

                showToast('Menghapus kategori domain...', 'info', 5000);
                try {
                    const res = await fetch(`${API_BASE_URL}/deleteDomainCategory`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: nameToDelete })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast(result.message, 'success');
                    loadDomainCategories(); // Muat ulang daftar
                } catch (error) {
                    console.error('Error deleting domain category:', error);
                    showToast(error.message || 'Gagal menghapus kategori domain.', 'error');
                }
            });
        });
    }

    addDomainCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = domainCategoryNameInput.value.trim();
        const zone = domainCategoryZoneInput.value.trim();
        const apitoken = domainCategoryApiTokenInput.value.trim();

        if (!name || !zone || !apitoken) {
            return showToast('Nama, Zone ID, dan API Token wajib diisi.', 'error');
        }

        const addButton = addDomainCategoryForm.querySelector('button[type="submit"]');
        addButton.textContent = 'Menambahkan...';
        addButton.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/addDomainCategory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, zone, apitoken })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showToast(`Kategori domain "${name}" berhasil ditambahkan.`, 'success');
            domainCategoryNameInput.value = '';
            domainCategoryZoneInput.value = '';
            domainCategoryApiTokenInput.value = '';
            loadDomainCategories(); // Muat ulang daftar
        } catch (error) {
            console.error('Error adding domain category:', error);
            showToast(error.message || 'Gagal menambahkan kategori domain.', 'error');
        } finally {
            addButton.textContent = 'Tambah Kategori Domain';
            addButton.disabled = false;
        }
    });


    // Cek status login saat halaman dimuat
    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
    }
});