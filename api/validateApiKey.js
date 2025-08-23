import fs from 'fs/promises';
import path from 'path';

const keysFilePath = path.join(process.cwd(), 'apikeys.json');

async function readApiKeys() {
    try {
        const data = await fs.readFile(keysFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ message: 'API Key diperlukan.' });
    }

    try {
        const apiKeys = await readApiKeys();
        const validKey = apiKeys.find(k => k.key === key);

        if (!validKey) {
            return res.status(401).json({ message: 'API Key tidak valid.' });
        }

        if (new Date(validKey.expiresAt) < new Date()) {
            return res.status(403).json({ message: 'API Key telah kedaluwarsa.' });
        }

        res.status(200).json({ message: 'API Key valid.', identifier: validKey.identifier });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
}
