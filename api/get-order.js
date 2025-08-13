import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { orderCode } = req.query;

    if (!orderCode) {
        return res.status(400).json({ message: 'Parameter orderCode diperlukan.' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ message: 'MONGODB_URI tidak terkonfigurasi.' });
    }

    let client;
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();

        const db = client.db('Cluster0'); // Nama database di sini
        const ordersCollection = db.collection('orders');

        const orderData = await ordersCollection.findOne({ order_code: orderCode });

        if (orderData) {
            res.status(200).json(orderData);
        } else {
            res.status(404).json({ message: 'Kode order tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal mengambil data dari database.', error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
}
