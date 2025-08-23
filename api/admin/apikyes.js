import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const keysFilePath = path.join(process.cwd(), 'apikeys.json');

// Helper untuk membaca & menulis file
async function readKeys() {
    try {
        const data = await fs.readFile(keysFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}
async function writeKeys(data) {
    await fs.writeFile(keysFilePath, JSON.stringify(data, null, 2));
}

// Handler utama
export default async function handler(req, res) {
    // Di dunia nyata, Anda harus memproteksi endpoint ini!
    // Misalnya, dengan memeriksa sesi admin.
    // Karena ini Vercel Serverless, kita asumsikan proteksi ada di level lain.

    try {
        if (req.method === 'GET') {
            const keys = await readKeys();
            // Filter out expired keys for display
            const activeKeys = keys.filter(k => new Date(k.expiresAt) > new Date());
            await writeKeys(activeKeys); // Membersihkan file dari key expired
            res.status(200).json({ keys: activeKeys });

        } else if (req.method === 'POST') {
            const { identifier, duration } = req.body; // duration in days
            if (!identifier || !duration) {
                return res.status(400).json({ message: 'Identifier dan durasi diperlukan.' });
            }

            const keys = await readKeys();
            const newKey = `RKS_${crypto.randomBytes(16).toString('hex')}`;
            const now = new Date();
            const expiresAt = new Date(now.setDate(now.getDate() + parseInt(duration)));
            
            const keyData = {
                identifier,
                key: newKey,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            };
            keys.push(keyData);
            await writeKeys(keys);
            res.status(201).json(keyData);

        } else if (req.method === 'DELETE') {
             const { key } = req.body;
             if (!key) return res.status(400).json({ message: 'Key diperlukan.' });

             let keys = await readKeys();
             const initialLength = keys.length;
             keys = keys.filter(k => k.key !== key);
             if(keys.length === initialLength) {
                 return res.status(404).json({message: 'API Key tidak ditemukan.'})
             }

             await writeKeys(keys);
             res.status(200).json({ message: 'API Key berhasil dihapus.' });

        } else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
}
