# Demo POC using pg-query-stream

The purpose of this `pg-query-stream` demo is to stream data from Postgres via REST API using transform & pipe, plus error handling.

## transform

`Transform` example converts object-stream to json-stream...

``` js
const connection = {
    host: 'postgres',
    port: 5432,
    user: 'postgres',
    password: 'test',
    database: 'postgres'
};

const QueryStream = require('pg-query-stream')
const knex = require('knex')({
    client: 'pg',
    acquireConnectionTimeout: 500,
    connection
});

const sql = `SELECT num FROM streamy ORDER BY num LIMIT 100`;
const dbStream = knex.raw(sql).stream({batchSize: 1, highWaterMark: 1000});
dbStream.on('error', (error) => {
    dbStream.push({error: error.message, code: error.code});
    dbStream.end();
});

const transform = new Transform({
    writableObjectMode: true,
    construct(callback) {
        this.push('[');
        callback();
    },
    transform(data, encoding, callback) {
        this.push(`${this.comma || ''}${JSON.stringify(data)}`);
        if (!this.comma) this.comma = ',';
        callback();
    },
    final(callback) {
        this.push(']');
        callback();
    }
});

dbStream.pipe(transform).pipe(process.stdout);
```

## usage

``` sh
# compose up
docker-compose up

# curl 10 records with batchSize 10
curl -s "http://localhost:3000/full-stream/10?batchSize=10"

# curl 1000 records with batchSize 100
curl -s "http://localhost:3000/full-stream/1000?batchSize=100"

# time test example 1,000,000 records
time curl -s "http://localhost:3000/full-stream/1000000?batchSize=5000&highWaterMark=50000" > /dev/null
```

## testing

``` sh
# in one shell, monitor docker container stats
docker stats demo

# in one shell, monitor temp dir
while true; do clear; ls -lah temp; sleep 1; done

# in another shell curl tests...
# series tests
curl -s -X GET "http://localhost:3000/half-stream/1000" > ./temp/half-stream-10000json
curl -s -X GET "http://localhost:3000/half-stream/10000" > ./temp/half-stream-10000.json
curl -s -X GET "http://localhost:3000/half-stream/100000" > ./temp/half-stream-100000.json
curl -s -X GET "http://localhost:3000/half-stream/1000000" > ./temp/half-stream-1000000.json
curl -s -X GET "http://localhost:3000/half-stream/10000000" > ./temp/half-stream-10000000.json
# stream tests
curl -s -X GET "http://localhost:3000/full-stream/1000" > ./temp/full-stream-10000json
curl -s -X GET "http://localhost:3000/full-stream/10000" > ./temp/full-stream-10000.json
curl -s -X GET "http://localhost:3000/full-stream/100000" > ./temp/full-stream-100000.json
curl -s -X GET "http://localhost:3000/full-stream/1000000" > ./temp/full-stream-1000000.json
curl -s -X GET "http://localhost:3000/full-stream/10000000" > ./temp/full-stream-10000000.json
# w/ batchSize & highWaterMark overrides
curl -s -X GET "http://localhost:3000/full-stream/1000000?batchSize=10000&highWaterMark=50000" > ./temp/full-stream-1000000.json
```

## links & resources

* <https://nodejs.org/api/full-stream.html#stream>
* <https://knexjs.org/#Interfaces-Streams>
* <https://www.npmjs.com/package/pg-query-stream>
* <https://thenewstack.io/node-js-readable-streams-explained/>
* <https://blog.logrocket.com/working-node-js-streams/>
