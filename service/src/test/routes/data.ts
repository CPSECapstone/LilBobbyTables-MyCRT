
export const newEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "us-east-2",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL environment",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

export const badEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "somewhereineastasia",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL environment",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

export const editEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "us-east-2",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL sequel",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

export const scheduledCaptureBody = {
   name: "ScheduledCapture",
   envId: 1,
   status: "SCHEDULED",
   scheduledStart: "2020-03-04 20:53:00",
};

export const liveCaptureBody = {
   name: "LiveCapture",
   envId: 1,
   start: "2018-03-04 20:53:00",
   end: null,
};

export const badCaptureBody = {
   name: 'BadCapture',
   envId: 1,
   status: "I'M BAD YO",
   start: "2018-03-04 20:53:00",
};

export const badCredBody = {
   accessKey: "ACCESSKEY",
};

export const badDBBody = {
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
};
