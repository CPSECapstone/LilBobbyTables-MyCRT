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
cd $SCRIPTS_DIR
npm install

# install and build all modules
install_and_build() {
   cd $1
   npm install --production
   cd $SCRIPTS_DIR
   npm run $2
}

install_and_build $COMMON_DIR build-common
install_and_build $CAPTURE_DIR build-capture
install_and_build $REPLAY_DIR build-replay
install_and_build $SERVICE_DIR build-service
install_and_build $CLI_DIR build-cli
