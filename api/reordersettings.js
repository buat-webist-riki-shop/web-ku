import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const { category, order } = request.body;
        if (!category || !order || !Array.isArray(order)) {
            return response.status(400).json({ message: 'Data tidak valid.' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'settings.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        // 1. Ambil konten file settings.json
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const settingsJson = JSON.parse(content);
        
        if (!settingsJson[category]) {
             return response.status(400).json({ message: 'Kategori produk tidak valid.' });
        }

        const existingsettings = settingsJson[category];
        const newOrderedsettings = [];
        
        // 2. Buat array baru sesuai urutan dari frontend
        order.forEach(id => {
            const product = existingsettings.find(p => p.id === id);
            if (product) {
                newOrderedsettings.push(product);
            }
        });

        // 3. Tambahkan produk yang tidak ada di urutan (jika ada) ke belakang
        existingsettings.forEach(prod => {
            if (!newOrderedsettings.find(p => p.id === prod.id)) {
                newOrderedsettings.push(prod);
            }
        });
        
        // 4. Update kategori dengan urutan yang baru
        settingsJson[category] = newOrderedsettings;

        // 5. Simpan ke GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `chore: Memperbarui urutan produk di kategori ${category}`,
            content: Buffer.from(JSON.stringify(settingsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Urutan produk berhasil diperbarui.' });

    } catch (error) {
        console.error("Error reordersettings:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
