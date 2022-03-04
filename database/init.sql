
CREATE TABLE streamy(
    id INT PRIMARY KEY,
    name TEXT
);

INSERT INTO streamy
SELECT 
    id as id,
    'ROW-' || LPAD(id::text, 10, '0') as name
FROM generate_series(1, 10000000) id;
