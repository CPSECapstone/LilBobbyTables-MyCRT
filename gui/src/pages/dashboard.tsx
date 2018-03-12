import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus, IChildProgram } from '@lbt-mycrt/common/dist/data';

import './common';

import '../../static/css/index.css';

import { ICapture } from '../../../common/dist/main';
import { BrowserLogger as logger } from '../logging';
import { CaptureModal } from './components/capture_modal_comp';
import { CapturePanel } from './components/capture_panel_comp';
import { DeleteModal } from './components/delete_modal_comp';
import { ReplayModal } from './components/replay_modal_comp';
import { ReplayPanel } from './components/replay_panel_comp';
import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

class DashboardApp extends React.Component<any, any> {

    public constructor(props: any) {
        super(props);
        this.componentWillMount = this.componentWillMount.bind(this);
        this.deleteEnv = this.deleteEnv.bind(this);
        this.updateCaptures = this.updateCaptures.bind(this);
        this.updateReplays = this.updateReplays.bind(this);
        let id: any = null;
        const match = window.location.search.match(/.*\?.*id=(\d+)/);
        if (match) {
            id = match[1];
        }
        this.state = { envId: id, env: null, captures: [], replays: [] };
    }

   public async setCaptures() {
       const capturesResponse = await mycrt.getCapturesForEnvironment(this.state.envId);
       if (capturesResponse !== null) {
           this.setState({
                captures: this.makeObject(capturesResponse, "id"),
            });
            this.setReplays();
        }
    }

    public makeObject(list: any[], field: string): any {
        const obj = {} as any;
        if (list) {
              list.forEach((item: any) => {
                    obj[item[field]] = item;
              });
        }
        return obj;
  }

    public async setReplays() {
       let allReplays = this.state.replays;
        for (const id in this.state.captures) {
           const capture = this.state.captures[id];
           const replays = await mycrt.getReplaysForCapture(capture.id);
           if (replays) {
               allReplays = allReplays.concat(replays);
           }
        }
        this.setState({replays: this.makeObject(allReplays, "id")});
    }

    public updateCaptures(id: string, status: ChildProgramStatus) {
        const captures = this.state.captures;
        captures[id].status = status;
        this.setState({captures});
    }

    public async updateReplays(id: string, status: ChildProgramStatus) {
      const replays = this.state.replays;
      replays[id].status = status;
      logger.info(JSON.stringify(replays));
      this.setState({replays});
   }

    public async componentWillMount() {
        if (this.state.envId) {
            this.setState({
                  env: await mycrt.getEnvironment(this.state.envId),
            });
        }
        this.setCaptures();
    }

    public async deleteEnv(id: number, deleteLogs: boolean) {
        await mycrt.deleteEnvironment(id, deleteLogs);
        window.location.assign('./environments');
    }

