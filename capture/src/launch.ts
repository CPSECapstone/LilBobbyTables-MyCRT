import * as child_process from 'child_process';

const launch = () => {
   console.log("launching capture");

   child_process.spawn('capture')

      .stdout.on('data', (data: string) => {
         console.log("[capture stdout]  " + data);
      })

      .on('close', (code: any) => {
         console.log("[capture]  exited with code " + code);
      })

      .on('error', (error: string) => {
         console.log(error);
      })

   ;
};

export {
   launch,
};
