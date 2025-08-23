// --- [PENAMBAHAN] Inisialisasi YouTube Player API ---
let youtubePlayer;
let isYouTubeApiReady = false;
function onYouTubeIframeAPIReady() { isYouTubeApiReady = true; }
(function() { const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api"; const firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); })();

// --- Konfigurasi ---
const WA_ADMIN_NUMBER = "6285771555374"; // Fallback jika settings.json gagal dimuat
const WA_SELLER_NUMBER = "6285771555374";
const CREATOR_USERNAME = "Riki Shop Real";
const SOSMED_LINK = "https://rikishopreal.vercel.app";
const TESTIMONI_LINK = "https://rikishopreal.vercel.app/testimoni";
const SALURAN_WA_LINK = "https://whatsapp.com/channel/0029VaP4QyV3WHTgYm4pS23Z";

// --- Elemen DOM ---
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContainer = document.getElementById('mainContainer');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const openMenuBtn = document.getElementById('openMenu');
const closeMenuBtn = document.getElementById('closeMenu');
const openCartBtn = document.getElementById('openCart');
const cartCountSpan = document.getElementById('cartCount');
const currentDateTimeSpan = document.getElementById('currentDateTime');
const serviceItems = document.querySelectorAll('.service-item');
const productListDiv = document.getElementById('productList');
const productDetailViewDiv = document.getElementById('productDetailView');
const serviceDetailPageTitle = document.getElementById('serviceDetailPageTitle');
const detailProductName = document.getElementById('detailProductName');
const detailProductDescriptionContent = document.getElementById('detailProductDescriptionContent');
const detailProductPrice = document.getElementById('detailProductPrice');
const detailProductActions = document.getElementById('detailProductActions');
const cartItemsList = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const checkoutButton = document.getElementById('checkoutButton');
const backArrows = document.querySelectorAll('.back-arrow');
const cartEmptyMessage = document.getElementById('cartEmptyMessage');
const bannerCarousel = document.getElementById('bannerCarousel');
const bannerPagination = document.getElementById('bannerPagination');
const visitorCountDisplay = document.getElementById('visitorCountDisplay');
const visitorCountSpan = visitorCountDisplay ? visitorCountDisplay.querySelector('.count') : null;
let currentBannerIndex = 0;
let bannerInterval;
const stockImageSliderContainer = document.getElementById('stockImageSliderContainer');
const stockImageSlider = document.getElementById('stockImageSlider');
const sliderPrevBtn = document.getElementById('sliderPrevBtn');
const sliderNextBtn = document.getElementById('sliderNextBtn');
const imageLightbox = document.getElementById('imageLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
let currentStockImageIndex = 0;
let totalStockImages = 0;
const aboutUsModal = document.getElementById('aboutUsModal');
const openAboutUsModalBtn = document.getElementById('openAboutUsModal');
const closeAboutUsModalBtn = document.getElementById('closeAboutUsModal');
const genericScriptMenuModal = document.getElementById('genericScriptMenuModal');
const closeGenericScriptMenuModalBtn = document.getElementById('closeGenericScriptMenuModal');
const genericScriptMenuTitle = document.getElementById('genericScriptMenuTitle');
const genericScriptMenuContent = document.getElementById('genericScriptMenuContent');
const chatAiModal = document.getElementById('chatAiModal');
const openChatAiModalBtn = document.getElementById('openChatAiModal');
const closeChatAiModalBtn = document.getElementById('closeChatAiModal');
const chatAiMessagesPage = document.getElementById('chatAiMessagesPage');
const chatAiInputPage = document.getElementById('chatAiInputPage');
const sendChatAiBtnPage = document.getElementById('sendChatAiBtnPage');
const chatAiLoadingPage = document.getElementById('chatAiLoadingPage');
const multifunctionFab = document.getElementById('multifunctionFab');
const themeSwitchBtn = document.getElementById('themeSwitchBtn');
const openMusicPopupBtn = document.getElementById('openMusicPopupBtn');
const linktreeBtn = document.getElementById('linktreeBtn');
const muteAudioBtn = document.getElementById('muteAudioBtn');
let isFabFirstClick = true;
const musicPlayerOverlay = document.getElementById('musicPlayerOverlay');
const musicPlayerPopup = document.getElementById('musicPlayerPopup');
const closeMusicPlayer = document.getElementById('closeMusicPlayer');
const mediaLinkInput = document.getElementById('mediaLinkInput');
const loadMediaBtn = document.getElementById('loadMediaBtn');
const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
const backgroundAudio = document.getElementById('background-audio');
let toastTimeout;
let customMusicMuted = false;

// --- Variabel Global ---
let products = {};
let siteSettings = {};
let cart = JSON.parse(localStorage.getItem('rikishop_cart')) || [];
let currentPage = 'home-page';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rikishop';
let countdownInterval;

// --- Logika Firebase untuk Pengunjung ---
async function setupFirebaseVisitorCounter() {
    if (!visitorCountSpan) return;
    visitorCountSpan.textContent = '-';
    if (!window.firebaseServices) {
        console.warn("Layanan Firebase tidak tersedia.");
        visitorCountSpan.textContent = 'N/A';
        return;
    }
    const { auth, db, doc, runTransaction, onSnapshot, signInAnonymously, signInWithCustomToken, initialAuthToken } = window.firebaseServices;
    try {
        if (!auth.currentUser) {
            if (initialAuthToken) { await signInWithCustomToken(auth, initialAuthToken); } 
            else { await signInAnonymously(auth); }
        }
        
        const visitorDocRef = doc(db, "artifacts", appId, "public/data/site_stats/visitors");

        onSnapshot(visitorDocRef, (doc) => {
            const oldCount = visitorCountSpan.textContent;
            let newCountText = '0';
            if (doc.exists() && typeof doc.data().count === 'number') {
                newCountText = doc.data().count.toString();
            }
            visitorCountSpan.textContent = newCountText;
            if (oldCount !== '-' && oldCount !== newCountText) {
                visitorCountDisplay.classList.add('updated');
                setTimeout(() => visitorCountDisplay.classList.remove('updated'), 500);
            }
        });
        
        await runTransaction(db, async (transaction) => {
            const visitorDoc = await transaction.get(visitorDocRef);
            const newCount = (visitorDoc.exists() ? visitorDoc.data().count : 0) + 1;
            transaction.set(visitorDocRef, { count: newCount }, { merge: true });
        });
    } catch (error) {
        console.error("Error Firebase Visitor Counter:", error);
        visitorCountSpan.textContent = 'Error';
    }
}

// --- Logika Tombol Multifungsi (FAB) ---
multifunctionFab.addEventListener('click', (e) => {
    if (e.target.classList.contains('main-fab-icon')) {
        multifunctionFab.classList.toggle('active');
        if (isFabFirstClick) {
            playBackgroundMusic();
            isFabFirstClick = false;
        }
    }
});
themeSwitchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
    themeSwitchBtn.querySelector('i').className = document.body.classList.contains('dark-mode') ? 'fas fa-moon' : 'fas fa-sun';
});
linktreeBtn.addEventListener('click', (e) => { e.stopPropagation(); window.open(SOSMED_LINK, '_blank'); });
muteAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const icon = muteAudioBtn.querySelector('i');
    if (youtubePlayer && typeof youtubePlayer.isMuted === 'function') {
        if (youtubePlayer.isMuted()) {
            youtubePlayer.unMute();
            icon.className = 'fas fa-volume-up';
            showToastNotification("Suara diaktifkan", "fa-volume-up");
        } else {
            youtubePlayer.mute();
            icon.className = 'fas fa-volume-mute';
            showToastNotification("Suara dimatikan", "fa-volume-mute");
        }
    } else {
        backgroundAudio.muted = !backgroundAudio.muted;
        icon.className = backgroundAudio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
});

