
export enum MYCRT_ENV {

   // a developer's machine
   DEV = "dev",

   // travis-ci
   TRAVIS = "travis",

   // ec2 demo
   DEMO = "demo",

}

// determine the current environment from the "MYCRT_ENV" environment variable.
// defaults to the dev environment
export const mycrtEnv = (() => {
   let envStr: string | undefined = process.env.MYCRT_ENV;
   if (!envStr) {
      return MYCRT_ENV.DEV;
   } else {
      envStr = envStr.toUpperCase();
      const envMap: {[key: string]: MYCRT_ENV} = {
         DEV: MYCRT_ENV.DEV,
         TRAVIS: MYCRT_ENV.TRAVIS,
         DEMO: MYCRT_ENV.DEMO,
      };
      return envMap[envStr];
   }
})();
