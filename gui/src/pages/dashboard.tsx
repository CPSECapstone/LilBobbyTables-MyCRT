import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus, IChildProgram } from '@lbt-mycrt/common/dist/data';

import './common';

import '../../static/css/index.css';

import { ICapture } from '../../../common/dist/main';
import { BrowserLogger as logger } from '../logging';
import { BasePage } from './components/base_page_comp';
import { CaptureModal } from './components/capture_modal_comp';
import { CapturePanel } from './components/capture_panel_comp';
import { DeleteModal } from './components/delete_modal_comp';
import { ErrorBoundary } from './components/error_boundary_comp';
import { ListView } from './components/list_view_comp';
import { Pagination } from './components/pagination_comp';
import { ReplayModal } from './components/replay_modal_comp';
import { ReplayPanel } from './components/replay_panel_comp';
import { Search } from './components/search_comp';
import { ShareModal } from './components/share_modal_comp';
import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

class DashboardApp extends React.Component<any, any> {

    public constructor(props: any) {
        super(props);
        this.componentWillMount = this.componentWillMount.bind(this);
        this.deleteEnv = this.deleteEnv.bind(this);
        this.updateSearch = this.updateSearch.bind(this);
        this.updateCaptures = this.updateCaptures.bind(this);
        let id: any = null;
        const match = window.location.search.match(/.*\?.*id=(\d+)/);
        if (match) {
            id = match[1];
        }
        this.state = { envId: id, env: null, captures: [], replays: [], error: "",
         pastCSearch: "", scheduleCSearch: "", liveCSearch: "",
         pastRSearch: "", scheduleRSearch: "", liveRSearch: ""};
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
      let allReplays = [] as any;
      for (const id in this.state.captures) {
         const capture = this.state.captures[id];
         const replays = await mycrt.getReplaysForCapture(capture.id);
         if (replays) {
            allReplays = allReplays.concat(replays);
         }
      }
      this.setState({replays: allReplays});
    }

    public updateCaptures(id: string, status: ChildProgramStatus) {
        const captures = this.state.captures;
        captures[id].status = status;
        this.setState({captures});
    }

    public updateSearch(searchText: string, type: string) {
       this.setState({[type]: searchText});
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
      const result = await mycrt.deleteEnvironment(id, deleteLogs);
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
                if (capture.status === ChildProgramStatus.DONE || capture.status === ChildProgramStatus.FAILED) {
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
         for (let id = this.state.replays.length - 1; id >= 0; id--) {
            const replay = this.state.replays[id];
            const name = replay.name || `replay ${replay.id}`;
            const replayComp = (<ReplayPanel title={name} replay={replay} compare={true} key={replay.id}
               capture={this.state.captures[replay.captureId]} envId = {this.state.envId}/>);
            if (replay.status === ChildProgramStatus.DONE || replay.status === ChildProgramStatus.FAILED) {
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
                           data-target="#deleteEnvModal" style={{marginTop: "15px", marginLeft: "12px", float: "right"}}
                           data-backdrop="static" data-keyboard={false}>
                            <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                     </a>
                     <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-target="#shareEnvModal" style={{marginTop: "15px", marginLeft: "12px", float: "right"}}
                           data-backdrop="static" data-keyboard={false}>
                            <i className="fa fa-user-plus fa-lg" aria-hidden="true"></i>
                     </a><br/><br/>
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
                              <label><b>&nbsp;&nbsp;&nbsp;Bucket: </b>{this.state.env.bucket}</label><br/>
                              <label><b>&nbsp;&nbsp;&nbsp;Prefix: </b>{this.state.env.prefix +
                                 "/environment" + this.state.env.id}</label>
                           </div>
                        </div>
                     </div>
                        <DeleteModal id="deleteEnvModal" deleteId={this.state.envId}
                           name={this.state.env.envName} delete={this.deleteEnv} type="Environment"/>
                        <ShareModal id="shareEnvModal" name={this.state.env.envName} envId={this.state.envId}/>
                  </div>
               </div>
               <br></br>
               <div className="row">
                  <div className="col-xs-12 col-md-5 mb-r">
                     <div><br/>
                        <h2 style={{display: "inline"}}>Captures</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-backdrop="static" data-keyboard={false}
                           data-target="#captureModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <CaptureModal id="captureModal" envId={this.state.envId} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     <ListView name="Active" list={liveCaptures} update={this.updateSearch}
                        display="No currently active captures." type="liveCSearch" stateVar={this.state.liveCSearch}/>
                     <ListView name="Scheduled" list={scheduledCaptures} update={this.updateSearch}
                        display="No currently scheduled captures." type="scheduleCSearch"
                        stateVar={this.state.scheduleCSearch}/>
                     <ListView name="Past" list={pastCaptures} update={this.updateSearch}
                        display="No past captures exist." type="pastCSearch" stateVar={this.state.pastCSearch}/>
                  </div>
                  <div className="col-xs-12 col-md-5 offset-md-1 mb-r">
                     <div><br/>
                        <h2 style={{display: "inline"}}>Replays</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-backdrop="static" data-keyboard={false}
                           data-target="#replayModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <ReplayModal id="replayModal" captures={this.state.captures}
                            env = {this.state.env} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     <ListView name="Active" list={liveReplays} update={this.updateSearch}
                        display="No currently active replays." type="liveRSearch" stateVar={this.state.liveRSearch}/>
                     <ListView name="Scheduled" list={scheduledReplays} update={this.updateSearch}
                        display="No currently scheduled replays." type="scheduleRSearch"
                        stateVar={this.state.scheduleRSearch}/>
                     <ListView name="Past" list={pastReplays} update={this.updateSearch}
                        display="No past replays exist." type="pastRSearch" stateVar={this.state.pastRSearch}/>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}

ReactDom.render(<BasePage page={<DashboardApp />}/>, document.getElementById('dashboard-app'));
