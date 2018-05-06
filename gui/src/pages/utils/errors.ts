import { BrowserLogger as logger } from '../../logging';

function genericErrorHandler(event: Event) {
   logger.error("An Error Occurred");
   logger.error(JSON.stringify(event));
}

window.addEventListener('error', genericErrorHandler, true);
