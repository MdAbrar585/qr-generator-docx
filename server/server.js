// server/server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Convert English digits to Bangla (e.g., 471 → ৪৭১)
const convertToBanglaDigits = (num) => {
  const eng = '0123456789';
  const bng = '০১২৩৪৫৬৭৮৯';
  return String(num)
    .split('')
    .map((c) => bng[eng.indexOf(c)] ?? c)
    .join('');
};

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const path = req.file.path;
    const result = await mammoth.extractRawText({ path });
    const text = result.value;

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    console.log('🧾 Total lines:', lines.length);
    console.log('📄 Sample lines:', lines.slice(0, 10));

    const isEnglishDigits = (str) => /^[0-9]{10,17}$/.test(str);
    const isLikelyHolding = (str) => /^[0-9]{1,4}$/.test(str);

    const data = [];
    let currentHolding = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`🔍 Line ${i}: "${line}"`);

      if (isLikelyHolding(line)) {
        currentHolding = line;
        console.log(`➡️ Found holding: ${currentHolding}`);
        continue;
      }

      if (isEnglishDigits(line)) {
        if (!currentHolding) {
          console.log(`⚠️ Found NID without holding: ${line}`);
          continue;
        }

        const banglaHolding = `০৪-${convertToBanglaDigits(currentHolding)}`;
        const nid = line;
        const url = `https://www.hoanakup.com/holding/${banglaHolding}?nid=${nid}`;
        const qr = await QRCode.toDataURL(url);

        console.log(`✅ Matched pair: ${banglaHolding}, ${nid}`);

        data.push({ holding: banglaHolding, nid, url, qr });

        currentHolding = null; // reset after using
      }
    }

    fs.unlinkSync(path); // cleanup
    res.json(data);
  } catch (err) {
    console.error('❌ ERROR:', err);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.listen(3001, () => console.log('✅ Server running on http://localhost:3001'));
