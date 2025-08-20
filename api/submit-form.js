import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';

const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    if (!process.env.MONGODB_URI) {
        return res.status(500).json({ message: 'MONGODB_URI tidak terkonfigurasi.' });
    }

    let client;
    try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();

        const db = client.db('Cluster0');
        const ordersCollection = db.collection('orders');

        const { produkList, totalHarga, namaPanel, metodeBayar, kodeOrder, tanggal } = req.body;

        const orderData = {
            order_code: kodeOrder,
            nama_panel: namaPanel,
            produk_list: produkList,
            total_harga: totalHarga,
            metode_pembayaran: metodeBayar,
            tanggal: tanggal,
            // Menambahkan status 'pending' untuk integrasi bot
            status: 'pending', 
            created_at: new Date()
        };

        await ordersCollection.insertOne(orderData);

        const produkItems = produkList.map(item => `  - ${item.nama} (Rp ${item.harga.toLocaleString('id-ID')})`).join('\n');

        const emailText = `
            Ada pesanan baru dari website!
            -----------------------------
            Nama Panel: ${namaPanel}
            Produk:
            ${produkItems}
            kontak: ${contact}
            Total Harga: Rp ${totalHarga.toLocaleString('id-ID')}
            Metode Pembayaran: ${metodeBayar}
            Tanggal Order: ${tanggal}
            Kode Order: ${kodeOrder}
        `;

        const mailOptions = {
            from: `"Formulir Pemesanan" <${process.env.EMAIL_USER}>`,
            to: 'kantindg@gmail.com',
            subject: `Pesanan Baru #${kodeOrder}`,
            text: emailText
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Notifikasi email berhasil dikirim dan data disimpan.' });

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal memproses pesanan.', error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
}
