const express = require('express');
const os = require('os');
const QRCode = require('qrcode');
const router = express.Router();

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!name.toLowerCase().includes('warp') && !name.toLowerCase().includes('virtual')) {
          return iface.address;
        }
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'portfolio-backend'
  });
});

// GET /api/health/network - Returns local network IP, mobile connection URL and base64 QR code
router.get('/network', async (req, res) => {
  try {
    const localIp = getLocalIp();
    const port = 5173;
    const mobileUrl = `http://${localIp}:${port}`;

    const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#09090b',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      ip: localIp,
      port,
      url: mobileUrl,
      qrDataUrl
    });
  } catch (err) {
    console.error('Error generando QR de red:', err);
    res.status(500).json({ error: 'No se pudo generar la información de red' });
  }
});

module.exports = router;
