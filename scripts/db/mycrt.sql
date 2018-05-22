DROP DATABASE IF EXISTS LBTMyCRT;
CREATE DATABASE LBTMyCRT;
USE LBTMyCRT;

CREATE TABLE User (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   email VARCHAR(256) NOT NULL,
   passwordHash VARCHAR(256) NOT NULL,
   isAdmin TINYINT(1) DEFAULT 0,

   -- Session Stuff
   sessionToken VARCHAR(32) DEFAULT NULL,
   loginTime BIGINT(11) DEFAULT NULL,
   lastTokenCheck BIGINT(11) DEFAULT NULL,

   CONSTRAINT userEmailUnique
      UNIQUE (email)
);

CREATE TABLE Environment (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32) UNIQUE,
   ownerId INT(11) REFERENCES User(id),
   awsKeysId INT(11) REFERENCES AwsKeys(id),
   dbId INT(11) REFERENCES DBReference(id),
   s3Id INT(11) REFERENCES S3Reference(id),
   CONSTRAINT ownerIdKey
      FOREIGN KEY (ownerId)
      REFERENCES User(id)
      ON DELETE SET NULL
);

CREATE TABLE EnvironmentUser (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   environmentId INT(11) NOT NULL REFERENCES Environment(id),
   userId INT(11) NOT NULL REFERENCES User(id),
   isAdmin TINYINT(1) DEFAULT 0,
   inviteCode VARCHAR(8) NOT NULL,
   accepted TINYINT(1) DEFAULT 0,
   acceptedAt BIGINT(11),
   createdAt BIGINT(11) NOT NULL,
   CONSTRAINT environmentIdKey
      FOREIGN KEY (environmentId)
      REFERENCES Environment(id)
      ON DELETE CASCADE,
   CONSTRAINT userIdKey
      FOREIGN KEY (userId)
      REFERENCES User(id)
      ON DELETE CASCADE
);

CREATE TABLE AwsKeys (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   accessKey VARCHAR(256),
   secretKey VARCHAR(256),
   region VARCHAR(16),
   output VARCHAR(16) DEFAULT 'json',
   name VARCHAR(32),
   userId INT(11) REFERENCES User(id)
);

CREATE TABLE DBReference (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   host VARCHAR(64),
   user VARCHAR(256),
   pass VARCHAR(256),
   instance VARCHAR(32),
   parameterGroup VARCHAR(32)
);

CREATE TABLE S3Reference (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   bucket VARCHAR(32),
   prefix VARCHAR(32)
);

CREATE TABLE Capture (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(32),
   ownerId INT(11) REFERENCES User(id),
   start DATETIME,
   scheduledStart DATETIME DEFAULT NULL,
   scheduledEnd DATETIME DEFAULT NULL,
   end DATETIME,
   status VARCHAR(32),
   reason VARCHAR(100),
   envId INT(11) REFERENCES Environment(id),
   CONSTRAINT captureOwnerIdKey
      FOREIGN KEY (ownerId)
      REFERENCES User(id)
      ON DELETE SET NULL
);

CREATE TABLE Replay (
   id INT(11) AUTO_INCREMENT PRIMARY KEY,
   ownerId INT(11) REFERENCES User(id),
   captureId INT(11),
   dbId INT(11) REFERENCES DBReference(id),
   name VARCHAR(32),
   start DATETIME,
   scheduledStart DATETIME DEFAULT NULL,
   end DATETIME,
   status VARCHAR(32),
   reason VARCHAR(100),
   CONSTRAINT capKey
      FOREIGN KEY (captureId)
      REFERENCES Capture(id) ON DELETE CASCADE,
   CONSTRAINT dbKey
      FOREIGN KEY (dbId)
      REFERENCES DBReference(id),
   CONSTRAINT replayOnwerIdKey
      FOREIGN KEY (ownerId)
      REFERENCES User(id)
      ON DELETE SET NULL
);
