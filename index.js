// =================================================================
// SERVER BACKEND RIKISHOPREAL DENGAN EXPRESS.JS
// =================================================================

// --- Impor Modul ---
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Octokit } from "@octokit/rest";
import fetch from 'node-fetch'; // Diperlukan untuk API Cloudflare

// --- Konfigurasi Awal ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- File Paths untuk Data Lokal (API Key & Domain) ---
const keysFilePath = path.join(process.cwd(), 'apikeys.json');
const domainsFilePath = path.join(process.cwd(), 'domains.json');
const subdomainsFilePath = path.join(process.cwd(), 'subdomains.json');

// --- Middleware ---
app.use(express.json()); // Mengurai body JSON
app.use(cors()); // Mengizinkan Cross-Origin
app.use(express.static(__dirname)); // Menyajikan file statis (HTML, CSS, JS frontend)

// --- Helper Functions ---
const readJsonFile = async (filePath, defaultValue) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        throw error;
    }
};

const writeJsonFile = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// =================================================================
// RUTE API (ENDPOINT)
// =================================================================

// --- API Login Admin ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    // PENTING: Gunakan Environment Variable di hosting Anda!
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ganti-dengan-password-aman';

    if (password && password === ADMIN_PASSWORD) {
        res.status(200).json({ message: 'Login berhasil' });
    } else {
        res.status(401).json({ message: 'Password yang Anda masukkan salah.' });
    }
});


// --- API Produk (Integrasi dengan GitHub) ---
// Inisialisasi Octokit (untuk interaksi dengan GitHub)
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const FILE_PATH = 'products.json';

// Fungsi helper untuk mengambil file dari GitHub
const getProductsFile = async () => {
    const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
    });
    return {
        sha: data.sha,
        json: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
    };
};

// Fungsi helper untuk update file di GitHub
const updateProductsFile = async (sha, json, message) => {
    await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        message,
        content: Buffer.from(JSON.stringify(json, null, 4)).toString('base64'),
        sha,
    });
};


app.post('/api/addProduct', async (req, res) => {
    try {
        const newProductData = req.body;
        if (newProductData.nomorWA && !/^\d+$/.test(newProductData.nomorWA)) {
            return res.status(400).json({ message: 'Format nomor WhatsApp salah. Harus berupa angka saja.' });
        }

        const { sha, json: productsJson } = await getProductsFile();

        let maxId = Object.values(productsJson).flat().reduce((max, p) => p.id > max ? p.id : max, 0);
        const newProduct = {
            id: maxId + 1,
            nama: newProductData.nama,
            harga: newProductData.harga,
            deskripsiPanjang: newProductData.deskripsiPanjang.replace(/\n/g, ' || '),
            createdAt: new Date().toISOString(),
            ...(newProductData.nomorWA && { nomorWA: newProductData.nomorWA }),
            ...((newProductData.category === 'Stock Akun' || newProductData.category === 'Logo') && { images: newProductData.images }),
            ...(newProductData.category === 'Script' && { menuContent: newProductData.menuContent }),
        };

        if (!productsJson[newProductData.category]) {
            productsJson[newProductData.category] = [];
        }
        productsJson[newProductData.category].unshift(newProduct);

        await updateProductsFile(sha, productsJson, `feat: Menambahkan produk baru "${newProduct.nama}"`);
        res.status(200).json({ message: 'Produk berhasil ditambahkan!', newProduct });

    } catch (error) {
        console.error("Error addProduct:", error);
        res.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
});

app.post('/api/updateProduct', async (req, res) => {
    try {
        const { id, category, newName, newPrice, newDesc, newImages, newMenuContent, newWhatsapp } = req.body;
         if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
            return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        }
        
        const { sha, json: productsJson } = await getProductsFile();
        let productFound = false;

        productsJson[category] = productsJson[category].map(p => {
            if (p.id === id) {
                productFound = true;
                const updated = { ...p, nama: newName, harga: newPrice, deskripsiPanjang: newDesc };
                if (newWhatsapp) updated.nomorWA = newWhatsapp; else delete updated.nomorWA;
                if (newImages !== null) updated.images = newImages;
                if (newMenuContent !== null) updated.menuContent = newMenuContent;
                return updated;
            }
            return p;
        });

        if (!productFound) return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        await updateProductsFile(sha, productsJson, `chore: Memperbarui produk ID ${id}`);
        res.status(200).json({ message: 'Produk berhasil diperbarui.' });

    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui produk.', error: error.message });
    }
});

app.post('/api/updateBulkWhatsapp', async (req, res) => {
    try {
        const { category, newWhatsapp } = req.body;
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
            return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        }
        
        const { sha, json: productsJson } = await getProductsFile();
        if (!productsJson[category]) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });

        productsJson[category] = productsJson[category].map(p => {
            const updated = { ...p };
            if (newWhatsapp) updated.nomorWA = newWhatsapp; else delete updated.nomorWA;
            return updated;
        });
        
        await updateProductsFile(sha, productsJson, `chore: Update No.WA massal kategori ${category}`);
        res.status(200).json({ message: `No. WhatsApp kategori "${category}" berhasil diperbarui.` });

    } catch (error) {
         res.status(500).json({ message: 'Gagal update No.WA massal.', error: error.message });
    }
});

// Anda bisa menambahkan rute lain seperti deleteProduct, reorderProducts, dll. dengan pola yang sama.


