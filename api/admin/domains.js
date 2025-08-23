import fs from 'fs/promises';
import path from 'path';

const domainsFilePath = path.join(process.cwd(), 'domains.json');

// Helper
async function readDomains() {
    try {
        const data = await fs.readFile(domainsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(domainsFilePath, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}

async function writeDomains(data) {
     await fs.writeFile(domainsFilePath, JSON.stringify(data, null, 2));
}

// Handler
export default async function handler(req, res) {
     // Proteksi endpoint ini juga penting
    try {
        if (req.method === 'GET') {
            const domains = await readDomains();
            res.status(200).json({ domains });

        } else if (req.method === 'POST') {
            const { domain, zoneId, apiToken } = req.body;
            if (!domain || !zoneId || !apiToken) {
                return res.status(400).json({ message: 'Data domain tidak lengkap.' });
            }
            const domains = await readDomains();
            if (domains[domain]) {
                return res.status(409).json({ message: 'Domain sudah ada.' });
            }
            domains[domain] = { zone: zoneId, apitoken: apiToken };
            await writeDomains(domains);
            res.status(201).json({ message: 'Domain berhasil ditambahkan.' });

        } else if (req.method === 'DELETE') {
            const { domain } = req.body;
            if (!domain) return res.status(400).json({ message: 'Nama domain diperlukan.' });

            const domains = await readDomains();
            if (!domains[domain]) {
                 return res.status(404).json({ message: 'Domain tidak ditemukan.' });
            }
            delete domains[domain];
            await writeDomains(domains);
            res.status(200).json({ message: 'Domain berhasil dihapus.' });

        } else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch(error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
}
