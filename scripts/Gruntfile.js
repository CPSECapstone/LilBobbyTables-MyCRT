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
   GUI: path.resolve(ROOT_DIR, 'gui'),
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
      path.resolve(modulePath, 'src') + '/\*\*/\*.{ts,tsx}',
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
   const src = [
      path.resolve(modulePath, 'src') + '/\*\*/\*.{ts,tsx}',
   ];
   if (!testing) {
      src.push('!' + path.resolve(modulePath, 'src', 'test') + '/\*\*/\*.test.ts');
   }

   return {
      files: {
         src: src,
      },
   };
}

function sassTaskConfig(modulePath) {

   const ScssDir = path.resolve(modulePath, 'static', 'scss');
   const CssDir = path.resolve(modulePath, 'static', 'css');


   return {
      files: [
         {
            expand: true,
            cwd: ScssDir,
            src: ['./**/*.scss'],
            dest: CssDir,
            ext: '.css',
         },
      ],
   };

}

function webpackTaskConfig(modulePath) {
   const configPath = path.resolve(modulePath, 'webpack.config.js');
   const config = require(configPath);
   return config;
}

function mochaTestTaskConfig(modulePath) {
   const testDir = path.resolve(modulePath, 'dist', 'test') + '/\*\*/\*.test.js';
   return {
      src: [testDir],
   };
}

function watchTaskConfig(modulePath, tasks) {
   return {
      files: [
         path.resolve(modulePath, 'src') + '/\*\*/\*.ts',
         path.resolve(modulePath, 'package.json'),
      ],
      tasks: tasks,
   };
}

