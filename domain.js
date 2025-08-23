document.addEventListener('DOMContentLoaded', () => {
    // --- [PENTING] UBAH NOMOR INI ---
    // Ganti dengan nomor WhatsApp Anda untuk penjualan API Key
    const WA_ADMIN_APIKEY_NUMBER = "6285771555374"; 
    // ---

    const apiKeyScreen = document.getElementById('api-key-screen');
    const createDomainScreen = document.getElementById('create-domain-screen');
    const apiKeyInput = document.getElementById('api-key-input');
    const verifyKeyBtn = document.getElementById('verify-key-btn');
    const buyApiKeyBtn = document.getElementById('buy-api-key-btn');
    const toastContainer = document.getElementById('toast-container');
    const domainChoice = document.getElementById('domain-choice');
    const createDomainBtn = document.getElementById('create-domain-btn');
    const userIdentifier = document.getElementById('user-identifier');
    
    const resultModal = document.getElementById('resultModal');
    const resultContent = document.getElementById('result-content');
    const closeResultModal = document.getElementById('closeResultModal');

    const API_BASE_URL = '/api';
    let currentApiKey = null;
    let toastTimeout;

    function showToast(message, type = 'error', duration = 3000) {
        if (toastContainer.firstChild) {
            clearTimeout(toastTimeout);
            toastContainer.innerHTML = '';
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let iconClass = (type === 'success') ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
        toastContainer.appendChild(toast);
        toastTimeout = setTimeout(() => toast.remove(), duration);
    }

    buyApiKeyBtn.addEventListener('click', () => {
        const message = "Halo admin, saya ingin membeli API Key untuk membuat subdomain reseller.";
        window.open(`https://wa.me/${WA_ADMIN_APIKEY_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    });

    async function loadAvailableDomains() {
        try {
            const res = await fetch(`${API_BASE_URL}/getAvailableDomains`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            domainChoice.innerHTML = '<option value="">-- Pilih Domain --</option>';
            data.domains.forEach(domain => {
                const option = new Option(domain, domain);
                domainChoice.appendChild(option);
            });
        } catch (error) {
            domainChoice.innerHTML = `<option value="">Gagal memuat domain</option>`;
            showToast(error.message || 'Gagal mengambil daftar domain.');
        }
    }

    verifyKeyBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return showToast('API Key tidak boleh kosong.');

        verifyKeyBtn.textContent = 'Memverifikasi...';
        verifyKeyBtn.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/validateApiKey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showToast('API Key valid!', 'success');
            currentApiKey = key;
            userIdentifier.textContent = data.identifier;
            apiKeyScreen.style.display = 'none';
            createDomainScreen.style.display = 'block';
            await loadAvailableDomains();
        } catch (error) {
            showToast(error.message || 'Terjadi kesalahan.');
        } finally {
            verifyKeyBtn.textContent = 'Verifikasi';
            verifyKeyBtn.disabled = false;
        }
    });
    
    createDomainBtn.addEventListener('click', async () => {
        const subdomain = document.getElementById('subdomain-name').value.trim().toLowerCase();
        const domain = domainChoice.value;
        const ip = document.getElementById('vps-ip').value.trim();

        if (!subdomain || !domain || !ip) {
            return showToast('Semua kolom wajib diisi.');
        }
        if (!/^[a-z0-9-]+$/.test(subdomain)) {
             return showToast('Nama subdomain hanya boleh berisi huruf kecil, angka, dan strip (-).');
        }
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
             return showToast('Format IP VPS tidak valid.');
        }

        createDomainBtn.textContent = 'Memproses...';
        createDomainBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/createSubdomain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain, domain, ip, apiKey: currentApiKey })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            resultContent.innerHTML = `
                <p><b>Domain:</b> ${data.created_domain}</p>
                <p><b>Node:</b> ${data.created_node_domain}</p>
            `;
            resultModal.classList.add('is-visible');

        } catch (error) {
            showToast(error.message || 'Gagal membuat subdomain.');
        } finally {
            createDomainBtn.textContent = 'Buat Domain';
            createDomainBtn.disabled = false;
        }
    });

    closeResultModal.addEventListener('click', () => {
        resultModal.classList.remove('is-visible');
    });
});
