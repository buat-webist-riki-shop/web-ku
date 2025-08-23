import fs from 'fs/promises';
import path from 'path';

const subdomainsFilePath = path.join(process.cwd(), 'subdomains.json');

async function readSubdomains() {
    try {
        const data = await fs.readFile(subdomainsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    try {
        const subdomains = await readSubdomains();
        res.status(200).json({ subdomains });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membaca daftar subdomain.' });
    }
}
