const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = 'Cluster0'; 

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    if (!MONGODB_URI) {
        return res.status(500).json({ message: 'MONGODB_URI tidak terkonfigurasi.' });
    }

    const { orderCode } = req.body;
    if (!orderCode) {
        return res.status(400).json({ message: 'Parameter orderCode diperlukan.' });
    }

    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();

        const db = client.db(MONGODB_DB_NAME);
        const ordersCollection = db.collection('orders');
        
        const result = await ordersCollection.updateOne(
            { order_code: orderCode },
            { $set: { status: 'completed' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Kode order tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Status pesanan berhasil diperbarui.' });

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal memperbarui status pesanan.', error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
};