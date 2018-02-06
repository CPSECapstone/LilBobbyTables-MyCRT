#!/usr/bin/env bash

scanner_dir=${SONAR_SCAN_DIR?"please set the SONAR_SCAN_DIR environment variable"}
$scanner_dir/bin/sonar-scanner
