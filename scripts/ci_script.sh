#!/usr/bin/env bash

set -e # fail when any single command fails

# set up some variables

ROOT_DIR="$(pwd)"
SCRIPTS_DIR="${ROOT_DIR}/scripts"
COMMON_DIR="${ROOT_DIR}/common"
CAPTURE_DIR="${ROOT_DIR}/capture"
REPLAY_DIR="${ROOT_DIR}/replay"
SERVICE_DIR="${ROOT_DIR}/service"
CLI_DIR="${ROOT_DIR}/cli"

for mod_dir in $ROOT_DIR $SCRIPTS_DIR $COMMON_DIR $CAPTURE_DIR $REPLAY_DIR $SERVICE_DIR $CLI_DIR; do
   if [ ! -d "$mod_dir" ]; then
      echo "Could not find directory for the $(basename $mod_dir) module."
      echo "Make sure this script is being executed from the root of the repository"
      exit 1
   fi
done

# setup for scripts directory
npm config set package-lock false
echo "Preparing Script Environment"
cd $SCRIPTS_DIR
npm install

# install and build all modules
install_module() {
   echo "Installing npm modules for $1"
   cd $1
   npm install --production
}

install_module $COMMON_DIR
install_module $CAPTURE_DIR
install_module $REPLAY_DIR
install_module $SERVICE_DIR
install_module $CLI_DIR

cd $SCRIPTS_DIR
echo "------==[ Building ]==------"
npm run build
echo "------==[ Testing  ]==------"
npm run test
