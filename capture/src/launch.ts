import * as child_process from 'child_process'

const launch = () => {
   console.log("launching capture");

   child_process.spawn('capture')

      .stdout.on('data', (data) => {
         console.log("[capture stdout]  " + data);
      })

      .on('close', (code) => {
         console.log("[capture]  exited with code " + code);
      })

      .on('error', (error) => {
         console.log(error);
      })

      ;
};

export {
   launch
}
