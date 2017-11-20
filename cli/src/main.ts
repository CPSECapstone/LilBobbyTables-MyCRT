#!/usr/bin/env node

import MyCrtCli from './cli';

if (typeof(require) !== 'undefined' && require.main === module) {

   const cli = new MyCrtCli();
   cli.run();

}
