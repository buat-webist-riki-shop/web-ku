import fs from 'fs/promises';
import path from 'path';

const domainsFilePath = path.join(process.cwd(), 'domains.json');
const keysFilePath = path.join(process.cwd(), 'apikeys.json');
const subdomainsFilePath = path.join(process.cwd(), 'subdomains.json');

async function readJsonFile(filePath, defaultValue) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
             await fs.writeFile(filePath, JSON.stringify(defaultValue));
             return defaultValue;
        }
        throw error;
    }
}

async function createDnsRecord(zoneId, apiToken, name, content) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'A',
            name: name,
            content: content,
            ttl: 1, // Automatic
            proxied: false
        })
    });
    const data = await response.json();
    if (!data.success) {
        // Cek jika error karena duplikat
        if (data.errors.some(e => e.code === 81057)) {
            throw new Error(`DNS record untuk ${name} sudah ada.`);
        }
        throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
    }
    return data.result;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { subdomain, domain, ip, apiKey } = req.body;

    // 1. Validasi Input
    if (!subdomain || !domain || !ip || !apiKey) {
        return res.status(400).json({ message: 'Semua data wajib diisi.' });
    }

    try {
        // 2. Validasi API Key
        const apiKeys = await readJsonFile(keysFilePath, []);
        const validKey = apiKeys.find(k => k.key === apiKey);
        if (!validKey || new Date(validKey.expiresAt) < new Date()) {
            return res.status(403).json({ message: 'API Key tidak valid atau kedaluwarsa.' });
        }

        // 3. Ambil Konfigurasi Domain
        const domainsConfig = await readJsonFile(domainsFilePath, {});
        const config = domainsConfig[domain];
        if (!config) {
            return res.status(400).json({ message: 'Domain yang dipilih tidak valid.' });
        }

        const fullDomain = `${subdomain}.${domain}`;
        const nodeDomain = `node16.${subdomain}.${domain}`;

        // 4. Buat DNS Records di Cloudflare
        await createDnsRecord(config.zone, config.apitoken, fullDomain, ip);
        await createDnsRecord(config.zone, config.apitoken, nodeDomain, ip);

        // 5. Log Subdomain yang dibuat
        const subdomainsLog = await readJsonFile(subdomainsFilePath, []);
        subdomainsLog.unshift({ 
            full_domain: fullDomain, 
            ip: ip,
            user: validKey.identifier,
            createdAt: new Date().toISOString() 
        });
        await fs.writeFile(subdomainsFilePath, JSON.stringify(subdomainsLog, null, 2));


        res.status(200).json({
            message: 'Subdomain berhasil dibuat!',
            created_domain: fullDomain,
            created_node_domain: nodeDomain
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Terjadi kesalahan server.' });
    }
}
