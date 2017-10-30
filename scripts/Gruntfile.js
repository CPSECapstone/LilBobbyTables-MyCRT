var fs = require('fs');
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
   traceResolution: true,
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

function tsTaskConfig(modulePath, options) {

   // build the options object
   options = options || {};
   options = Object.assign(options, {
      sourceRoot: modulePath,
      rootDir: modulePath,
   });
   options = Object.assign(options, GLOBAL_TYPESCRIPT_OPTIONS);

   // get the types to include
   const typesDir = path.resolve(modulePath, 'node_modules', '@types');
   let types = [];
   if (fs.existsSync(typesDir)) {
      const contents = fs.readdirSync(typesDir)
      for (let i = 0; i < contents.length; ++i) {
         const fullPath = path.resolve(typesDir, contents[i]);
         const stats = fs.statSync(fullPath);
         if (stats.isDirectory()) {
            types.push(fullPath);
         }
      }
   }
   if (types.length) {
      options.types = types;
   }

   return {
      files: [{
         src: [
            path.resolve(modulePath, 'src') + '/\*\*/\*.ts',
            '!' + path.resolve(modulePath, 'node_modules') + '/\*\*',
         ],
         dest: path.resolve(modulePath, 'dist'),
      }],
      options: options,
   };
}

function tslintTaskConfig(modulePath) {
   return {
      files: {
         src: [path.resolve(modulePath, 'src') + '/\*\*/\*.ts'],
      },
   };
}

function watchTaskConfig(modulePath, name) {
   return {
      files: [path.resolve(modulePath, 'src') + '/\*\*/\*.ts'],
      tasks: ['ts:' + name, 'tslint:' + name],
   };
}

module.exports = function(grunt) {

   /* configure grunt */
   grunt.initConfig({

      /* typescript */
      ts: {
         capture: tsTaskConfig(DIR.CAPTURE),
         cli: tsTaskConfig(DIR.CLI),
         common: tsTaskConfig(DIR.COMMON),
         replay: tsTaskConfig(DIR.REPLAY),
         service: tsTaskConfig(DIR.SERVICE),
      },

      /* typescript linter */
      tslint: {
         options: {
            configuration: GLOBAL_TSLINT_CONFIGURATION,
            force: false,
            fix: false
         },
         capture: tslintTaskConfig(DIR.CAPTURE),
         cli: tslintTaskConfig(DIR.CLI),
         common: tslintTaskConfig(DIR.COMMON),
         replay: tslintTaskConfig(DIR.REPLAY),
         service: tslintTaskConfig(DIR.SERVICE),
      },

      /* file watching */
      // watch: {
      //    capture: watchTaskConfig(DIR.CAPTURE, 'capture'),
      //    cli: watchTaskConfig(DIR.CLI, 'cli'),
      //    common: watchTaskConfig(DIR.COMMON, 'common'),
      //    replay: watchTaskConfig(DIR.REPLAY, 'replay'),
      //    service: watchTaskConfig(DIR.SERVICE, 'service'),
      // },

   });

   /* load npm tasks */
   grunt.loadNpmTasks('grunt-ts');
   grunt.loadNpmTasks('grunt-tslint');
   // grunt.loadNpmTasks('grunt-contrib-watch');

   /* common */
   grunt.registerTask('build-common', ['ts:common', 'tslint:common']);
   grunt.registerTask('common', ['build-common']);

   /* capture */
   grunt.registerTask('build-capture', ['ts:capture', 'tslint:capture']);
   grunt.registerTask('capture', ['build-capture']);

   /* replay */
   grunt.registerTask('build-replay', ['ts:replay', 'tslint:replay']);
   grunt.registerTask('replay', ['build-replay']);

   /* service */
   grunt.registerTask('build-service', ['ts:service', 'tslint:service']);
   grunt.registerTask('service', ['build-service']);

   /* cli */
   grunt.registerTask('build-cli', ['ts:cli', 'tslint:cli']);
   grunt.registerTask('cli', ['build-cli']);

   /* Run the whole MyCRT project */
   grunt.registerTask('build', ['build-service']);
   grunt.registerTask('default', ['common', 'capture', 'replay', 'service', 'cli']);

};
