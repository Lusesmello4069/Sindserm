require('dotenv').config(); // ← Carrega as variáveis do arquivo .env

const express = require('express');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar multer para armazenar arquivos na memória (foto do formulário)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Habilitar CORS para permitir comunicação com o frontend hospedado
app.use(cors({
  origin: 'https://ficha-sindserm-frontend.onrender.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para interpretar dados enviados no body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de envio da ficha
app.post('/enviar', upload.single('foto'), async (req, res) => {
  try {
    const { nome, dataNascimento, Municipio, Bairro, Ruanumero, secretaria, Funcao, Telefone } = req.body;
    const foto = req.file;

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, 'ficha.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Conteúdo do PDF
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

    // Se houver foto, adicionar ao PDF
    let imgPath = null;
    if (foto) {
      imgPath = path.join(__dirname, 'foto_temp.jpg');
      fs.writeFileSync(imgPath, foto.buffer);
      doc.image(imgPath, { fit: [200, 200], align: 'center' });
    }

    doc.end();

    // Após gerar o PDF, enviar e-mail com anexo
    stream.on('finish', async () => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sindsermsrn2025@gmail.com',
          pass: process.env.hveagfvirwqddesb
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

      // Apagar arquivos temporários
      if (imgPath) fs.unlinkSync(imgPath);
      fs.unlinkSync(filePath);

      res.send('Ficha enviada com sucesso!');
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao processar a ficha.');
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});