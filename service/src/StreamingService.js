const { Transform, Readable } = require('stream');

class StreamingService {
    static getTransform = () => {
        return new Transform({
            writableObjectMode: true,
            transform(data, encoding, callback) {
                this.push(`${this.comma || '['}${JSON.stringify(data)}${data.error ? ']' : ''}`);
                if (!this.comma) this.comma = ',\n';
                callback();
            },
            final(callback) {
                if (!this.comma) this.push('[');
                this.push(']');
                callback();
            }
        });
    }

    static streamResponse = (outStream, inStream, data=undefined) => {
        if (!inStream) {
            if (!data) return outStream.end();
            inStream = new Readable({objectMode: true, read: ()=>{}});
        }
        const cleanup = () => { if (!inStream.destroyed) inStream.destroy(); };
        outStream.on('close', cleanup);
        outStream.on('destroy', cleanup);
        outStream.on('error', cleanup);
        inStream.on('error', (error) => {
            console.error({ message: error.message || 'stream error', error });
            inStream.push({ error: error.message, code: error.code });
            outStream.end();
        });
        inStream.pipe(this.getTransform()).pipe(outStream);
        if (data && Array.isArray(data)) {
            data.map(record => inStream.push(record));
            inStream.push(null); // signal stream end
        }
    }
}

module.exports = StreamingService;
