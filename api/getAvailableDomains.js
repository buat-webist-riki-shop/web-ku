import fs from 'fs/promises';
import path from 'path';

const domainsFilePath = path.join(process.cwd(), 'domains.json');

async function readDomains() {
    try {
        const data = await fs.readFile(domainsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jika file tidak ada, buat file kosong
        if (error.code === 'ENOENT') {
            await fs.writeFile(domainsFilePath, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    try {
        const domains = await readDomains();
        res.status(200).json({ domains: Object.keys(domains) });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membaca daftar domain.' });
    }
}
