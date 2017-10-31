#!/usr/bin/env node

import launch from './launch';

export default launch;

if (typeof(require) !== 'undefined' && require.main === module) {
   console.log("Running MyCRT Capture Program");
}
