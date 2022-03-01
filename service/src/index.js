require('dotenv').config();

const http = require('http');
const express = require('express');
const db = require('./db');
const { Transform } = require('stream');

const app = express();
const port = 3000;

const endpoints = [];
const doc = (method, endpoint) => {
    const existing = endpoints.find(e => e.endpoint === endpoint);
    if (existing) {
        existing.methods.push(method);
        return;
    }
    endpoints.push({endpoint, methods: [method]});
}
app.get('/', (req, res) => {
    res.send(endpoints.map(i => {
        return `<div>[${i.methods.join(' | ')}] <a href="./${i.endpoint}" target="_blank">${i.endpoint}</a></div>`;
    }).join(''));
});

doc('GET', 'version');
app.get('/version', async (req, res) => {
    const data = await db.getVersion();
    const contentType = typeof data === 'string'
        ? 'text/plain'
        : 'application/json'
    res.setHeader('content-type', contentType);
    res.send(data);
});

doc('GET', 'series/10');
app.get('/series/:n', async (req, res) => {
    const n = Number(req.params.n) || 0;
    const data = await db.generateSeries(n);
    const contentType = typeof data === 'string'
        ? 'text/plain'
        : 'application/json'
    res.setHeader('content-type', contentType);
    res.send(data);
});

doc('GET', 'stream/10');
app.get('/stream/:n', async (req, res) => {
    const n = Number(req.params.n || 10);
    const batchSize = Number(req.query.batchSize || 1000);
    const highWaterMark = Number(req.query.highWaterMark || 10000);    
    const dbStream = await db.streamSeries(n, batchSize, highWaterMark);
    dbStream.on('error', (error) => {console.log(error)});
    
    if (!res.headersSent) {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff'
        });
    }

    const transform = new Transform({
        writableObjectMode: true,
        construct(callback) {
            this.push('[');
            this.comma = false;
            callback();
        },
        transform(data, encoding, callback) {
            if (this.comma) this.push(',');
            else this.comma = true;
            this.push(JSON.stringify(data));
            callback();
        },
        final(callback) {
            this.push(']');
            callback();
        }
    });
    dbStream.pipe(transform).pipe(res).on('error', (err) => console.log(`PIPE ERROR: ${JSON.stringify(err)}`));

    req.on('close', () => {
        if (!dbStream.destroyed) dbStream.end();
    });
});

const server = http.createServer(app);
server.listen(port, () => console.log(`http://localhost:${port}/`));
