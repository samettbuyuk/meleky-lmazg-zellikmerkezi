import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Transporter (Lazy initialization)
  const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, ''); // BOŞLUKLARI OTOMATİK SİLER
    
    if (user && pass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: pass,
        },
      });
    }
    return null;
  };

  // API Routes
  app.post("/api/notify-customer", async (req, res) => {
    const { email, name, service, date, time, reason } = req.body;
    
    const transporter = getTransporter();
    if (transporter && email) {
      try {
        await transporter.sendMail({
          from: `"Melek Yılmaz Güzellik Merkezi" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Randevunuz Hakkında Bilgilendirme",
          html: `
            <div style="font-family: sans-serif; padding: 40px; background-color: #fffafb; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0e6e8; border-radius: 20px;">
              <h2 style="color: #674747;">Randevu İptal Bilgilendirmesi</h2>
              <p>Sayın <strong>${name}</strong>,</p>
              <p><strong>${date}</strong> tarihindeki <strong>${service}</strong> randevunuz maalesef iptal edilmiştir.</p>
              
              <div style="background-color: #fff; padding: 20px; border-left: 4px solid #674747; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0;"><strong>İptal Nedeni:</strong> ${reason || 'Belirtilmedi'}</p>
              </div>

              <p>Anlayışınız için teşekkür ederiz. Yeni bir randevu oluşturmak için sitemizi ziyaret edebilirsiniz.</p>
              <p style="font-size: 14px; color: #999; border-top: 1px solid #eee; pt: 20px; margin-top: 30px;">
                Sevgilerle,<br>Melek Yılmaz Güzellik Merkezi
              </p>
            </div>
          `,
        });
        console.log(`✅ İptal maili gönderildi: ${email}`);
      } catch (error) {
        console.error("❌ Müşteri mail hatası:", error);
      }
    }
    res.json({ success: true });
  });

  app.post("/api/notify-admin", async (req, res) => {
    const { name, date, time, service } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'samettbuyuk@gmail.com';
    
    console.log("------------------------------------------");
    console.log(`📩 Yeni Randevu Talebi Bildirimi Hazırlanıyor: ${name}`);
    
    const transporter = getTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Melek Yılmaz Güzellik Merkezi" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: "✨ Yeni Randevu Talebi Sizi Bekliyor",
          html: `
            <div style="font-family: serif; padding: 40px; background-color: #f9f8f6; color: #333;">
              <h1 style="color: #674747; border-bottom: 2px solid #e5e1da; padding-bottom: 20px;">Yeni Randevu Talebi</h1>
              <p style="font-size: 16px; margin: 20px 0;">Sayın Melek Yılmaz Ekibi,</p>
              <div style="background-color: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <p><strong>Müşteri:</strong> ${name}</p>
                <p><strong>Tarih:</strong> ${date}</p>
                <p><strong>Saat:</strong> ${time}</p>
                <p><strong>Hizmet:</strong> ${service}</p>
              </div>
              <p style="margin-top: 30px;">
                <a href="${req.headers.origin}/admin" style="background-color: #674747; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Yönetim Paneline Git</a>
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 40px;">Bu mail Melek Yılmaz Güzellik Merkezi Randevu Sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          `,
        });
        console.log("✅ E-posta başarıyla gönderildi.");
      } catch (error) {
        console.error("❌ E-posta gönderim hatası:", error);
      }
    } else {
      console.log("⚠️ E-posta credentials (EMAIL_USER/EMAIL_PASS) eksik. Mail gönderilemedi.");
      console.log("Log Kaydı (Simülasyon):");
      console.log(`Müşteri: ${name} | Hizmet: ${service}`);
    }
    
    console.log("------------------------------------------");
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
