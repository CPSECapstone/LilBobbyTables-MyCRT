DROP DATABASE IF EXISTS LBTMyCRT;
CREATE DATABASE LBTMyCRT;
USE LBTMyCRT;

CREATE TABLE Environment (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   iamId INT(11) REFERENCES IAMReference(id),
   dbId INT(11) REFERENCES DBReference(id),
   s3Id INT(11) REFERENCES S3Reference(id)
);

CREATE TABLE IAMReference (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   accessKey VARCHAR(32), -- must be encrypted
   secretKey VARCHAR(64), -- must be encrypted
   region VARCHAR(16),
   output VARCHAR(16) DEFAULT 'json'
);

CREATE TABLE DBReference (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   host VARCHAR(64),
   user VARCHAR(32),
   pass VARCHAR(64), -- must be encrypted
   parameterGroup VARCHAR(32)
);

CREATE TABLE S3Reference (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   bucket VARCHAR(32)
);

CREATE TABLE Metrics (
   id INT(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Capture (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   start DATETIME,
   end DATETIME,
   status VARCHAR(32),
   envId INT(11) REFERENCES Environment(id)
);

CREATE TABLE Replay (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   start DATETIME,
   end DATETIME,
   status VARCHAR(32),
   captureId INT(11) REFERENCES Capture(id)
);

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

