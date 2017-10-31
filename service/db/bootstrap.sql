# TODO: populate this

DROP DATABASE IF EXISTS LBTMyCRT;
CREATE DATABASE LBTMyCRT;
USE LBTMyCRT;

CREATE TABLE Environment (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE DBReference (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE S3Reference (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Metrics (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Capture (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);

CREATE TABLE Replay (
   id int(11) AUTO_INCREMENT PRIMARY KEY
);