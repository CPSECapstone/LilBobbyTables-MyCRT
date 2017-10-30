#!/usr/bin/env node

import launch from './launch';

export {
   launch,
};

if (typeof(require) !== 'undefined' && require.main === module) {
   console.log("MyCRT Capture");
}
