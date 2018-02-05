#!/usr/bin/env bash

sq_dir=${SONARQUBE_DIR?"please set the SONARQUBE_DIR environment variable"}

echo "Starting server at localhost:9000"
$sq_dir/sonar.sh console
