const child_process = require('child_process');

const launch = () => {
   console.log("launching capture");

   const cmd = child_process.spawn('capture');

   cmd.stdout.on('data', (data) => {
      console.log("[capture stdout]  " + data);
   });

   cmd.on('close', (code) => {
      console.log("[capture]  exited with code " + code);
   });
};

module.exports = {
   launch: launch
};
