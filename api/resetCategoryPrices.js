import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const { category } = request.body;
        if (!category) {
            return response.status(400).json({ message: 'Kategori tidak boleh kosong.' });
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
             return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }

        // Kembalikan harga ke hargaAsli dan hapus info diskon
        productsJson[category] = productsJson[category].map(product => {
            if (product.hargaAsli && product.hargaAsli > 0) {
                product.harga = product.hargaAsli;
                product.discountPrice = null;
                product.discountEndDate = null;
            }
            return product;
        });

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `feat: Mengembalikan harga awal untuk kategori ${category}`,
            content: Buffer.from(JSON.stringify(productsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: `Harga untuk kategori "${category}" berhasil dikembalikan ke harga awal.` });

    } catch (error) {
        console.error("Error resetCategoryPrices:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
