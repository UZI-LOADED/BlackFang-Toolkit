const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const shell = require('shelljs');
const pty = require('node-pty');
const pcap = require('pcap');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

// Serve dashboard main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle script uploads for execution (sandbox or live)
app.post('/upload-script', upload.single('script'), (req, res) => {
  const sandbox = req.body.sandbox === 'true';
  const scriptPath = req.file.path;

  // Execute script either sandboxed or live
  if (sandbox) {
    // Sandbox execution - restrict commands, no network, etc. (mock example)
    shell.exec(`bash ${scriptPath}`, { silent: true, env: { SANDBOX: 'true' } }, (code, stdout, stderr) => {
      res.json({ code, stdout, stderr });
      fs.unlinkSync(scriptPath);
    });
  } else {
    // Live execution
    shell.exec(`bash ${scriptPath}`, (code, stdout, stderr) => {
      res.json({ code, stdout, stderr });
      fs.unlinkSync(scriptPath);
    });
  }
});

// PTY shell sessions via Socket.io for interactive shells
io.on('connection', (socket) => {
  const shellPty = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  shellPty.on('data', (data) => {
    socket.emit('shell-output', data);
  });

  socket.on('shell-input', (input) => {
    shellPty.write(input);
  });

  socket.on('disconnect', () => {
    shellPty.kill();
  });
});

// Simple network sniffing example using pcap
let session;
app.post('/start-sniff', (req, res) => {
  const iface = req.body.interface || 'eth0';
  try {
    session = pcap.createSession(iface, 'tcp');
    session.on('packet', (rawPacket) => {
      const packet = pcap.decode.packet(rawPacket);
      io.emit('sniffed-packet', packet);
    });
    res.json({ status: 'Sniffing started on ' + iface });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/stop-sniff', (req, res) => {
  if (session) {
    session.close();
    session = null;
    res.json({ status: 'Sniffing stopped' });
  } else {
    res.json({ status: 'No sniffing session running' });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`BlackFang Toolkit listening on http://localhost:${PORT}`);
});
