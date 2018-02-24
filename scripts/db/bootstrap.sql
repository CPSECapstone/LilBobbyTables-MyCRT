-- setup the mycrt database
SOURCE db/mycrt.sql;

-- TODO: find a way to disable this when running in a production mode
CREATE TABLE LilBobbyTables (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   time DATETIME
);
INSERT INTO LilBobbyTables (name, time) VALUES ("Cameron Taylor", NOW());
INSERT INTO LilBobbyTables (name, time) VALUES ("Hilary Schulz", NOW());
INSERT INTO LilBobbyTables (name, time) VALUES ("Brandon Newby", NOW());
INSERT INTO LilBobbyTables (name, time) VALUES ("Nish Dara", NOW());
INSERT INTO LilBobbyTables (name, time) VALUES ("Christiana Ushana", NOW());
INSERT INTO LilBobbyTables (name, time) VALUES ("Alex Deany", NOW());

