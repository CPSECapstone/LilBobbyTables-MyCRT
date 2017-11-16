var fs = require('fs');
var path = require('path');
var tsconfig = require('./tsconfig.json');

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

function tsTaskConfig(modulePath, options, testing) {

   // build the options object
   options = options || {};
   options = Object.assign(options, {
      sourceRoot: path.resolve(modulePath, 'src'),
      rootDir: path.resolve(modulePath, 'src'),
      declarationDir: path.resolve(modulePath, 'dist'),
   });
   let globalOptions = Object.assign({}, tsconfig.compilerOptions);
   options = Object.assign(globalOptions, options);

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
      options.typeRoots = types;
   }

   const src = [
      path.resolve(modulePath, 'src') + '/\*\*/\*.ts',
      '!' + path.resolve(modulePath, 'node_modules') + '/\*\*',
   ];
   if (!testing) {
      src.push('!' + path.resolve(modulePath, 'src', 'test') + '/\*\*/\*.test.ts');
   }

   return {
      files: [{
         src: src,
         dest: path.resolve(modulePath, 'dist'),
      }],
      options: options,
   };
}

function tslintTaskConfig(modulePath, testing) {
   const src = [path.resolve(modulePath, 'src') + '/\*\*/\*.ts'];
   if (!testing) {
      src.push('!' + path.resolve(modulePath, 'src', 'test') + '/\*\*/\*.test.ts');
   }

   return {
      files: {
         src: src,
      },
   };
}

function mochaTestTaskConfig(modulePath) {
   const testDir = path.resolve(modulePath, 'dist', 'test') + '/\*\*/\*.test.js';
   return {
      src: [testDir],
   };
}

function watchTaskConfig(modulePath, name) {
   return {
      files: [
         path.resolve(modulePath, 'src') + '/\*\*/\*.ts',
         path.resolve(modulePath, 'package.json'),
      ],
      tasks: ['concurrent:digest-' + name],
   };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// ACTUAL GRUNT CONFIGURATION HAPPENS BELOW ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(grunt) {

   /* load npm tasks */
   grunt.loadNpmTasks('grunt-ts');
   grunt.loadNpmTasks('grunt-tslint');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-concurrent');
   grunt.loadNpmTasks('grunt-nodemon');
   grunt.loadNpmTasks('grunt-mocha-test');

   /* configure grunt */
   grunt.initConfig({

      /* typescript */
      ts: {
         capture: tsTaskConfig(DIR.CAPTURE),
         cli: tsTaskConfig(DIR.CLI),
         common: tsTaskConfig(DIR.COMMON),
         'common-test': tsTaskConfig(DIR.COMMON, null, true),
         replay: tsTaskConfig(DIR.REPLAY),
         service: tsTaskConfig(DIR.SERVICE),
      },

      /* typescript linter */
      tslint: {
         options: {
            configuration: 'tslint.json',
            force: false,
            fix: false
         },
         capture: tslintTaskConfig(DIR.CAPTURE),
         cli: tslintTaskConfig(DIR.CLI),
         common: tslintTaskConfig(DIR.COMMON),
         'common-test': tslintTaskConfig(DIR.COMMON, true),
         replay: tslintTaskConfig(DIR.REPLAY),
         service: tslintTaskConfig(DIR.SERVICE),
      },

      /* mocha testing */
      mochaTest: {
         common: mochaTestTaskConfig(DIR.COMMON),
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
         'digest-common-test': {
            tasks: ['ts:common-test', 'tslint:common-test'],
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

         'develop': {
            tasks: ['concurrent:watch-all', 'nodemon:dev'],
            options: {
               logConcurrentOutput: true,
            },
         },

      },

      /* server reloading */
      nodemon: {
         dev: {
            script: path.resolve(DIR.SERVICE, 'dist', 'main.js'),
            options: {
               args: [],
               nodeArgs: [],
               // callback: (nodemon) => {
               // },
               env: {
                  PORT: '3000',
               },
               cwd: DIR.SERVICE,
               ignore: ['node_modules/\*\*'],
               ext: 'js',
               watch: [
                  path.join(DIR.SERVICE, 'dist'),
                  path.join(DIR.CAPTURE, 'dist'),
                  path.join(DIR.REPLAY, 'dist'),
                  path.join(DIR.COMMON, 'dist'),
               ],
               delay: 500,
            },
         },
      },

   });

   grunt.registerTask('noop', () => {});

   /* common */
   grunt.registerTask('build-common', ['concurrent:digest-common']);
   grunt.registerTask('test-common', ['concurrent:digest-common-test', 'mochaTest:common']);
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
   grunt.registerTask('develop', ['concurrent:digest-all', 'digest-complete', 'concurrent:develop']);

};
