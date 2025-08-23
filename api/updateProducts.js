import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        // Mengambil semua data baru dari body request, termasuk untuk diskon
        const { 
            id, category, newName, hargaAsli, harga, 
            discountPrice, discountEndDate, 
            newDesc, newImages, newMenuContent, nomorWA 
        } = request.body;

        if (!id || !category) {
            return response.status(400).json({ message: 'ID produk dan kategori wajib diisi.' });
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

        let productFound = false;
        productsJson[category] = productsJson[category].map(product => {
            if (product.id === id) {
                productFound = true;
                
                // Memperbarui semua properti produk
                product.nama = newName;
                product.hargaAsli = hargaAsli;
                product.harga = harga;
                product.discountPrice = discountPrice ? Number(discountPrice) : null;
                product.discountEndDate = discountEndDate || null;
                product.deskripsiPanjang = newDesc;
                product.nomorWA = nomorWA || ""; // Pastikan nomor WA adalah string

                // Hanya update jika ada data baru
                if (newImages !== null && typeof newImages !== 'undefined') {
                    product.images = newImages;
                }
                if (newMenuContent !== null && typeof newMenuContent !== 'undefined') {
                    product.menuContent = newMenuContent;
                }
            }
            return product;
        });

        if (!productFound) {
            return response.status(404).json({ message: 'Produk dengan ID tersebut tidak ditemukan di kategori ini.' });
        }

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `feat: Memperbarui produk ID ${id} - ${newName}`,
            content: Buffer.from(JSON.stringify(productsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Produk berhasil diperbarui!' });

    } catch (error) {
        console.error("Error di updateProduct.js:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}