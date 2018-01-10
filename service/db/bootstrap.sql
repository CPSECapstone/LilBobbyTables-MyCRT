DROP DATABASE IF EXISTS LBTMyCRT;
CREATE DATABASE LBTMyCRT;
USE LBTMyCRT;

CREATE TABLE Environment (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   iamId INT(11) REFERENCES IAMReference(id),
   dbId INT(11) REFERENCES DBReference(id),
   s3id INT(11) REFERENCES S3Reference(id)
);

CREATE TABLE IAMReference (
   accessKey VARCHAR(32), -- must be encrypted
   secretKey VARCHAR(64), -- must be encrypted
   region VARCHAR(16),
   output VARCHAR(16) DEFAULT 'json'
);

CREATE TABLE DBReference (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   host VARCHAR(64),
   user VARCHAR(32),
   pass VARCHAR(64), -- must be encrypted
   parameterGroup VARCHAR(32)
);

CREATE TABLE S3Reference (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   bucket VARCHAR(32)
);

CREATE TABLE Metrics (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Capture (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   start DATETIME,
   end DATETIME,
   status VARCHAR(32),
   envId INT(11) REFERENCES Environment(id)
);

CREATE TABLE Replay (
   id int(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   start DATETIME,
   end DATETIME,
   capId INT(11) REFERENCES Capture(id)
);
