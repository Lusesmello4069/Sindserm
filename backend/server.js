const express = require('express');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const cors = require('cors'); // ✅ Importa o CORS

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Habilita CORS apenas para seu frontend Render
app.use(cors({
  origin: 'https://ficha-sindserm-frontend.onrender.com'
}));

// Upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rota de envio
app.post('/enviar', upload.single('foto'), async (req, res) => {
  try {
    const { nome, dataNascimento, Municipio, Bairro, Ruanumero, secretaria, Funcao, Telefone } = req.body;
    const foto = req.file;

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, 'ficha.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Ficha dos Sócios SINDSERM SRN - PI', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nome completo: ${nome}`);
    doc.text(`Data de nascimento: ${dataNascimento}`);
    doc.text(`Município: ${Municipio}`);
    doc.text(`Bairro: ${Bairro}`);
    doc.text(`Rua / Número: ${Ruanumero}`);
    doc.text(`Secretaria: ${secretaria}`);
    doc.text(`Função: ${Funcao}`);
    doc.text(`Telefone: ${Telefone}`);
    doc.moveDown();

    if (foto) {
      const imgPath = path.join(__dirname, 'foto.jpg');
      fs.writeFileSync(imgPath, foto.buffer);
      doc.image(imgPath, { fit: [200, 200], align: 'center' });
    }

    doc.end();

    stream.on('finish', async () => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sindsermsrn2025@gmail.com',
          pass: 'hveagfvirwqddesb'
        }
      });

      await transporter.sendMail({
        from: '"Ficha dos Sócios SINDSERM SRN - PI" <sindsermsrn2025@gmail.com>',
        to: 'sindsermsrn2025@gmail.com',
        subject: 'Nova ficha enviada',
        text: 'Segue em anexo a ficha preenchida.',
        attachments: [
          { filename: 'ficha.pdf', path: filePath }
        ]
      });

      res.send('Ficha enviada com sucesso!');
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao processar a ficha.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});