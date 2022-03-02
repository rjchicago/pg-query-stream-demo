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

dbStream.pipe(transform).pipe(process.stdout);
```

## usage

``` sh
# compose up
docker-compose up

# curl 10 records with batchSize 10
curl -s "http://localhost:3000/stream/10?batchSize=10"

# curl 1000 records with batchSize 100
curl -s "http://localhost:3000/stream/1000?batchSize=100"

# time test example 1,000,000 records
time curl -s "http://localhost:3000/stream/1000000?batchSize=5000&highWaterMark=50000" > /dev/null
```

## links & resources

<https://nodejs.org/api/stream.html#stream>
<https://knexjs.org/#Interfaces-Streams>
<https://www.npmjs.com/package/pg-query-stream>
<https://thenewstack.io/node-js-readable-streams-explained/>
<https://blog.logrocket.com/working-node-js-streams/>
