require('dotenv').config();

const http = require('http');
const express = require('express');
const db = require('./db');
const { Readable } = require('stream');
const StreamingService = require('./StreamingService');

const app = express();
const port = 3000;

const writeStreamingHeaders = (res, status=200) => {
    if (!res.headersSent) {
        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff'
        });
    }
};

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
    try {
        const data = await db.getVersion();
        const contentType = typeof data === 'string'
            ? 'text/plain'
            : 'application/json'
        res.setHeader('content-type', contentType);
        res.send(data);
    } catch (error) {
        const {stack, message} = error;
        res.status(500).send({error: Object.assign({}, error, {stack, message})});
    }
});

doc('GET', 'raw/10');
app.get('/raw/:n', async (req, res) => {
    const n = Number(req.params.n) || 0;
    try {
        const data = await db.getSeries(n);
        res.send(data);
    } catch (error) {
        const {stack, message} = error;
        res.status(500).send({error: Object.assign({}, error, {stack, message})});
    }
});

doc('GET', 'half-stream/10');
app.get('/half-stream/:n', async (req, res) => {
    const n = Number(req.params.n) || 0;
    try {
        const data = await db.getSeries(n);
        writeStreamingHeaders(res, 200);
        StreamingService.streamData(res, data);
    } catch (error) {
        const {stack, message} = error;
        res.status(500).send({error: Object.assign({}, error, {stack, message})});
    }
});

doc('GET', 'full-stream/10');
app.get('/full-stream/:n', async (req, res) => {
    const n = Number(req.params.n || 10);
    const batchSize = Number(req.query.batchSize || 1000);
    const highWaterMark = Number(req.query.highWaterMark || 10000);    
    try {
        const dbStream = await db.streamSeries(n, batchSize, highWaterMark);
        StreamingService.streamResponse(res, dbStream);
        // Example Options Override:
        // StreamingService.streamResponse(res, dbStream, null, {
        //     preHook: () => writeStreamingHeaders(res, 200),
        //     errorHook: () => writeStreamingHeaders(res, 500)
        // });
    } catch (error) {
        const {stack, message} = error;
        res.status(500).send({error: Object.assign({}, error, {stack, message})});
    }
});

const server = http.createServer(app);
server.listen(port, () => console.log(`http://localhost:${port}/`));
