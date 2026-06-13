const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, 'build');
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.txt': 'text/plain'
};

http.createServer((request, response) => {
  let route = decodeURIComponent(request.url.split('?')[0]);
  if (route === '/' || !path.extname(route)) route = '/index.html';

  const filePath = path.join(root, route);
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
    });
    response.end(data);
  });
}).listen(port, host, () => {
  console.log(`MyVote preview running at http://localhost:${port}`);
});
