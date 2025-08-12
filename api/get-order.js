import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { orderCode } = req.query;

    if (!orderCode) {
        return res.status(400).json({ message: 'Parameter orderCode diperlukan.' });
    }

    if (!process.env.POSTGRES_URL) { // Perubahan di sini
        return res.status(500).json({ message: 'POSTGRES_URL tidak terkonfigurasi.' });
    }

    const client = new Client({
        connectionString: process.env.POSTGRES_URL, // Perubahan di sini
    });

    try {
        await client.connect();

        const query = 'SELECT * FROM orders WHERE order_code = $1';
        const result = await client.query(query, [orderCode]);

        if (result.rows.length > 0) {
            const orderData = result.rows[0];
            orderData.produk_list = JSON.parse(orderData.produk_list);
            res.status(200).json(orderData);
        } else {
            res.status(404).json({ message: 'Kode order tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal mengambil data dari database.', error: error.message });
    } finally {
        await client.end();
    }
}
