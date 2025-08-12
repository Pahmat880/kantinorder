const nodemailer = require('nodemailer');

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

    try {
        const { produkList, totalHarga, namaPanel, metodeBayar, kodeOrder, tanggal } = req.body;

        const produkItems = produkList.map(item => `  - ${item.nama} (Rp ${item.harga.toLocaleString('id-ID')})`).join('\n');

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
            to: ahmatptt@gmail.com,
            subject: `Pesanan Baru #${kodeOrder}`,
            text: emailText
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Notifikasi email berhasil dikirim.' });

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).json({ message: 'Gagal memproses pesanan.', error: error.message });
    }
}