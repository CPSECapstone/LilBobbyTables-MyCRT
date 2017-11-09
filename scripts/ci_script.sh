ROOT_DIR="$(pwd)"
SCRIPTS_DIR="${ROOT_DIR}/scripts"
COMMON_DIR="${ROOT_DIR}/common"
CAPTURE_DIR="${ROOT_DIR}/capture"
REPLAY_DIR="${ROOT_DIR}/replay"
SERVICE_DIR="${ROOT_DIR}/service"
CLI_DIR=="${ROOT_DIR}/cli"

# setup for scripts directory
cd $SCRIPTS_DIR
npm install

# setup for common directory
cd $COMMON_DIR
npm install --production
cd $SCRIPTS_DIR
npm run build-common

# setup for capture directory
cd $CAPTURE_DIR
npm install --production
cd $SCRIPTS_DIR
npm run build-capture

# setup for replay directory
cd $REPLAY_DIR
npm install --production
cd $SCRIPTS_DIR
npm run build-replay

# setup for service directory
cd $SERVICE_DIR
npm install --production
cd $SCRIPTS_DIR
npm run build-service

# setup for cli directory
cd $CLI_DIR
npm install --production
cd $SCRIPTS_DIR
npm run build-cli
