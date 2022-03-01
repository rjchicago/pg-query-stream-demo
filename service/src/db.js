// const knex = require('knex');
const pg = require('pg')
const QueryStream = require('pg-query-stream')

const connection = {
    host: 'postgres',
    port: 5432,
    user: 'postgres',
    password: 'test',
    database: 'postgres'
};


const knex = require('knex')({
    client: 'pg',
    acquireConnectionTimeout: 500,
    connection
});

const getVersion = async () => {
    const sql = 'SELECT VERSION() AS version';
    const result = await knex.raw(sql);
    return result.rows[0].version;
}

const generateSeries = async (n) => {
    const sql = `SELECT * FROM generate_series(1, ${n}) num`;
    const result = await knex.raw(sql);
    return result.rows;
}

const streamSeries = async (n=10000, batchSize=1000, highWaterMark=10000) => {
    const sql = `SELECT * FROM streamy limit ${n}`;
    const dbStream = knex.raw(sql).stream({batchSize, highWaterMark});
    return dbStream;
}

const streamSeries2 = async (n, batchSize=1000, highWaterMark=10000) => {
    const client = new pg.Client(connection);
    client.connect();
    
    client.on('error', (err) => console.log(`pgClient error: ${JSON.stringify(err)}`));
    client.on('drain', () => console.log('pgClient drain'));
    client.on('notice', () => console.log('pgClient notice'));
    client.on('notification', () => console.log('pgClient notification'));
    client.on('end', () => console.log('pgClient end'));

    const sql = `SELECT * FROM streamy limit ${n}`;
    const queryStream = new QueryStream(sql, [], {batchSize, highWaterMark});
    const dbStream = client.query(queryStream);

    // dbStream.on('close', () => console.log('dbStream close'));
    // dbStream.on('disconnect', () => console.log('dbStream disconnect'));
    // dbStream.on('exit', () => console.log('dbStream exit'));
    // dbStream.on('message', () => console.log('dbStream message'));
    // dbStream.on('spawn', () => console.log('dbStream spawn'));
    // dbStream.on('error', () => console.log('dbStream error'));

    return dbStream;
}

module.exports = {
    getVersion,
    generateSeries,
    streamSeries,
    streamSeries2
}
