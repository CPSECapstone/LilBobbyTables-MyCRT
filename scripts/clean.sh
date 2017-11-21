#!/usr/bin/env bash

RESTORE='\033[0m'
RED='\033[00;31m'
GREEN='\033[00;32m'
YELLOW='\033[00;33m'
BLUE='\033[00;34m'
CYAN='\033[00;36m'

START_DIR="$(pwd)"
REPOSITORY_ROOT_DIR=`git rev-parse --show-toplevel 2>/dev/null`
if [ -z "$REPOSITORY_ROOT_DIR" ]; then
   echo "Cannot determine LilBobbyTables-MyCRT root directory. Please run this script from within the repository."
   exit 1
fi
cd $REPOSITORY_ROOT_DIR

echo "Removing all node_modules directories"
find . -name "node_modules" -exec rm -rf '{}' +
echo "Removing all dist directories"
find . -name "dist" -exec rm -rf '{}' +
echo "Removing all loggign directories"
find . -name "logs" -exec rm -rf '{}' +
echo "Removing bootstrap.log"
find . -name "bootstrap.log" -exec rm -rf '{}' +
echo "Removing .tscache folders"
find . -name ".tscache" -exec rm -rf '{}' +
echo "Removing stray tscommand tmp files"
find . -name "tscommand-*.tmp.txt" -exec rm -rf '{}' +
echo "Removing all compiled css"
find . -name "css" -exec rm -rf '{}' +
echo "Removing all bundled js"
find . -name "js" -exec rm -rf '{}' +