// function watchTaskConfigWithSass(modulePath, name) {
//    const conf = watchTaskConfig(modulePath, name);
//    conf.files.push(path.resolve(modulePath, 'static', 'scss') + '/\*\*/\*.scss');
//    conf.tasks.push('sass:' + name);
//    return conf;
// }

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// ACTUAL GRUNT CONFIGURATION HAPPENS BELOW ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(grunt) {

   /* load npm tasks */
   grunt.loadNpmTasks('grunt-env');
   grunt.loadNpmTasks('grunt-ts');
   grunt.loadNpmTasks('grunt-tslint');
   grunt.loadNpmTasks('grunt-contrib-sass');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-concurrent');
   grunt.loadNpmTasks('grunt-nodemon');
   grunt.loadNpmTasks('grunt-mocha-test');
   grunt.loadNpmTasks('grunt-webpack');

   /* configure grunt */
   grunt.initConfig({

      env: {
         test: {
            NODE_ENV: 'test',
         },
      },

      /* typescript */
      ts: {
         'capture': tsTaskConfig(DIR.CAPTURE),
         'capture-test': tsTaskConfig(DIR.CAPTURE, null, true),
         'cli': tsTaskConfig(DIR.CLI),
         'cli-test': tsTaskConfig(DIR.CLI, null, true),
         'common': tsTaskConfig(DIR.COMMON),
         'common-test': tsTaskConfig(DIR.COMMON, null, true),
         'replay': tsTaskConfig(DIR.REPLAY),
         'replay-test': tsTaskConfig(DIR.REPLAY, null, true),
         'service': tsTaskConfig(DIR.SERVICE),
         'service-test': tsTaskConfig(DIR.SERVICE, null, true),
         'gui': tsTaskConfig(DIR.GUI),
         'gui-test': tsTaskConfig(DIR.GUI, null, true),
      },

      /* typescript linter */
      tslint: {
         options: {
            configuration: 'tslint.json',
            force: false,
            fix: false
         },
         'capture': tslintTaskConfig(DIR.CAPTURE),
         'capture-test': tslintTaskConfig(DIR.CAPTURE, true),
         'cli': tslintTaskConfig(DIR.CLI),
         'cli-test': tslintTaskConfig(DIR.CLI, true),
         'common': tslintTaskConfig(DIR.COMMON),
         'common-test': tslintTaskConfig(DIR.COMMON, true),
         'replay': tslintTaskConfig(DIR.REPLAY),
         'replay-test': tslintTaskConfig(DIR.REPLAY, true),
         'service': tslintTaskConfig(DIR.SERVICE),
         'service-test': tslintTaskConfig(DIR.SERVICE, true),
         'gui': tslintTaskConfig(DIR.GUI),
         'gui-test': tslintTaskConfig(DIR.GUI, true),
      },

      /* SASS */
      sass: {
         'gui': sassTaskConfig(DIR.GUI),
      },

      webpack: {
         'gui': webpackTaskConfig(DIR.GUI),
      },

      /* mocha testing */
      mochaTest: {
         'capture': mochaTestTaskConfig(DIR.CAPTURE),
         'cli': mochaTestTaskConfig(DIR.CLI),
         'common': mochaTestTaskConfig(DIR.COMMON),
         'replay': mochaTestTaskConfig(DIR.REPLAY),
         'service': mochaTestTaskConfig(DIR.SERVICE),
         'gui': mochaTestTaskConfig(DIR.GUI),
      },

      /* file watching */
      watch: {
         'capture': watchTaskConfig(DIR.CAPTURE, ['digest-capture']),
         'cli': watchTaskConfig(DIR.CLI, ['digest-cli']),
         'common': watchTaskConfig(DIR.COMMON, ['digest-common']),
         'replay': watchTaskConfig(DIR.REPLAY, ['digest-replay']),
         'service': watchTaskConfig(DIR.SERVICE, ['digest-service']),
         'gui': {
            files: [
               path.resolve(DIR.GUI, 'src') + '/\*\*/\*.{ts,tsx}',
               path.resolve(DIR.GUI, 'static', 'html') + '/\*\*/\*.mustache',
            ],
            tasks: ['concurrent:digest-gui-noserve'],
         },
         'gui-sass': {
            files: [path.resolve(DIR.GUI, 'static', 'scss') + '/\*\*/\*.scss'],
            tasks: ['sass:gui'],
         },
         'gui-webpack': {
            files: [
               path.resolve(DIR.GUI, 'dist') + '/\*\*/\*.js',
               path.resolve(DIR.GUI, 'static', 'css') + '/\*\*/\*.css',
            ],
            tasks: ['webpack:gui'],
         },
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
         'digest-capture-test': {
            tasks: ['ts:capture-test', 'tslint:capture-test'],
         },
         'digest-replay': {
            tasks: ['ts:replay', 'tslint:replay'],
         },
         'digest-replay-test': {
            tasks: ['ts:replay-test', 'tslint:replay-test'],
         },
         'digest-service': {
            tasks: ['ts:service', 'tslint:service'],
         },
         'digest-service-test': {
            tasks: ['ts:service-test', 'tslint:service-test'],
         },
         'digest-cli': {
            tasks: ['ts:cli', 'tslint:cli'],
         },
         'digest-cli-test': {
            tasks: ['ts:cli-test', 'tslint:cli-test'],
         },
         'digest-gui-noserve': {
            tasks: ['ts:gui', 'tslint:gui'],
         },
         'digest-gui-test-noserve': {
            tasks: ['ts:gui-test', 'tslint:gui-test'],
         },

         'watch-gui': {
            tasks: ['watch:gui', 'watch:gui-sass', 'watch:gui-webpack'],
            options: {
               logConcurrentOutput: true,
            },
         },
         'watch-all': {
            tasks: ['watch:common', 'watch:capture', 'watch:replay', 'watch:cli', 'watch:gui', 'watch:gui-sass', 'watch:gui-webpack', 'watch:service'],
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
                  path.join(DIR.GUI, 'dist'),
               ],
               delay: 500,
            },
         },
      },

   });

   /* miscellaneous */
   grunt.registerTask('noop', () => {});
   grunt.registerTask('digest-complete', () => {
      grunt.log.writeln("\n\t====================================");
      grunt.log.writeln("\t||  Inital Digest Cycle Complete  ||");
      grunt.log.writeln("\t====================================\n");
   });

   /* Module specific tasks */
   for (const m of ['common', 'capture', 'replay', 'cli', 'service']) {
      grunt.registerTask('digest-' + m, ['concurrent:digest-' + m]);
      grunt.registerTask('digest-' + m + '-test', ['concurrent:digest-' + m + '-test']);
      grunt.registerTask('build-' + m, ['concurrent:digest-' + m]);                       // build-MODULE
      grunt.registerTask('build-' + m + '-test', ['concurrent:digest-' + m + '-test']);   // build-MODULE-test
      grunt.registerTask('test-' + m, ['env:test', 'mochaTest:' + m]);                                // test-MODULE
      grunt.registerTask('build_and_test-' + m, ['build-' + m + '-test', 'test-' + m]);   // build_and_test-MODULE
      grunt.registerTask(m, ['build-' + m, 'watch:' + m]);                                // MODULE
   }

   /* Special Case for GUI */
   grunt.registerTask('digest-gui', ['concurrent:digest-gui-noserve', 'sass:gui', 'webpack:gui']);
   grunt.registerTask('digest-gui-test', ['concurrent:digest-gui-test-noserve', 'sass:gui', 'webpack:gui']);
   grunt.registerTask('build-gui', ['digest-gui']);
   grunt.registerTask('build-gui-test', ['digest-gui-test']);
   grunt.registerTask('test-gui', ['env:test', 'mochaTest:gui']);
   grunt.registerTask('build_and_test-gui', ['build-gui-test', 'test-gui']);
   grunt.registerTask('gui', ['build-gui', 'concurrent:watch-gui']);

   /* Primary Operations */
   grunt.registerTask('build', ['build-common', 'build-capture', 'build-replay', 'build-cli', 'build-gui', 'build-service']);
   grunt.registerTask('build-test', ['build-common-test', 'build-capture-test', 'build-replay-test', 'build-cli-test', 'build-gui-test', 'build-service-test']);
   grunt.registerTask('test', ['test-common', 'test-capture', 'test-replay', 'test-cli', 'test-gui', 'test-service']);
   grunt.registerTask('build_and_test', ['build-test', 'test']);
   grunt.registerTask('build_and_develop', ['build', 'digest-complete', 'concurrent:develop']);
   grunt.registerTask('develop', ['concurrent:develop']);

};
