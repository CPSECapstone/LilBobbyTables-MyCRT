
import MyCrtCli from './cli';

if (typeof(require) !== 'undefined' && require.main === module) {

   const cli = new MyCrtCli();
   cli.run();

}

export * from './mycrt-client/client';
