import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const { category, newWhatsapp } = request.body;
        if (!category) {
            return response.status(400).json({ message: 'Kategori wajib diisi.' });
        }
        if (newWhatsapp && !/^\d+$/.test(newWhatsapp)) {
            return response.status(400).json({ message: 'Format nomor WhatsApp salah.' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'products.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const productsJson = JSON.parse(content);
        
        if (!productsJson[category]) {
             return response.status(404).json({ message: 'Kategori produk tidak ditemukan.' });
        }

        productsJson[category] = productsJson[category].map(product => {
            const updatedProduct = { ...product };
            if (newWhatsapp) {
                updatedProduct.nomorWA = newWhatsapp;
            } else {
                delete updatedProduct.nomorWA;
            }
            return updatedProduct;
        });

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `chore: Memperbarui No. WA massal untuk kategori ${category}`,
            content: Buffer.from(JSON.stringify(productsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: `No. WhatsApp untuk kategori "${category}" berhasil diperbarui.` });

    } catch (error) {
        console.error("Error updateBulkWhatsapp:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
