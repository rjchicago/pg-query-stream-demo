
CREATE TABLE streamy(num INT PRIMARY KEY);

INSERT INTO streamy
SELECT * FROM generate_series(1, 1000000) num;
