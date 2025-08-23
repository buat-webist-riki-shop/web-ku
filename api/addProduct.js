import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan' });
    }

    try {
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

        const newProductData = request.body;
        
        // Validasi nomor WhatsApp
        if (newProductData.nomorWA && !/^\d+$/.test(newProductData.nomorWA)) {
            return response.status(400).json({ message: 'Format nomor WhatsApp salah. Harus berupa angka saja.' });
        }
        
        let maxId = 0;
        Object.values(productsJson).flat().forEach(product => {
            if (product.id > maxId) maxId = product.id;
        });
        const newId = maxId + 1;
        
        const newProduct = {
            id: newId,
            nama: newProductData.nama,
            harga: newProductData.harga,
            deskripsiPanjang: newProductData.deskripsiPanjang.replace(/\n/g, ' || '),
            createdAt: newProductData.createdAt
        };

        // Menyimpan nomorWA jika ada
        if (newProductData.nomorWA) {
            newProduct.nomorWA = newProductData.nomorWA;
        }

        if ((newProductData.category === 'Stock Akun' || newProductData.category === 'Logo') && newProductData.images && newProductData.images.length > 0) {
            newProduct.images = newProductData.images;
        }

        if (newProductData.category === 'Script' && newProductData.menuContent) {
            newProduct.menuContent = newProductData.menuContent;
        }
        
        if (!productsJson[newProductData.category]) {
            productsJson[newProductData.category] = [];
        }
        productsJson[newProductData.category].unshift(newProduct); 

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: `feat: Menambahkan produk baru "${newProduct.nama}"`,
            content: Buffer.from(JSON.stringify(productsJson, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Produk berhasil ditambahkan!', newProduct });

    } catch (error) {
        console.error("Kesalahan Backend:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
