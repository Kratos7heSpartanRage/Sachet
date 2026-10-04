const http = require('http');
const req = http.request('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('HTTP', res.statusCode, body));
});
req.on('error', console.error);
req.write(JSON.stringify({ lang: 'en', text: 'test msg' }));
req.end();