    public render() {
        if (!this.state.env) { return (<div></div>); }
        const liveCaptures: JSX.Element[] = [];
        const scheduledCaptures: JSX.Element[] = [];
        const pastCaptures: JSX.Element[] = [];
        if (this.state.captures) {
            const captureList = Object.keys(this.state.captures);
            for (let i = captureList.length - 1; i >= 0; i--) {
                const capture = this.state.captures[captureList[i]];
                const name = capture.name || `capture ${capture.id}`;
                const captureComp = (<CapturePanel title={name} capture={capture} key={capture.id}
                  envId={this.state.envId} update={this.updateCaptures}/>);
                if (capture.status === ChildProgramStatus.STOPPING || capture.status === ChildProgramStatus.DONE ||
                     capture.status === ChildProgramStatus.FAILED) {
                    pastCaptures.push(captureComp);
                } else if (capture.status === ChildProgramStatus.SCHEDULED) {
                    scheduledCaptures.push(captureComp);
                } else {
                    liveCaptures.push(captureComp);
                }
            }
        }
      const liveReplays: JSX.Element[] = [];
      const scheduledReplays: JSX.Element[] = [];
      const pastReplays: JSX.Element[] = [];
      if (this.state.replays) {
         const replayList = Object.keys(this.state.replays);
         for (let i = replayList.length - 1; i >= 0; i--) {
            const replay = this.state.replays[replayList[i]];
            const name = replay.name || `replay ${replay.id}`;
            const replayComp = (<ReplayPanel title={name} replay={replay} compare={true} key={replay.id}
               capture={this.state.captures[replay.captureId]} envId = {this.state.envId}
               update={this.updateReplays}/>);
            if (replay.status === "queued" || replay.status === ChildProgramStatus.DONE) {
               pastReplays.push(replayComp);
            } else if (replay.status === ChildProgramStatus.SCHEDULED) {
               scheduledReplays.push(replayComp);
            } else {
               liveReplays.push(replayComp);
            }
         }
      }
      return (
         <div>
            <nav>
               <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item active">{this.state.env.envName}</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-xs-12">
                     <h1 style={{display: "inline"}}>{this.state.env.envName}</h1>
                     <a role="button" className="btn btn-danger" data-toggle="modal" href="#"
                           data-target="#deleteEnvModal" style={{marginBottom: "20px", marginLeft: "12px"}}>
                            <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                        </a>
                     <div className="myCRT-overflow-col"style={{padding: 0, paddingTop: "10px",
                        paddingLeft: "20px", width: "1050px"}}>
                        <div className="row">
                           <div className="col-xs-6" style={{padding: "20px 20px 0px"}}>
                              <h5>Source Database:</h5>
                              <label><b>&nbsp;&nbsp;&nbsp;Name: </b>{this.state.env.dbName}</label><br/>
                              <label><b>&nbsp;&nbsp;&nbsp;Host: </b>{this.state.env.host}</label><br/>
                              <label>
                                 <b>&nbsp;&nbsp;&nbsp;Parameter Group: </b>
                                 {this.state.env.parameterGroup}</label><br/>
                              <label><b>&nbsp;&nbsp;&nbsp;User: </b>{this.state.env.user}
                              </label>
                              <br/><br/>
                           </div>
                           <div className="col-xs-6" style={{padding: "20px 40px 0px"}}>
                              <h5>S3 File Storage:</h5>
                              <label><b>&nbsp;&nbsp;&nbsp;Bucket: </b>{this.state.env.bucket}</label>
                           </div>
                        </div>
                     </div>
                        <DeleteModal id="deleteEnvModal" deleteId={this.state.env.id}
                               name={this.state.env.envName} delete={this.deleteEnv} type="Environment"/>
                  </div>
               </div>
               <br></br>
               <div className="row">
                  <div className="col-xs-12 col-md-5 mb-r">
                     <div><br/>
                        <h2 style={{display: "inline"}}>Captures</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-target="#captureModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <CaptureModal id="captureModal" envId={this.state.envId} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     <h4>Live</h4>
                     <div className="myCRT-overflow-col">
                     {liveCaptures.length ? liveCaptures : <p className="myCRT-empty-col">
                            No currently active captures</p>}
                    </div>
                     <br></br>
                     <h4>Scheduled</h4>
                     <div className="myCRT-overflow-col">
                     {scheduledCaptures.length ? scheduledCaptures : <p className="myCRT-empty-col">
                            No currently scheduled captures</p>}
                    </div>
                     <br></br>
                     <h4>Past</h4>
                     <div className="myCRT-overflow-col">
                        {pastCaptures.length ? pastCaptures : <p className="myCRT-empty-col">
                            No past captures exist.</p>}
                    </div>
                     <br></br>
                  </div>
                  <div className="col-xs-12 col-md-5 offset-md-1 mb-r">
                     <div><br/>
                        <h2 style={{display: "inline"}}>Replays</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                            data-target="#replayModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <ReplayModal id="replayModal" captures={this.state.captures}
                            env = {this.state.env} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     <h4>Live</h4>
                     <div className="myCRT-overflow-col">
                        {liveReplays.length ? liveReplays : <p className="myCRT-empty-col">
                            No currently active replays</p>}
                    </div>
                     <br></br>
                     <h4>Scheduled</h4>
                     <div className="myCRT-overflow-col">
                        {scheduledReplays.length ? scheduledReplays : <p className="myCRT-empty-col">
                            No currently scheduled replays</p>}
                    </div>
                     <br></br>
                     <h4>Past</h4>
                     <div className="myCRT-overflow-col">
                     {pastReplays.length ? pastReplays : <p className="myCRT-empty-col">
                            No past replays exist.</p>}
                    </div>
                     <br></br>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
