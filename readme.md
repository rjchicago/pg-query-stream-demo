# Demo POC using pg-query-stream

The purpose of this `pg-query-stream` demo is to enable 100% E2E streaming from Postgres to the HTTP client.

Check out my demo video of this project on Youtube:

[![pg-query-stream demo](https://img.youtube.com/vi/1PzKldyuyWU/0.jpg)](https://www.youtube.com/watch?v=1PzKldyuyWU)

## usage

Clone this repo, then...

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

# in another shell, monitor temp dir
while true; do clear; ls -lah temp; sleep 1; done

# in a final shell curl tests...
# raw test
curl -s -X GET "http://localhost:3000/raw/10000000" > ./temp/raw-10000000.json
# series tests
curl -s -X GET "http://localhost:3000/half-stream/1000" > ./temp/half-stream-1000json
curl -s -X GET "http://localhost:3000/half-stream/10000" > ./temp/half-stream-10000.json
curl -s -X GET "http://localhost:3000/half-stream/100000" > ./temp/half-stream-100000.json
curl -s -X GET "http://localhost:3000/half-stream/1000000" > ./temp/half-stream-1000000.json
curl -s -X GET "http://localhost:3000/half-stream/10000000" > ./temp/half-stream-10000000.json
# stream tests
curl -s -X GET "http://localhost:3000/full-stream/1000" > ./temp/full-stream-1000json
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
* <https://www.youtube.com/watch?v=aTEDCotcn20>
