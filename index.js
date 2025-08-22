// index.js - Server Backend Node.js dengan Express.js

// Impor modul yang diperlukan
import express from 'express';
import cors from 'cors'; // Untuk mengatasi masalah CORS jika di-deploy ke domain yang berbeda (saat development biasanya tidak perlu jika static diserve dari sini)
import path from 'path'; // Modul Path untuk menangani jalur file
import { fileURLToPath } from 'url'; // Untuk mendapatkan __dirname di ES Modules
import fs from 'fs/promises'; // Untuk membaca/menulis file JSON
import axios from 'axios'; // Untuk interaksi dengan Cloudflare API
import { v4 as uuidv4 } from 'uuid'; // Untuk menghasilkan UUID unik

// Dapatkan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Server akan berjalan di port 3000 secara default

// Middleware untuk mengizinkan Express mengurai body permintaan dalam format JSON
app.use(express.json());

// Middleware untuk mengizinkan permintaan lintas asal (Cross-Origin Resource Sharing)
app.use(cors());

// --- KONFIGURASI DOMAIN CLOUDFLARE (Emulasi .env) ---
// CATATAN PENTING: Dalam produksi, ini harus dimuat dari variabel lingkungan (.env)
// Contoh: process.env.CLOUDFLARE_API_TOKEN_RIKISHOP
const CLOUDFLARE_CONFIG = {
    "marketrikishop.my.id": {
        "zone": "33970794e3373167a9c9556ad19fdb6a",
        "apitoken": "5BuYPtwU__7hJIzfX1euJn3K-ChzZH29VZ_ivbja"
    },
    "kangpanel.biz.id": {
        "zone": "90ab3a017b7b29dd9ee92fdbb5831b0a",
        "apitoken": "Jf_bwzYFsH89BZ6az61JlUGGu56SmNOqf7WC7KgV"
    }
};

const API_KEYS_FILE = path.join(__dirname, 'apikeys.json');
const DOMAIN_CATEGORIES_FILE = path.join(__dirname, 'domainCategories.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json'); // Path ke products.json

// Fungsi pembantu untuk membaca/menulis file JSON
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --- MENYAJIKAN FILE STATIS ---
// Ini akan membuat file seperti admin.html, admin.js, admin.css dapat diakses
// dari URL root server (misalnya http://localhost:3000/admin.html)
app.use(express.static(__dirname));

// --- RUTE API UNTUK LOGIN ---
app.post('/api/login', (req, res) => {
    const { password } = req.body; // Mengambil password dari body permintaan

    // Logika verifikasi password Anda
    // GANTI 'password-rahasia-anda-kuat' dengan password yang benar untuk admin
    if (password === 'password-rahasia-anda-kuat') {
        // Jika password benar, kirim respons sukses (JSON)
        res.status(200).json({ message: 'Login berhasil!' });
    } else {
        // Jika password salah, kirim respons error (JSON)
        // Pastikan pesan error juga dalam format JSON
        res.status(401).json({ message: 'Password salah.' });
    }
});

// --- RUTE API UNTUK MENAMBAH PRODUK ---
app.post('/api/addProduct', async (req, res) => {
    const productData = req.body; // Mengambil data produk dari body permintaan

    try {
        const products = await readJsonFile(PRODUCTS_FILE);
        if (!products[productData.category]) {
            products[productData.category] = [];
        }
        productData.id = Date.now(); // ID unik untuk setiap produk baru
        products[productData.category].push(productData);
        await writeJsonFile(PRODUCTS_FILE, products);
        res.status(200).json({ message: `Produk "${productData.nama}" berhasil ditambahkan.`, product: productData });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Gagal menambahkan produk.' });
    }
});

