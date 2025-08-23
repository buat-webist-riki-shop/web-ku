import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const { globalPhoneNumber, categoryPhoneNumbers } = request.body;
        
        // Validasi sederhana
        if (typeof globalPhoneNumber === 'undefined' || typeof categoryPhoneNumbers === 'undefined') {
            return response.status(400).json({ message: 'Data tidak valid.' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'settings.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        // 1. Ambil SHA dari file yang ada
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        const newSettings = {
            globalPhoneNumber,
            categoryPhoneNumbers
        };

        // 2. Update file di GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: 'chore: Memperbarui pengaturan nomor WhatsApp',
            content: Buffer.from(JSON.stringify(newSettings, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Pengaturan berhasil disimpan!' });

    } catch (error) {
        console.error("Error updateSettings:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
