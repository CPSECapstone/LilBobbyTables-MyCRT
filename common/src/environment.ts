
export enum MYCRT_ENV {

   // a developer's machine
   DEV = "dev",

   // travis-ci
   TRAVIS = "travis",

}

// determine the current environment from the "MYCRT_ENV" environment variable.
// defaults to the dev environment
export const mycrtEnv = ({
   DEV: MYCRT_ENV.DEV,
   TRAVIS: MYCRT_ENV.TRAVIS,
} as {[key: string]: MYCRT_ENV})[(process.env.MYCRT_ENV as string).toUpperCase()] || MYCRT_ENV.DEV;
