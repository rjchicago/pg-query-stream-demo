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

const getSeries = async (n=10000) => {
    // const sql = `SELECT id/(id-10) AS test FROM streamy WHERE id <= ${n}`;
    const sql = `SELECT * FROM streamy ORDER BY id LIMIT ${n}`;
    const data = await knex.raw(sql);
    return data.rows;
}

const streamSeries = async (n=10000, batchSize=1000, highWaterMark=10000) => {
    // const sql = `SELECT id/(id-10) AS test FROM streamy WHERE id <= ${n}`;
    const sql = `SELECT * FROM streamy ORDER BY id LIMIT ${n}`;
    return knex.raw(sql).stream({batchSize, highWaterMark});
}

const pgStreamSeries = async (n, batchSize=1000, highWaterMark=10000) => {
    const client = new pg.Client(connection);
    client.connect();
    
    client.on('error', (err) => console.log(`pgClient error: ${JSON.stringify(err)}`));
    client.on('drain', () => console.log('pgClient drain'));
    client.on('notice', () => console.log('pgClient notice'));
    client.on('notification', () => console.log('pgClient notification'));
    client.on('end', () => console.log('pgClient end'));

    const sql = `SELECT * FROM streamy ORDER BY num LIMIT ${n}`;
    const queryStream = new QueryStream(sql, [], {batchSize, highWaterMark});
    const dbStream = client.query(queryStream);
    return dbStream;
}

module.exports = {
    getVersion,
    getSeries,
    streamSeries,
    pgStreamSeries
}