// --- API Manajemen Admin (Domain & API Keys) ---
const adminApiRouter = express.Router();

// Middleware sederhana untuk proteksi (nantinya bisa diganti dengan session/token)
adminApiRouter.use((req, res, next) => {
    // Di sini Anda bisa menambahkan verifikasi apakah user adalah admin
    // Untuk saat ini, kita biarkan lolos
    next();
});

adminApiRouter.route('/apiKeys')
    .get(async (req, res) => {
        const keys = await readJsonFile(keysFilePath, []);
        const activeKeys = keys.filter(k => new Date(k.expiresAt) > new Date());
        await writeJsonFile(keysFilePath, activeKeys);
        res.status(200).json({ keys: activeKeys });
    })
    .post(async (req, res) => {
        const { identifier, duration } = req.body;
        const keys = await readJsonFile(keysFilePath, []);
        const newKey = `RKS_${crypto.randomBytes(16).toString('hex')}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
        
        const keyData = { identifier, key: newKey, createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() };
        keys.push(keyData);
        await writeJsonFile(keysFilePath, keys);
        res.status(201).json(keyData);
    })
    .delete(async (req, res) => {
        const { key } = req.body;
        let keys = await readJsonFile(keysFilePath, []);
        keys = keys.filter(k => k.key !== key);
        await writeJsonFile(keysFilePath, keys);
        res.status(200).json({ message: 'API Key berhasil dihapus.' });
    });

adminApiRouter.route('/domains')
    .get(async (req, res) => {
        const domains = await readJsonFile(domainsFilePath, {});
        res.status(200).json({ domains });
    })
    .post(async (req, res) => {
        const { domain, zoneId, apiToken } = req.body;
        const domains = await readJsonFile(domainsFilePath, {});
        domains[domain] = { zone: zoneId, apitoken: apiToken };
        await writeJsonFile(domainsFilePath, domains);
        res.status(201).json({ message: 'Domain berhasil ditambahkan.' });
    })
    .delete(async (req, res) => {
        const { domain } = req.body;
        const domains = await readJsonFile(domainsFilePath, {});
        delete domains[domain];
        await writeJsonFile(domainsFilePath, domains);
        res.status(200).json({ message: 'Domain berhasil dihapus.' });
    });

adminApiRouter.get('/subdomains', async (req, res) => {
    const subdomains = await readJsonFile(subdomainsFilePath, []);
    res.status(200).json({ subdomains });
});

app.use('/api/admin', adminApiRouter);


// --- API Publik (Reseller) ---
app.get('/api/getAvailableDomains', async (req, res) => {
    const domains = await readJsonFile(domainsFilePath, {});
    res.status(200).json({ domains: Object.keys(domains) });
});

app.post('/api/validateApiKey', async (req, res) => {
    const { key } = req.body;
    const apiKeys = await readJsonFile(keysFilePath, []);
    const validKey = apiKeys.find(k => k.key === key);
    if (!validKey) return res.status(401).json({ message: 'API Key tidak valid.' });
    if (new Date(validKey.expiresAt) < new Date()) return res.status(403).json({ message: 'API Key telah kedaluwarsa.' });
    res.status(200).json({ message: 'API Key valid.', identifier: validKey.identifier });
});

app.post('/api/createSubdomain', async (req, res) => {
    try {
        const { subdomain, domain, ip, apiKey } = req.body;
        
        // Validasi API Key
        const apiKeys = await readJsonFile(keysFilePath, []);
        const validKey = apiKeys.find(k => k.key === apiKey && new Date(k.expiresAt) > new Date());
        if (!validKey) return res.status(403).json({ message: 'API Key tidak valid atau kedaluwarsa.' });

        // Dapatkan Konfigurasi Domain
        const domainsConfig = await readJsonFile(domainsFilePath, {});
        const config = domainsConfig[domain];
        if (!config) return res.status(400).json({ message: 'Domain tidak valid.' });

        const createDnsRecord = async (name) => {
            const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zone}/dns_records`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${config.apitoken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'A', name, content: ip, ttl: 1, proxied: false })
            });
            const data = await response.json();
            if (!data.success) throw new Error(`Cloudflare: ${data.errors.map(e => e.message).join(', ')}`);
        };

        const fullDomain = `${subdomain}.${domain}`;
        const nodeDomain = `node16.${subdomain}.${domain}`;

        await createDnsRecord(fullDomain);
        await createDnsRecord(nodeDomain);

        const subdomainsLog = await readJsonFile(subdomainsFilePath, []);
        subdomainsLog.unshift({ full_domain: fullDomain, ip: ip, user: validKey.identifier, createdAt: new Date().toISOString() });
        await writeJsonFile(subdomainsFilePath, subdomainsLog);

        res.status(200).json({
            message: 'Subdomain berhasil dibuat!',
            created_domain: fullDomain,
            created_node_domain: nodeDomain
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =================================================================
// PENYAJIAN HALAMAN & SERVER START
// =================================================================

// Rute default mengarah ke index.html (toko) atau admin.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Penanganan 404
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
    }
    res.status(404).send('Halaman tidak ditemukan.');
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server Rikishopreal berjalan di http://localhost:${PORT}`);
    console.log(`Akses Toko: http://localhost:${PORT}/`);
    console.log(`Akses Panel Admin: http://localhost:${PORT}/admin.html`);
    console.log(`Akses Halaman Domain: http://localhost:${PORT}/domain.html`);
});
