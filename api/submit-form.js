import nodemailer from 'nodemailer';
import { Client } from 'pg';

const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    // Pastikan DATABASE_URL sudah diatur di Environment Variables Vercel
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ message: 'DATABASE_URL tidak terkonfigurasi.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        const { produkList, totalHarga, namaPanel, metodeBayar, kodeOrder, tanggal } = req.body;

        const produkItems = produkList.map(item => `  - ${item.nama} (Rp ${item.harga.toLocaleString('id-ID')})`).join('\n');

        // ------ Simpan data ke Supabase (PostgreSQL) ------
        const query = `
            INSERT INTO orders (order_code, nama_panel, produk_list, total_harga, metode_pembayaran, tanggal)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (order_code) DO NOTHING;
        `;
        // produk_list disimpan sebagai JSON string menggunakan JSON.stringify
        const values = [kodeOrder, namaPanel, JSON.stringify(produkList), totalHarga, metodeBayar, tanggal];

        await client.query(query, values);
        
        // ------ Kirim notifikasi email ------
        const emailText = `
            Ada pesanan baru dari website!
            -----------------------------
            Nama Panel: ${namaPanel}
            Produk:
            ${produkItems}
            Total Harga: Rp ${totalHarga.toLocaleString('id-ID')}
            Metode Pembayaran: ${metodeBayar}
            Tanggal Order: ${tanggal}
            Kode Order: ${kodeOrder}
        `;

        const mailOptions = {
            from: `"Formulir Pemesanan" <${process.env.EMAIL_USER}>`,
            to: 'ahmatputra312@gmail.com',
            subject: `Pesanan Baru #${kodeOrder}`,
            text: emailText
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Notifikasi email berhasil dikirim dan data disimpan.' });

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal memproses pesanan.', error: error.message });
    } finally {
        // Pastikan koneksi database selalu ditutup
        await client.end();
    }
}
