// =================================================================
// SERVER BACKEND RIKISHOPREAL DENGAN EXPRESS.JS (VERSI GITHUB STORAGE)
// =================================================================
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Octokit } from "@octokit/rest";
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// --- KONFIGURASI GITHUB ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// --- FUNGSI HELPER UNTUK GITHUB ---
const getFileFromGithub = async (filePath) => {
    try {
        const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: filePath,
        });
        return {
            sha: data.sha,
            content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
        };
    } catch (error) {
        if (error.status === 404) {
            console.warn(`File ${filePath} not found on GitHub. Returning default empty value.`);
            const defaultValue = filePath.endsWith('s.json') ? [] : {}; // Array untuk apikeys/subdomains, Object untuk domains
            return { sha: null, content: defaultValue };
        }
        throw error;
    }
};

const updateFileOnGithub = async (filePath, sha, content, message) => {
    const params = {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    };
    // Hanya tambahkan SHA jika ada (untuk update file yang sudah ada)
    if (sha) {
        params.sha = sha;
    }
    await octokit.repos.createOrUpdateFileContents(params);
};

// =================================================================
// RUTE API
// =================================================================

// --- API Login Admin ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ganti-dengan-password-aman';
    if (password && password === ADMIN_PASSWORD) {
        res.status(200).json({ message: 'Login berhasil' });
    } else {
        res.status(401).json({ message: 'Password yang Anda masukkan salah.' });
    }
});

// --- API Produk ---
app.post('/api/addProduct', async (req, res) => {
    try {
        const newProductData = req.body;
        if (newProductData.nomorWA && !/^\d+$/.test(newProductData.nomorWA)) {
            return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        }

        const { sha, content: productsJson } = await getFileFromGithub('products.json');
        let maxId = Object.values(productsJson).flat().reduce((max, p) => p.id > max ? p.id : max, 0);
        
        const newProduct = {
            id: maxId + 1,
            nama: newProductData.nama,
            harga: newProductData.harga,
            deskripsiPanjang: newProductData.deskripsiPanjang.replace(/\n/g, ' || '),
            createdAt: new Date().toISOString(),
        };
        if (newProductData.nomorWA) newProduct.nomorWA = newProductData.nomorWA;
        if ((newProductData.category === 'Stock Akun' || newProductData.category === 'Logo') && newProductData.images) newProduct.images = newProductData.images;
        if (newProductData.category === 'Script' && newProductData.menuContent) newProduct.menuContent = newProductData.menuContent;

        if (!productsJson[newProductData.category]) productsJson[newProductData.category] = [];
        productsJson[newProductData.category].unshift(newProduct);

        await updateFileOnGithub('products.json', sha, productsJson, `feat: Menambahkan produk baru "${newProduct.nama}"`);
        res.status(200).json({ message: 'Produk berhasil ditambahkan!', newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
});

app.post('/api/updateProduct', async (req, res) => {
    try {
        const { id, category, newName, newPrice, newDesc, newImages, newMenuContent, newWhatsapp } = req.body;
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        
        const { sha, content: productsJson } = await getFileFromGithub('products.json');
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

        await updateFileOnGithub('products.json', sha, productsJson, `chore: Memperbarui produk ID ${id}`);
        res.status(200).json({ message: 'Produk berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui produk.', error: error.message });
    }
});

app.post('/api/updateBulkWhatsapp', async (req, res) => {
    try {
        const { category, newWhatsapp } = req.body;
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        
        const { sha, content: productsJson } = await getFileFromGithub('products.json');
        if (!productsJson[category]) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });

        productsJson[category] = productsJson[category].map(p => {
            const updated = { ...p };
            if (newWhatsapp) updated.nomorWA = newWhatsapp; else delete updated.nomorWA;
            return updated;
        });
        
        await updateFileOnGithub('products.json', sha, productsJson, `chore: Update No.WA massal kategori ${category}`);
        res.status(200).json({ message: `No. WhatsApp kategori "${category}" berhasil diperbarui.` });
    } catch (error) {
         res.status(500).json({ message: 'Gagal update No.WA massal.', error: error.message });
    }
});

// [BARU] Rute untuk update nomor WA semua produk
app.post('/api/updateAllProductsWhatsapp', async (req, res) => {
    try {
        const { newWhatsapp } = req.body;
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
            return res.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        }

        const { sha, content: productsJson } = await getFileFromGithub('products.json');

        for (const category in productsJson) {
            productsJson[category] = productsJson[category].map(product => {
                const updatedProduct = { ...product };
                if (newWhatsapp) {
                    updatedProduct.nomorWA = newWhatsapp;
                } else {
                    delete updatedProduct.nomorWA;
                }
                return updatedProduct;
            });
        }
        
        await updateFileOnGithub('products.json', sha, productsJson, `chore: Update No.WA for ALL products`);
        res.status(200).json({ message: `Nomor WhatsApp untuk SEMUA produk berhasil diperbarui.` });

    } catch (error) {
         res.status(500).json({ message: 'Gagal melakukan pembaruan global.', error: error.message });
    }
});

// --- API Manajemen Admin (Domain & API Keys) ---
const adminApiRouter = express.Router();

