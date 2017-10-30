var path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../');
const DIR = {
   ROOT: ROOT_DIR,
   CAPTURE: path.resolve(ROOT_DIR, 'capture'),
   CLI: path.resolve(ROOT_DIR, 'cli'),
   COMMON: path.resolve(ROOT_DIR, 'common'),
   REPLAY: path.resolve(ROOT_DIR, 'replay'),
   SCRIPTS: path.resolve(ROOT_DIR, 'scripts'),
   SERVICE: path.resolve(ROOT_DIR, 'service'),
};
delete ROOT_DIR;

const GLOBAL_TYPESCRIPT_OPTIONS = {
   target: 'es5',
   alwaysStrict: true,
   sourceMap: true,
   declaration: true,
   strictNullChecks: true,
   newLine: 'LF',
   noImpicitAny: true,
   noImplicitReturns: true,
};

const GLOBAL_TSLINT_CONFIGURATION = {
   defaultSeverity: 'error',
   extends: ['tslint:recommended'],
   rules: {
      quotemark: [false],
      'no-console': [false],
   },
   typeDef: [true, 'call-signature', 'property-declaration'],
};

module.exports = function(grunt) {

   /* configure grunt */
   grunt.initConfig({

      /* typescript */
      ts: {
         service: {
            files: [{
               src: [path.resolve(DIR.SERVICE, 'src') + '/\*\*/\*.ts'],
               dest: path.resolve(DIR.SERVICE, 'dist'),
            }],
            options: Object.assign({
               rootDir: DIR.SERVICE,
            }, GLOBAL_TYPESCRIPT_OPTIONS),
         },
      },

      /* typescript linter */
      tslint: {
         options: {
            configuration: GLOBAL_TSLINT_CONFIGURATION,
            force: false,
            fix: false
         },
         service: {
            files: {
               src: [path.resolve(DIR.SERVICE, 'src') + '/\*\*/\*.ts'],
            },
         },
      },

      /* file watching */
      watch: {
         service: {
            files: [path.resolve(DIR.SERVICE, 'src') + '/\*\*/\*.ts'],
            tasks: ['ts:service', 'tslint:service'],
         }
      },

   });

   /* load npm tasks */
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-ts');
   grunt.loadNpmTasks('grunt-tslint');

   /* common */
   grunt.registerTask('common', []);

   /* capture */
   grunt.registerTask('capture', []);

   /* replay */
   grunt.registerTask('replay', []);

   /* service */
   grunt.registerTask('build-service', ['ts:service', 'tslint:service']);
   grunt.registerTask('service', ['build-service', 'watch:service']);

   /* cli */
   grunt.registerTask('cli', []);

   /* Run the whole MyCRT project */
   grunt.registerTask('build', ['build-service']);
   grunt.registerTask('default', ['common', 'capture', 'replay', 'service', 'cli']);

};
