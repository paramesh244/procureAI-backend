const Imap = require('node-imap');
require('dotenv').config();

const imap = new Imap({
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASS,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: true
});

imap.once('ready', function () {
  console.log("IMAP connected");
  imap.end();
});

imap.once('error', function (err) {
  console.log("IMAP error:", err);
});

imap.connect();
