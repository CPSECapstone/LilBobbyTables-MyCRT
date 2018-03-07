
// tslint:disable-next-line:no-var-requires
export const settings: IMockReplaySettings = require('../mockReplay.config.json');

export interface IMockReplaySettings {

   invalidQueries: [string];
}