// --- Fungsi Pembantu ---
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    mainContainer.scrollTop = 0;
}
function updateDateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    currentDateTimeSpan.innerHTML = `<span class="date">${formattedDate}</span><br><span class="time">${formattedTime}</span>`;
}
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}
function getPhoneNumberForProduct(product, serviceType) {
    if (product && product.nomorWA) return product.nomorWA;
    if (siteSettings.categoryPhoneNumbers && siteSettings.categoryPhoneNumbers[serviceType]) return siteSettings.categoryPhoneNumbers[serviceType];
    if (siteSettings.globalPhoneNumber) return siteSettings.globalPhoneNumber;
    return WA_ADMIN_NUMBER;
}

// --- Logika Produk ---
serviceItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const serviceType = item.dataset.service;
        loadServiceProducts(serviceType);
        showPage('service-detail-page');
    });
});

function loadServiceProducts(serviceType) {
    serviceDetailPageTitle.textContent = serviceType;
    productListDiv.innerHTML = '';
    productDetailViewDiv.style.display = 'none';
    let productData = products[serviceType] || [];
    
    if (productData.length > 0) {
        productData.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            
            const isDiscountValid = product.discountPrice && product.discountEndDate && new Date(product.discountEndDate) > new Date();
            let priceDisplay = `<span class="product-price-list">${formatRupiah(product.harga)}</span>`;
            if (isDiscountValid) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(product.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(product.discountPrice)}</span>`;
            } else if (product.hargaAsli && product.hargaAsli > product.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(product.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(product.harga)}</span>`;
            }
            
            productItem.innerHTML = `
                <div>
                    <span class="product-name">${product.nama}</span>
                    <p class="product-short-desc">${product.deskripsiPanjang ? product.deskripsiPanjang.split('||')[0].trim() + '...' : ''}</p>
                    <div class="price-display">${priceDisplay}</div>
                </div>
                <i class="fas fa-chevron-right"></i>`;
            productItem.addEventListener('click', () => showProductDetail(product, serviceType));
            productListDiv.appendChild(productItem);
        });
        productListDiv.style.display = 'block';
    } else {
        productListDiv.innerHTML = '<p style="text-align: center; color: var(--light-text-color); padding: 20px;">Produk akan segera hadir.</p>';
    }
}

