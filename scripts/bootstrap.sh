#!/usr/bin/env bash

RESTORE='\033[0m'
RED='\033[00;31m'
GREEN='\033[00;32m'
YELLOW='\033[00;33m'
BLUE='\033[00;34m'
CYAN='\033[00;36m'

echo "           __  __        _____ _____ _______ "
echo "          |  \/  |      / ____|  __ \__   __|"
echo "          | \  / |_   _| |    | |__) | | |   "
echo "          | |\/| | | | | |    |  _  /  | |   "
echo "          | |  | | |_| | |____| | \ \  | |   "
echo "          |_|  |_|\__, |\_____|_|  \_\ |_|   "
echo "                   __/ |                     "
echo "                  |___/                      "
echo ""
echo "Bootstrapper For Local Development Environment"

# move to the root directory
START_DIR="$(pwd)"
REPOSITORY_ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPOSITORY_ROOT_DIR" ]; then
   echo "Cannot determine LilBobbyTables-MyCRT root directory. Please run this script from within the repository."
   exit 1
fi
cd "$REPOSITORY_ROOT_DIR"
SCRIPTS_MODULE_DIR="${REPOSITORY_ROOT_DIR}/scripts"

# setup the logging dir
LOG_FILE="${START_DIR}/bootstrap.log"
echo "" > "$LOG_FILE"
echo -e "subcommand output is logged to ${YELLOW}${LOG_FILE}${RESTORE}\n"

########################################################################################################################

check_installed() {
   echo "   checking $1..."
   if ! hash $1 1>/dev/null 2>&1; then
      echo -e "${RED}$1 is not installed! ${RESTORE}"
      exit 1
   fi
}

# check for prerequisites
echo -e "${CYAN}Checking for prerequisites${RESTORE}"
check_installed node
check_installed npm
check_installed mysql
check_installed sass
echo -e "${GREEN}All prerequisites detected!${RESTORE}"
echo ""

########################################################################################################################
# run the clean scripts
echo -e "${CYAN}Cleaning Repository${RESTORE}"
cd "$SCRIPTS_MODULE_DIR"
./clean.sh && ./clean_package_locks.sh
cd ..
if [ -d /tmp/MyCRT ]; then
    echo -e "${CYAN}Deleting tmp folder${RESTORE}"
    rm -rf /tmp/MyCRT
fi
echo -e "${GREEN}All Clean!${RESTORE}\n"

########################################################################################################################
# Setup the MyCRT database

echo -e "${CYAN}setup the mysql database${RESTORE}"
echo -e "${BLUE}Bootstrapping the LBTMyCRT database${RESTORE}"
cd "$SCRIPTS_MODULE_DIR"

bootstrap_sql="${SCRIPTS_MODULE_DIR}/db/bootstrap.sql"
dev_defaults="${SCRIPTS_MODULE_DIR}/db/config/dev.cnf"
if ! mysql --defaults-file="$dev_defaults" < $bootstrap_sql 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to bootstrap the LBTMySQL database${RESTORE}"
   exit 1
fi

echo -e "${GREEN}Successfully setup the LBTMyCRT database${RESTORE}\n"
cd ..

########################################################################################################################

echo -e "${CYAN}Setting up modules${RESTORE}"

########################################################################################################################
# setup the scripts module
echo -e "${BLUE}Setting up scripts (${SCRIPTS_MODULE_DIR})${RESTORE}"
cd "$SCRIPTS_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for scripts module${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup scripts module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the common module
COMMON_MODULE_DIR="${REPOSITORY_ROOT_DIR}/common"
echo -e "${BLUE}Setting up common (${COMMON_MODULE_DIR})${RESTORE}"
cd "$COMMON_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for common module${RESTORE}"; exit 1
fi
echo "building common"
cd "$SCRIPTS_MODULE_DIR"
if ! npm run build-common 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to build common${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup common module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the replay module
REPLAY_MODULE_DIR="${REPOSITORY_ROOT_DIR}/replay"
echo -e "${BLUE}Setting up replay (${REPLAY_MODULE_DIR})${RESTORE}"
cd "$REPLAY_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for replay module${RESTORE}"; exit 1
fi
echo "building replay"
cd "$SCRIPTS_MODULE_DIR"
if ! npm run build-replay 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to build replay${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup replay module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the capture module
CAPTURE_MODULE_DIR="${REPOSITORY_ROOT_DIR}/capture"
echo -e "${BLUE}Setting up capture (${CAPTURE_MODULE_DIR})${RESTORE}"
cd "$CAPTURE_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for capture module${RESTORE}"; exit 1
fi
echo "building capture"
cd "$SCRIPTS_MODULE_DIR"
if ! npm run build-capture 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to build capture${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup capture module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the cli module
CLI_MODULE_DIR="${REPOSITORY_ROOT_DIR}/cli"
echo -e "${BLUE}Setting up cli (${CLI_MODULE_DIR})${RESTORE}"
cd "$CLI_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for cli module${RESTORE}"; exit 1
fi
echo "building cli"
cd "$SCRIPTS_MODULE_DIR"
if ! npm run build-cli 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to build cli${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup cli module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the gui module
GUI_MODULE_DIR="${REPOSITORY_ROOT_DIR}/gui"
echo -e "${BLUE}Setting up gui (${GUI_MODULE_DIR})${RESTORE}"
cd "$GUI_MODULE_DIR"
echo "installing npm dependencies"
if ! npm install 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to install npm dependencies for gui module${RESTORE}"; exit 1
fi
echo "building gui"
cd "$SCRIPTS_MODULE_DIR"
if ! npm run build-gui 1>>"$LOG_FILE" 2>&1; then
   echo -e "${RED}Failed to build gui${RESTORE}"; exit 1
fi
echo -e "${GREEN}Successfully setup gui module${RESTORE}\n"
cd ..

########################################################################################################################
# setup the service module
SERVICE_MODULE_DIR="${REPOSITORY_ROOT_DIR}/service"

   echo -e "${BLUE}Setting up service (${SERVICE_MODULE_DIR})${RESTORE}"
   cd "$SERVICE_MODULE_DIR"
   echo "installing npm dependencies"
   if ! npm install 1>>"$LOG_FILE" 2>&1; then
      echo -e "${RED}Failed to install npm modules for service module${RESTORE}"; exit 1
   fi

   echo "building service"
   cd "$SCRIPTS_MODULE_DIR"
   if ! npm run build-service 1>>"$LOG_FILE" 2>&1; then
      echo -e "${RED}Failed to build service${RESTORE}"; exit 1
   fi

echo -e "${GREEN}Successfully setup service module${RESTORE}\n"
cd ..

########################################################################################################################
# link modules to the scripts directory
echo -e "${BLUE}Linking modules to the scripts directory${RESTORE}"
cd "$SCRIPTS_MODULE_DIR"
bash link_modules.sh 1>>"$LOG_FILE" 2>&1
echo -e "${GREEN}Successfully linked modules${RESTORE}\n"

########################################################################################################################

echo -e "Bootstrapping complete!"
echo -e "For more info, check the log file: ${YELLOW}${LOG_FILE}${RESTORE}"
