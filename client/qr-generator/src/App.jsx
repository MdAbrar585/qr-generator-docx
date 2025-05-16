import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setData(res.data);
    } catch (err) {
      alert('Upload failed: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>📄 DOCX to QR Generator</h1>

      <input type="file" accept=".docx" onChange={handleFileChange} />
      {loading && <p>⏳ Processing...</p>}

      <div style={{ marginTop: '20px', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {data.map((item, i) => (
          <div key={i} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
            <p><strong>Holding:</strong> {item.holding}</p>
            <p><strong>NID:</strong> {item.nid}</p>
            <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
            <img
              src={item.qr}
              alt={`QR for ${item.holding}`}
              style={{ marginTop: '10px', width: '100%', maxWidth: '250px', height: 'auto' }}
            />
            <a href={item.qr} download={`qr-${item.holding}.png`}>
              📥 Download QR
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