adminApiRouter.route('/apiKeys')
    .get(async (req, res) => {
        try {
            const { content: keys } = await getFileFromGithub('apikeys.json');
            res.status(200).json({ keys });
        } catch (error) {
            res.status(500).json({ message: 'Gagal mengambil API Keys.', error: error.message });
        }
    })
    .post(async (req, res) => {
        try {
            const { identifier, duration } = req.body;
            const { sha, content: keys } = await getFileFromGithub('apikeys.json');
            const newKey = `RKS_${crypto.randomBytes(16).toString('hex')}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
            const keyData = { identifier, key: newKey, createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() };
            keys.push(keyData);
            await updateFileOnGithub('apikeys.json', sha, keys, `feat: Generate API Key for ${identifier}`);
            res.status(201).json(keyData);
        } catch (error) {
            res.status(500).json({ message: 'Gagal membuat API Key.', error: error.message });
        }
    })
    .delete(async (req, res) => {
        try {
            const { key } = req.body;
            const { sha, content: keys } = await getFileFromGithub('apikeys.json');
            const updatedKeys = keys.filter(k => k.key !== key);
            await updateFileOnGithub('apikeys.json', sha, updatedKeys, `chore: Delete API Key`);
            res.status(200).json({ message: 'API Key berhasil dihapus.' });
        } catch (error) {
            res.status(500).json({ message: 'Gagal menghapus API Key.', error: error.message });
        }
    });

adminApiRouter.route('/domains')
    .get(async (req, res) => {
        try {
            const { content: domains } = await getFileFromGithub('domains.json');
            res.status(200).json({ domains });
        } catch (error) {
            res.status(500).json({ message: 'Gagal mengambil daftar domain.', error: error.message });
        }
    })
    .post(async (req, res) => {
        try {
            const { domain, zoneId, apiToken } = req.body;
            const { sha, content: domains } = await getFileFromGithub('domains.json');
            domains[domain] = { zone: zoneId, apitoken: apiToken };
            await updateFileOnGithub('domains.json', sha, domains, `feat: Add domain ${domain}`);
            res.status(201).json({ message: 'Domain berhasil ditambahkan.' });
        } catch (error) {
            res.status(500).json({ message: 'Gagal menambah domain.', error: error.message });
        }
    })
    .delete(async (req, res) => {
        try {
            const { domain } = req.body;
            const { sha, content: domains } = await getFileFromGithub('domains.json');
            delete domains[domain];
            await updateFileOnGithub('domains.json', sha, domains, `chore: Delete domain ${domain}`);
            res.status(200).json({ message: 'Domain berhasil dihapus.' });
        } catch (error) {
             res.status(500).json({ message: 'Gagal menghapus domain.', error: error.message });
        }
    });

adminApiRouter.get('/subdomains', async (req, res) => {
    try {
        const { content: subdomains } = await getFileFromGithub('subdomains.json');
        res.status(200).json({ subdomains });
    } catch (error) {
         res.status(500).json({ message: 'Gagal mengambil daftar subdomain.', error: error.message });
    }
});

app.use('/api/admin', adminApiRouter);

// --- API Publik (Reseller) ---
app.get('/api/getAvailableDomains', async (req, res) => {
    const { content: domains } = await getFileFromGithub('domains.json');
    res.status(200).json({ domains: Object.keys(domains) });
});

app.post('/api/validateApiKey', async (req, res) => {
    const { key } = req.body;
    const { content: apiKeys } = await getFileFromGithub('apikeys.json');
    const validKey = apiKeys.find(k => k.key === key);
    if (!validKey) return res.status(401).json({ message: 'API Key tidak valid.' });
    if (new Date(validKey.expiresAt) < new Date()) return res.status(403).json({ message: 'API Key telah kedaluwarsa.' });
    res.status(200).json({ message: 'API Key valid.', identifier: validKey.identifier });
});

app.post('/api/createSubdomain', async (req, res) => {
    try {
        const { subdomain, domain, ip, apiKey } = req.body;
        
        const { content: apiKeys } = await getFileFromGithub('apikeys.json');
        const validKey = apiKeys.find(k => k.key === apiKey && new Date(k.expiresAt) > new Date());
        if (!validKey) return res.status(403).json({ message: 'API Key tidak valid atau kedaluwarsa.' });

        const { content: domainsConfig } = await getFileFromGithub('domains.json');
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

        const { sha, content: subdomainsLog } = await getFileFromGithub('subdomains.json');
        subdomainsLog.unshift({ full_domain: fullDomain, ip: ip, user: validKey.identifier, createdAt: new Date().toISOString() });
        await updateFileOnGithub('subdomains.json', sha, subdomainsLog, `feat: Create subdomain ${fullDomain}`);

        res.status(200).json({
            message: 'Subdomain berhasil dibuat!',
            created_domain: fullDomain,
            created_node_domain: nodeDomain
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- PENYAJIAN HALAMAN & SERVER START ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
    }
    res.status(404).send('Halaman tidak ditemukan.');
});

app.listen(PORT, () => {
    console.log(`Server Rikishopreal berjalan di http://localhost:${PORT}`);
    console.log(`Akses Toko: http://localhost:${PORT}/`);
    console.log(`Akses Panel Admin: http://localhost:${PORT}/admin.html`);
    console.log(`Akses Halaman Domain: http://localhost:${PORT}/domain.html`);
});
