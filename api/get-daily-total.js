import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = 'Cluster0';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    if (!MONGODB_URI) {
        return res.status(500).json({ message: 'MONGODB_URI tidak terkonfigurasi.' });
    }
    
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(MONGODB_DB_NAME);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await db.collection('orders').aggregate([
            {
                $match: {
                    created_at: {
                        $gte: today,
                        $lt: tomorrow
                    },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_harga' }
                }
            }
        ]).toArray();

        const totalHariIni = result.length > 0 ? result[0].total : 0;
        
        res.status(200).json({ total: totalHariIni });

    } catch (error) {
        console.error('Error saat menghitung total transaksi:', error);
        res.status(500).json({ message: 'Gagal menghitung total transaksi.', error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
}