const { Transform, Readable, pipeline } = require('stream');

class StreamingService {
    static getOptions = (outStream, overrides={}) => {
        const defaults = {
            preHook: () => {StreamingService.writeHead(outStream, 200)},
            errorHook: () => {StreamingService.writeHead(outStream, 500)},
            errorHandler: (error) => {
                if (!error) return;
                const {stack, message} = error;
                console.error({error: Object.assign({}, error, {stack, message})});
            }
        };
        return Object.assign(defaults, overrides);
    };

    static writeHead = (res, status=200) => {
        if (typeof res.headersSent === 'boolean' && !res.headersSent) {
            res.writeHead(status, {
                'Content-Type': 'application/json; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff'
            });
        }
    };

    static getTransform = (preHook) => {
        return new Transform({
            writableObjectMode: true,
            transform(data={}, encoding, callback) {
                // preHook on first data only
                if (!this.comma) preHook();
                // if first data && error then no open/close brackets
                const prefix = this.comma || (data.error ? '' : '[');
                const suffix = this.comma && data.error ? ']' : '';
                this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
                // set comma for subsequent data
                if (!this.comma) this.comma = ',\n';
                callback();
            },
            final(callback) {
                if (!this.comma) this.push('[');
                this.push(']');
                callback();
            }
        });
    };

    static streamData = (outStream, data, options={}) => {
        if (!data) return outStream.end();
        const inStream = new Readable({objectMode: true, read: ()=>{}});
        StreamingService.streamResponse(outStream, inStream, options, data);
    };

    static streamResponse = (outStream, inStream, options={}, data=undefined) => {
        const {preHook, errorHook, errorHandler} = StreamingService.getOptions(outStream, options);
        inStream.on('error', (error) => {
            errorHook();
            inStream.push({error: error.message});
            outStream.end();
        });
        const transform = StreamingService.getTransform(preHook);
        pipeline(inStream, transform, outStream, errorHandler);
        if (data) {
            (Array.isArray(data) ? data : [data]).map(record => inStream.push(record));
            inStream.push(null); // signal stream end
        }
    };
}

module.exports = StreamingService;