// --- RUTE API UNTUK MENGHAPUS PRODUK ---
app.delete('/api/deleteProduct', async (req, res) => {
    const { id, category } = req.body;
    try {
        const products = await readJsonFile(PRODUCTS_FILE);
        if (products[category]) {
            const initialLength = products[category].length;
            products[category] = products[category].filter(p => p.id !== id);
            if (products[category].length < initialLength) {
                await writeJsonFile(PRODUCTS_FILE, products);
                res.status(200).json({ message: 'Produk berhasil dihapus.' });
            } else {
                res.status(404).json({ message: 'Produk tidak ditemukan.' });
            }
        } else {
            res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Gagal menghapus produk.' });
    }
});

// --- RUTE API UNTUK MEMPERBARUI PRODUK ---
app.post('/api/updateProduct', async (req, res) => {
    const { id, category, newName, newPrice, newDesc, newImages, newMenuContent } = req.body;
    try {
        const products = await readJsonFile(PRODUCTS_FILE);
        if (products[category]) {
            const productIndex = products[category].findIndex(p => p.id === id);
            if (productIndex !== -1) {
                products[category][productIndex].nama = newName;
                products[category][productIndex].harga = newPrice;
                products[category][productIndex].deskripsiPanjang = newDesc;
                // Hanya update jika properti ada
                if (newImages !== undefined) {
                    products[category][productIndex].images = newImages;
                }
                if (newMenuContent !== undefined) {
                    products[category][productIndex].menuContent = newMenuContent;
                }
                await writeJsonFile(PRODUCTS_FILE, products);
                res.status(200).json({ message: 'Produk berhasil diperbarui.', product: products[category][productIndex] });
            } else {
                res.status(404).json({ message: 'Produk tidak ditemukan.' });
            }
        } else {
            res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Gagal memperbarui produk.' });
    }
});

// --- RUTE API UNTUK MENGUBAH URUTAN PRODUK ---
app.post('/api/reorderProducts', async (req, res) => {
    const { category, order } = req.body; // `order` adalah array ID produk dalam urutan baru
    try {
        const productsData = await readJsonFile(PRODUCTS_FILE);
        if (productsData[category]) {
            const reorderedProducts = order.map(id => productsData[category].find(p => p.id === id)).filter(Boolean);
            // Memastikan semua produk ada di daftar baru
            if (reorderedProducts.length !== productsData[category].length) {
                console.warn('Peringatan: Tidak semua produk ditemukan saat mengurutkan ulang.');
            }
            productsData[category] = reorderedProducts;
            await writeJsonFile(PRODUCTS_FILE, productsData);
            res.status(200).json({ message: 'Urutan produk berhasil disimpan.' });
        } else {
            res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error reordering products:', error);
        res.status(500).json({ message: 'Gagal menyimpan urutan produk.' });
    }
});

// --- RUTE API UNTUK MENGUBAH HARGA SEMUA PRODUK DALAM KATEGORI (BULK PRICE) ---
app.post('/api/updateProductsInCategory', async (req, res) => {
    const { category, newPrice } = req.body;
    try {
        const productsData = await readJsonFile(PRODUCTS_FILE);
        if (productsData[category]) {
            productsData[category] = productsData[category].map(p => {
                // Simpan harga asli sebelum diubah jika belum ada
                const hargaAsli = p.hargaAsli !== undefined ? p.hargaAsli : p.harga;
                return { ...p, harga: newPrice, hargaAsli: hargaAsli };
            });
            await writeJsonFile(PRODUCTS_FILE, productsData);
            res.status(200).json({ message: `Harga semua produk di kategori "${category}" berhasil diubah menjadi ${newPrice}.` });
        } else {
            res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error updating bulk price:', error);
        res.status(500).json({ message: 'Gagal menerapkan harga massal.' });
    }
});

// --- RUTE API UNTUK MENGEMBALIKAN HARGA ASLI SEMUA PRODUK DALAM KATEGORI ---
app.post('/api/resetBulkPriceInCategory', async (req, res) => {
    const { category } = req.body;
    try {
        const productsData = await readJsonFile(PRODUCTS_FILE);
        if (productsData[category]) {
            productsData[category] = productsData[category].map(p => {
                // Jika ada hargaAsli, kembalikan harga ke hargaAsli dan hapus hargaAsli
                if (p.hargaAsli !== undefined) {
                    const { hargaAsli, ...rest } = p; // Hapus hargaAsli dari objek
                    return { ...rest, harga: hargaAsli };
                }
                return p;
            });
            await writeJsonFile(PRODUCTS_FILE, productsData);
            res.status(200).json({ message: `Harga produk di kategori "${category}" berhasil dikembalikan ke harga awal.` });
        } else {
            res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error resetting bulk price:', error);
        res.status(500).json({ message: 'Gagal mengembalikan harga awal.' });
    }
});


// --- RUTE API UNTUK MENGELOLA API KEYS ---

// GET: Mendapatkan semua API Keys
app.get('/api/apikeys', async (req, res) => {
    try {
        const apiKeys = await readJsonFile(API_KEYS_FILE, []);
        res.status(200).json(apiKeys);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ message: 'Gagal mengambil API keys.' });
    }
});

// POST: Membuat API Key baru
app.post('/api/createApiKey', async (req, res) => {
    const { name, duration } = req.body; // duration: 'day', 'week', 'month', 'year', 'permanent'
    if (!name || !duration) {
        return res.status(400).json({ message: 'Nama dan durasi API Key wajib diisi.' });
    }

    try {
        const apiKeys = await readJsonFile(API_KEYS_FILE, []);
        const newKey = `rkshp-${uuidv4()}`; // Menggunakan UUID untuk kunci yang lebih unik
        
        let expiryDate = null;
        if (duration !== 'permanent') {
            const now = new Date();
            if (duration === 'day') now.setDate(now.getDate() + 1);
            else if (duration === 'week') now.setDate(now.getDate() + 7);
            else if (duration === 'month') now.setMonth(now.getMonth() + 1);
            else if (duration === 'year') now.setFullYear(now.getFullYear() + 1);
            expiryDate = now.toISOString();
        }

        apiKeys.push({ key: newKey, name, duration, expiryDate, createdAt: new Date().toISOString() });
        await writeJsonFile(API_KEYS_FILE, apiKeys);
        res.status(200).json({ message: 'API Key berhasil dibuat.', apiKey: newKey, name, duration, expiryDate });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ message: 'Gagal membuat API Key.' });
    }
});

// DELETE: Menghapus API Key
app.delete('/api/deleteApiKey', async (req, res) => {
    const { key } = req.body;
    try {
        let apiKeys = await readJsonFile(API_KEYS_FILE, []);
        const initialLength = apiKeys.length;
        apiKeys = apiKeys.filter(k => k.key !== key);
        if (apiKeys.length < initialLength) {
            await writeJsonFile(API_KEYS_FILE, apiKeys);
            res.status(200).json({ message: 'API Key berhasil dihapus.' });
        } else {
            res.status(404).json({ message: 'API Key tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ message: 'Gagal menghapus API Key.' });
    }
});


// --- RUTE API UNTUK MENGELOLA KATEGORI DOMAIN ---

// GET: Mendapatkan semua kategori domain
app.get('/api/domainCategories', async (req, res) => {
    try {
        const domainCategories = await readJsonFile(DOMAIN_CATEGORIES_FILE, []);
        // Gabungkan dengan CLOUDFLARE_CONFIG jika ada
        const combinedCategories = [...domainCategories];
        for (const key in CLOUDFLARE_CONFIG) {
            if (!combinedCategories.some(cat => cat.name === key)) {
                combinedCategories.push({ name: key, ...CLOUDFLARE_CONFIG[key], preloaded: true });
            }
        }
        res.status(200).json(combinedCategories);
    } catch (error) {
        console.error('Error fetching domain categories:', error);
        res.status(500).json({ message: 'Gagal mengambil kategori domain.' });
    }
});

// POST: Menambahkan kategori domain baru
app.post('/api/addDomainCategory', async (req, res) => {
    const { name, zone, apitoken } = req.body;
    if (!name || !zone || !apitoken) {
        return res.status(400).json({ message: 'Nama, Zone, dan API Token wajib diisi.' });
    }

    try {
        const domainCategories = await readJsonFile(DOMAIN_CATEGORIES_FILE, []);
        // Cek juga di CLOUDFLARE_CONFIG
        if (domainCategories.some(cat => cat.name === name) || CLOUDFLARE_CONFIG[name]) {
            return res.status(409).json({ message: 'Kategori domain dengan nama tersebut sudah ada.' });
        }
        domainCategories.push({ name, zone, apitoken, createdAt: new Date().toISOString() });
        await writeJsonFile(DOMAIN_CATEGORIES_FILE, domainCategories);
        res.status(200).json({ message: 'Kategori domain berhasil ditambahkan.', category: { name, zone, apitoken } });
    } catch (error) {
        console.error('Error adding domain category:', error);
        res.status(500).json({ message: 'Gagal menambahkan kategori domain.' });
    }
});

// DELETE: Menghapus kategori domain
app.delete('/api/deleteDomainCategory', async (req, res) => {
    const { name } = req.body;
    // Mencegah penghapusan kategori domain yang sudah ada di CLOUDFLARE_CONFIG
    if (CLOUDFLARE_CONFIG[name]) {
        return res.status(403).json({ message: 'Tidak dapat menghapus kategori domain bawaan.' });
    }
    try {
        let domainCategories = await readJsonFile(DOMAIN_CATEGORIES_FILE, []);
        const initialLength = domainCategories.length;
        domainCategories = domainCategories.filter(cat => cat.name !== name);
        if (domainCategories.length < initialLength) {
            await writeJsonFile(DOMAIN_CATEGORIES_FILE, domainCategories);
            res.status(200).json({ message: 'Kategori domain berhasil dihapus.' });
        } else {
            res.status(404).json({ message: 'Kategori domain tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error deleting domain category:', error);
        res.status(500).json({ message: 'Gagal menghapus kategori domain.' });
    }
});

// --- RUTE API UNTUK MEMBUAT SUBDOMAIN (CLOUDFLARE) ---
app.post('/api/createSubdomain', async (req, res) => {
    const { apiKey, host, domainCategory, ip } = req.body;

    if (!apiKey || !host || !domainCategory || !ip) {
        return res.status(400).json({ message: 'API Key, Nama Host, Kategori Domain, dan IP VPS wajib diisi.' });
    }

    try {
        // 1. Verifikasi API Key
        const apiKeys = await readJsonFile(API_KEYS_FILE, []);
        const validApiKey = apiKeys.find(k => k.key === apiKey);

        if (!validApiKey) {
            return res.status(403).json({ message: 'API Key tidak valid.' });
        }

        if (validApiKey.expiryDate && new Date(validApiKey.expiryDate) < new Date()) {
            return res.status(403).json({ message: 'API Key sudah kadaluarsa.' });
        }

        // 2. Dapatkan konfigurasi domain dari kategori yang dipilih
        const domainCategories = await readJsonFile(DOMAIN_CATEGORIES_FILE, []);
        let selectedDomain = domainCategories.find(cat => cat.name === domainCategory);

        // Jika tidak ditemukan di domainCategories.json, coba cari di CLOUDFLARE_CONFIG langsung
        if (!selectedDomain && CLOUDFLARE_CONFIG[domainCategory]) {
            selectedDomain = { 
                name: domainCategory, 
                zone: CLOUDFLARE_CONFIG[domainCategory].zone, 
                apitoken: CLOUDFLARE_CONFIG[domainCategory].apitoken 
            };
        }

        if (!selectedDomain) {
            return res.status(404).json({ message: 'Kategori domain tidak ditemukan.' });
        }
        
        const { zone, apitoken } = selectedDomain;

        // Fungsi internal untuk membuat record DNS
        const createDnsRecord = async (recordHost, recordIp) => {
            try {
                const response = await axios.post(
                    `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
                    {
                        type: "A",
                        name: recordHost.replace(/[^a-z0-9.-]/gi, ""), // Sanitasi host
                        content: recordIp.replace(/[^0-9.]/gi, ""), // Sanitasi IP
                        ttl: 3600,
                        priority: 10,
                        proxied: false
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apitoken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                return { success: true, result: response.data.result };
            } catch (e) {
                const errorDetail = e.response?.data?.errors?.[0]?.message || e.message;
                return { success: false, error: errorDetail };
            }
        };

        const cleanedHost = host.toLowerCase().replace(/[^a-z0-9]/gi, ''); // Bersihkan host untuk subdomain
        const fullDomain = `${cleanedHost}.${domainCategory}`;
        const randomString = Math.random().toString(36).substring(2, 8); // Random string untuk node
        const nodeDomainHost = `node-${cleanedHost}${randomString}`; // Hanya host bagian depan untuk node
        const fullNodeDomain = `${nodeDomainHost}.${domainCategory}`;


        let results = [];
        let successCount = 0;

        // Buat record untuk domain utama
        const domainResult = await createDnsRecord(cleanedHost, ip);
        if (domainResult.success) {
            results.push({ name: domainResult.result.name, status: 'success' });
            successCount++;
        } else {
            results.push({ name: fullDomain, status: 'failed', error: domainResult.error });
        }

        // Buat record untuk node domain
        const nodeResult = await createDnsRecord(nodeDomainHost, ip);
        if (nodeResult.success) {
            results.push({ name: nodeResult.result.name, status: 'success' });
            successCount++;
        } else {
            results.push({ name: fullNodeDomain, status: 'failed', error: nodeResult.error });
        }

        if (successCount > 0) {
            res.status(200).json({ 
                message: 'Subdomain berhasil dibuat.', 
                domain: fullDomain, 
                node: fullNodeDomain, 
                results 
            });
        } else {
            res.status(500).json({ message: 'Gagal membuat subdomain.', results });
        }

    } catch (error) {
        console.error('Error creating subdomain:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat membuat subdomain.' });
    }
});


// --- RUTE DEFAULT ---
// Jika ada yang mengakses root URL (misalnya http://localhost:3000/)
// kita bisa mengarahkan mereka ke admin.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- Penanganan rute ke halaman domain ---
app.get('/domain.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'domain.html'));
});


// --- Penanganan rute yang tidak ditemukan (404) ---
// Ini penting agar server mengirimkan respons JSON yang benar jika ada rute yang tidak dikenal
app.use((req, res, next) => {
    // Jika permintaan adalah API, kirimkan JSON error 404
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'API Endpoint tidak ditemukan.' });
    }
    // Untuk rute non-API lainnya, biarkan Express menangani serving static files atau 404 standar
    res.status(404).send('File atau halaman tidak ditemukan.');
});

// --- Mulai Server ---
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
    console.log(`Akses Admin Panel di: http://localhost:${PORT}/admin.html atau http://localhost:${PORT}/`);
    console.log(`Akses Domain Panel di: http://localhost:${PORT}/domain.html`);
    console.log(`(Ganti 'password-rahasia-anda-kuat' di index.js dengan password yang Anda inginkan)`);
});