function showProductDetail(product, serviceType) {
    productListDiv.style.display = 'none';
    productDetailViewDiv.style.display = 'block';
    detailProductName.textContent = product.nama;
    
    if (countdownInterval) clearInterval(countdownInterval);

    const detailContainer = productDetailViewDiv.querySelector('.product-detail');
    const existingTimer = detailContainer.querySelector('.countdown-timer');
    if (existingTimer) existingTimer.remove();

    const priceContainer = document.getElementById('detailProductPrice');
    priceContainer.className = 'price price-display';
    priceContainer.innerHTML = '';
    
    const isDiscountValid = product.discountPrice && product.discountEndDate && new Date(product.discountEndDate) > new Date();
    let currentPrice = product.harga;

    if (isDiscountValid) {
        currentPrice = product.discountPrice;
        const originalPriceEl = document.createElement('span');
        originalPriceEl.className = 'original-price';
        originalPriceEl.innerHTML = `<del>${formatRupiah(product.hargaAsli)}</del>`;
        
        const discountPriceEl = document.createElement('span');
        discountPriceEl.className = 'discounted-price';
        discountPriceEl.textContent = formatRupiah(product.discountPrice);

        const discountPercentage = Math.round(((product.hargaAsli - product.discountPrice) / product.hargaAsli) * 100);
        const discountBadgeEl = document.createElement('span');
        discountBadgeEl.className = 'discount-badge';
        discountBadgeEl.textContent = `${discountPercentage}% OFF`;

        priceContainer.append(originalPriceEl, discountPriceEl, discountBadgeEl);

        const countdownContainer = document.createElement('div');
        countdownContainer.className = 'countdown-timer';
        countdownContainer.innerHTML = `<span class="timer-title">Diskon Berakhir Dalam</span><div id="countdown-display"></div>`;
        detailContainer.insertBefore(countdownContainer, priceContainer.parentElement);
        startCountdown(product.discountEndDate);
    } else {
        const normalPriceEl = document.createElement('span');
        normalPriceEl.textContent = formatRupiah(product.harga);
        priceContainer.appendChild(normalPriceEl);
    }

    detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
    detailProductActions.innerHTML = '';
    
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.textContent = 'Tambah ke Keranjang';
    Object.assign(addToCartBtn.dataset, {
        productId: product.id,
        productName: product.nama,
        productPrice: currentPrice,
        serviceType: serviceType
    });
    addToCartBtn.addEventListener('click', addToCart);
    detailProductActions.appendChild(addToCartBtn);

    const buyNowLink = document.createElement('a');
    buyNowLink.className = 'buy-now';
    buyNowLink.textContent = 'Beli Sekarang';
    const targetPhoneNumber = getPhoneNumberForProduct(product, serviceType);
    let buyNowMessage = `Halo Kak, saya tertarik memesan produk:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(currentPrice)}*\n\nMohon info selanjutnya. Terima kasih! 🙏`;
    buyNowLink.href = `https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(buyNowMessage)}`;
    buyNowLink.target = "_blank";
    detailProductActions.appendChild(buyNowLink);
}

function startCountdown(endDate) {
    const countdownDisplay = document.getElementById('countdown-display');
    if (!countdownDisplay) return;
    const endTime = new Date(endDate).getTime();

    function updateTimer() {
        const now = new Date().getTime();
        const distance = endTime - now;
        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownDisplay.innerHTML = "WAKTU HABIS";
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        let timerString = '';
        if (days > 0) timerString += `${days}h : `;
        timerString += `${String(hours).padStart(2, '0')}j : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}d`;
        countdownDisplay.innerHTML = timerString;
    }
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

backArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        if (countdownInterval) clearInterval(countdownInterval);
        const backToPageId = arrow.dataset.backTo;
        if (currentPage === 'service-detail-page' && productDetailViewDiv.style.display === 'block') {
            productListDiv.style.display = 'block';
            productDetailViewDiv.style.display = 'none';
        } else {
            showPage(backToPageId || 'home-page');
        }
    });
});

