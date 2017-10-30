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
   // traceResolution: true,
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
      sourceRoot: path.resolve(modulePath, 'src'),
      rootDir: path.resolve(modulePath, 'src'),
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
      tasks: ['concurrent:digest-' + name],
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
      watch: {
         capture: watchTaskConfig(DIR.CAPTURE, 'capture'),
         cli: watchTaskConfig(DIR.CLI, 'cli'),
         common: watchTaskConfig(DIR.COMMON, 'common'),
         replay: watchTaskConfig(DIR.REPLAY, 'replay'),
         service: watchTaskConfig(DIR.SERVICE, 'service'),
      },

      /* concurrent tasks */
      concurrent: {

         /* Digest TypeScript: compiling and linting */
         'digest-common': {
            tasks: ['ts:common', 'tslint:common'],
         },
         'digest-capture': {
            tasks: ['ts:capture', 'tslint:capture'],
         },
         'digest-replay': {
            tasks: ['ts:replay', 'tslint:replay'],
         },
         'digest-service': {
            tasks: ['ts:service', 'tslint:service'],
         },
         'digest-cli': {
            tasks: ['ts:cli', 'tslint:cli'],
         },
         'digest-all': {
            tasks: ['concurrent:digest-common', 'concurrent:digest-capture', 'concurrent:digest-replay', 'concurrent:digest-service', 'concurrent:digest-cli'],
         },

         'watch-all': {
            tasks: ['watch:common', 'watch:capture', 'watch:replay', 'watch:service', 'watch:cli'],
            options: {
               logConcurrentOutput: true,
            },
         },

      },

   });

   /* load npm tasks */
   grunt.loadNpmTasks('grunt-ts');
   grunt.loadNpmTasks('grunt-tslint');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-concurrent');

   /* common */
   grunt.registerTask('build-common', ['concurrent:digest-common']);
   grunt.registerTask('common', ['build-common', 'watch:common']);

   /* capture */
   grunt.registerTask('build-capture', ['concurrent:digest-capture']);
   grunt.registerTask('capture', ['build-capture', 'watch:capture']);

   /* replay */
   grunt.registerTask('build-replay', ['concurrent:digest-replay']);
   grunt.registerTask('replay', ['build-replay', 'watch:replay']);

   /* service */
   grunt.registerTask('build-service', ['concurrent:digest-service']);
   grunt.registerTask('service', ['build-service', 'watch:service']);

   /* cli */
   grunt.registerTask('build-cli', ['concurrent:digest-cli']);
   grunt.registerTask('cli', ['build-cli', 'watch:cli']);

   /* tasks on the whole MyCRT project */
   grunt.registerTask('build', ['build-common', 'build-capture', 'build-replay', 'build-service', 'build-cli']);
   grunt.registerTask('digest-complete', () => {
      grunt.log.writeln("\n\t====================================");
      grunt.log.writeln("\t||  Inital Digest Cycle Complete  ||");
      grunt.log.writeln("\t====================================\n");
   });
   grunt.registerTask('default', ['concurrent:digest-all', 'digest-complete', 'concurrent:watch-all']);

};
