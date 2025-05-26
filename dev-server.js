const https = require('https');
const fs   = require('fs');

https.createServer(options, (req, res) => {
    if (req.url === '/' || (req.url[0] === '/' && req.url[1] === '?')) {
        fs.readFile('./build/index.html', (_, data) => {
            res.end(data);
        })
    } else if (req.url === '/sw.js') {
        fs.readFile('./build/sw.js', (_, data) => {
            res.setHeader('Content-Type', 'text/javascript');
            res.end(data);
        })
    } else {
        fs.readFile(`./build${req.url}`, (_, data) => {
            res.end(data);
        }) 
    }
}).listen(8080, "0.0.0.0");