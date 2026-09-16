#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "out");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>TalentoLink</title>
  <style>
    html,body{margin:0;height:100%;background:#070b14;color:#5eead4;font-family:system-ui,sans-serif}
    body{display:grid;place-items:center}
    p{letter-spacing:.14em;text-transform:uppercase;font-size:12px;opacity:.8}
  </style>
</head>
<body>
  <p>TalentoLink</p>
</body>
</html>
`
);
