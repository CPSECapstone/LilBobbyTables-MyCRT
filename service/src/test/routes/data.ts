
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

export const newEnvBody2 = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "us-east-2",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL environment 2",
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

export const guiCaptureBody = {
   name: "LiveCapture",
   envId: 1,
};

export const badScheduledCapture = {
   name: "ScheduledCapture",
   envId: 1,
   status: "SCHEDULED",
   scheduledStart: null,
};

export const captureBadEnv = {
   name: 'BadCapture',
   envId: 56,
   status: "STARTING",
   start: "2018-03-04 20:53:00",
};

export const captureBadStatus = {
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

export const replayBody = {
   name: "myReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: 1,
   dbName: "nfltest2015",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const badReplayBody = {
   name: "BadReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: 1,
   dbName: "bad db name",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const anotherBadReplayBody = {
   name: "BadReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: null,
   dbName: "nfltest2015",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const badScheduledReplay = {
   name: "BadReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: 1,
   dbName: "bad db name",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
   status: "SCHEDULED",
   scheduledStart: null,
};
