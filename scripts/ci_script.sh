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
echo "Preparing Script Environment"
cd $SCRIPTS_DIR
npm install

# install and build all modules
install_module() {
   echo "Installing npm modules for $1"
   cd $1
   npm install --production
   cd $SCRIPTS_DIR
   npm run $2
}

install_module $COMMON_DIR build-common-test
install_module $CAPTURE_DIR build-capture-test
install_module $REPLAY_DIR build-replay-test
install_module $SERVICE_DIR build-service-test
install_module $CLI_DIR build-cli-test

cd $SCRIPTS_DIR
echo "------==[ Testing  ]==------"
npm run test