function showToastNotification(message, iconClass = 'fa-check-circle') {
    const toast = document.getElementById('toast-notification');
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
    cartCountSpan.style.display = count > 0 ? 'flex' : 'none';
}
function addToCart(event) {
    const { productId, productName, productPrice, serviceType } = event.target.dataset;
    const id = parseInt(productId), price = parseInt(productPrice);
    const existingItem = cart.find(item => item.id === id);
    if (serviceType === 'Stock Akun') {
        if (existingItem) {
            showToastNotification('Stok Akun hanya bisa dibeli 1 kali.', 'fa-exclamation-circle');
            return;
        } else {
            cart.push({ id, name: productName, price, quantity: 1, serviceType });
        }
    } else {
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name: productName, price, quantity: 1, serviceType });
        }
    }
    localStorage.setItem('rikishop_cart', JSON.stringify(cart));
    updateCartCount();
    const itemInCart = cart.find(item => item.id === id);
    showToastNotification(`<b>${productName}</b> (${itemInCart.quantity} barang) ditambahkan.`);
}
function renderCart() {
    cartItemsList.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartEmptyMessage.style.display = 'block';
        document.querySelector('.cart-summary').style.display = 'none';
        checkoutButton.style.display = 'none';
    } else {
        cartEmptyMessage.style.display = 'none';
        document.querySelector('.cart-summary').style.display = 'flex';
        checkoutButton.style.display = 'block';
        cart.forEach(item => {
            const cartItemCard = document.createElement('div');
            cartItemCard.className = 'cart-item-card';
            let itemActionsHTML = (item.serviceType === 'Stock Akun') ?
                `<div class="item-actions"><span class="stock-info">Hanya 1 Stok</span><button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button></div>` :
                `<div class="item-actions"><div class="quantity-controls"><button type="button" class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button><span class="item-quantity">${item.quantity}</span><button type="button" class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button></div><button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button></div>`;
            cartItemCard.innerHTML = `<div class="item-image"><i class="fas fa-box-open"></i></div><div class="item-details"><div class="item-name">${item.name}</div><div class="item-price">${formatRupiah(item.price)}</div></div>${itemActionsHTML}`;
            cartItemsList.appendChild(cartItemCard);
            total += item.price * item.quantity;
        });
    }
    cartTotalSpan.textContent = formatRupiah(total);
}
function increaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity++;
        localStorage.setItem('rikishop_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
}
function decreaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('rikishop_cart', JSON.stringify(cart));
            updateCartCount();
            renderCart();
        }
    }
}
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('rikishop_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}
openCartBtn.addEventListener('click', () => { showPage('cart-page'); renderCart(); });
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) return;
    let itemsText = '';
    let totalOrder = 0;
    cart.forEach((item, index) => {
        itemsText += `*${index + 1}. ${item.name}*\n   (${formatRupiah(item.price)}) x ${item.quantity}\n`;
        totalOrder += item.price * item.quantity;
    });
    let message = `Halo Kak, saya ingin mengonfirmasi pesanan dari keranjang:\n\n--- PESANAN ---\n${itemsText}--------------------\n\n*Total: ${formatRupiah(totalOrder)}*\n\nMohon konfirmasinya. Terima kasih! 🙏`;
    const checkoutNumber = siteSettings.globalPhoneNumber || WA_ADMIN_NUMBER;
    window.open(`https://wa.me/${checkoutNumber}?text=${encodeURIComponent(message)}`, '_blank');
});

// --- Inisialisasi Aplikasi ---
async function initializeApp() {
    mainContainer.style.display = 'none';
    try {
        const timestamp = new Date().getTime();
        const [productsResponse, settingsResponse] = await Promise.all([
            fetch(`products.json?v=${timestamp}`),
            fetch(`settings.json?v=${timestamp}`)
        ]);
        if (!productsResponse.ok) throw new Error(`Gagal memuat produk: ${productsResponse.status}`);
        products = await productsResponse.json();
        if (settingsResponse.ok) {
            siteSettings = await settingsResponse.json();
        } else {
            console.warn("Gagal memuat settings.json, menggunakan nomor fallback.");
        }
    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        document.querySelector('.main-content').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data. Coba muat ulang halaman.</p>`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateCartCount();
    welcomeScreen.style.display = 'flex';
    let progress = 0;
    let progressBar = document.getElementById("progressBar");
    let progressText = document.getElementById("progress-text");
    let interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = progress + "%";
        progressText.textContent = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                welcomeScreen.classList.add("fade-out");
                welcomeScreen.addEventListener('transitionend', () => {
                    welcomeScreen.style.display = "none";
                    mainContainer.style.display = "flex";
                    showPage('home-page');
                }, { once: true });
            }, 400);
        }
    }, 80);
}

document.addEventListener('firebaseReady', () => {
    initializeApp();
    setupFirebaseVisitorCounter();
});
document.addEventListener('firebaseFailed', () => {
    initializeApp();
    if(visitorCountDisplay) visitorCountDisplay.querySelector('.count').textContent = 'N/A';
});
