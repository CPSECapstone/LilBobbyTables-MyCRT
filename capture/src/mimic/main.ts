import { Logging } from '@lbt-mycrt/common';

async function runMimic(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);
}

if (typeof(require) !== 'undefined' && require.main === module) {
   runMimic();
}
