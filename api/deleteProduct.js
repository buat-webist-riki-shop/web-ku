import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'DELETE') {
        return response.status(405).json({ message: 'Metode tidak diizinkan' });
    }

    try {
        const { id, category } = request.body;
        if (!id || !category) {
            return response.status(400).json({ message: 'ID dan kategori produk wajib diisi.' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'settings.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        // Ambil file settings.json dari GitHub
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const settingsJson = JSON.parse(content);

        if (!settingsJson[category]) {
            return response.status(400).json({ message: 'Kategori tidak valid.' });
        }

        // Filter produk
        const updatedsettings = settingsJson[category].filter(prod => prod.id !== id);

        if (updatedsettings.length === settingsJson[category].length) {
            return response.status(404).json({ message: 'Produk tidak ditemukan.' });
        }

        settingsJson[category] = updatedsettings;

        // Simpan ke GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `chore: Menghapus produk ID ${id}`,
            content: Buffer.from(JSON.stringify(settingsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Produk berhasil dihapus.' });

    } catch (error) {
        console.error("Error deleteProduct:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}