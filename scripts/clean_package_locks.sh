#!/usr/bin/env bash

START_DIR="$(pwd)"
REPOSITORY_ROOT_DIR=`git rev-parse --show-toplevel 2>/dev/null`
if [ -z "$REPOSITORY_ROOT_DIR" ]; then
   echo "Cannot determine LilBobbyTables-MyCRT root directory. Please run this script from within the repository."
   exit 1
fi
cd $REPOSITORY_ROOT_DIR

echo "Removing all package-locks"
find . -name "package-lock.json" -exec rm -rf '{}' +
echo "Removing all node_modules"
find . -name "node_modules" -exec rm -rf '{}' +
