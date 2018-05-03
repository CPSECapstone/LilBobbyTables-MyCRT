import './common';

import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import '../../static/css/capture.css';

import { ChildProgramStatus, IChildProgram, IMetricsList, IReplay, MetricType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from './../logging';
import { mycrt } from './utils/mycrt-client';

import { BasePage } from './components/base_page_comp';
import { Breadcrumbs } from './components/breadcrumbs_comp';
import { CaptureInfo } from './components/capture_info_comp';
import { ChartTypeCheck } from './components/chart_type_checkbox_comp';
import { DeleteModal } from './components/delete_modal_comp';
import { Graph } from './components/graph_comp';
import { GraphSelectDrop } from './components/graph_dropdown_comp';
import { MessageModal } from './components/message_handler_comp';
import { Pagination } from './components/pagination_comp';
import { ReplaySelectDrop } from './components/replay_compare_dropdown_comp';
import { ReplayInfo } from './components/replay_info_comp';
import { ReplayPanel } from './components/replay_panel_comp';
import { Search } from './components/search_comp';

class CaptureApp extends React.Component<any, any> {

   public constructor(props: any) {
      super(props);
      this.updateGraphs = this.updateGraphs.bind(this);
      this.updateChartType = this.updateChartType.bind(this);
      this.setWorkloadData = this.setWorkloadData.bind(this);
      this.updateReplays = this.updateReplays.bind(this);
      this.setReplayMetrics = this.setReplayMetrics.bind(this);
      this.removeWorkloadData = this.removeWorkloadData.bind(this);
      this.deleteCapture = this.deleteCapture.bind(this);
      this.updateSearch = this.updateSearch.bind(this);
      this.deleteReplay = this.deleteReplay.bind(this);

      let id: any = null;
      const match = window.location.search.match(/.*\?.*id=(\d+)/);
      if (match) {
            id = match[1];
      }
      let view: any = null;
      const viewMatch = window.location.search.match(/.*\?.*view=([a-z]+)/);
      if (viewMatch) {
            view = viewMatch[1];
      }
      let defaultReplay: any = null;
      let replayInfo: any = null;
      const replayMatch = window.location.search.match(/.*\?.*replayId=(\d+)/);
      if (replayMatch) {
         if (view === "replays") {
            replayInfo = replayMatch[1];
         } else {
            defaultReplay = replayMatch[1];
         }
      }
      let envId: any = null;
      const envMatch = window.location.search.match(/.*\?.*envId=(\d+)/);
      if (envMatch) {
            envId = envMatch[1];
      }

      this.state = {envId, view, defaultReplay, replayInfo, env: null, captureId: id, capture: null,
            areaChart: false, allReplays: [], selectedReplays: [], replaySearch: "",
            allGraphs: [], selectedGraphs: ["WRITE"], navTabs: ["Details", "Metrics", "Replays"],
      };
   }

   public async componentWillMount() {
      if (this.state.envId) {
         const env = await mycrt.getEnvironment(this.state.envId);
         if (env) {
            this.setState({env});
         }
      }
      if (this.state.captureId) {
         const capture = await mycrt.getCapture(this.state.captureId);
         if (capture) {
            this.setState({capture});
         }
         const replays = await mycrt.getReplaysForCapture(this.state.captureId);
         if (replays) {
            this.setState({allReplays: this.makeObject(replays, "id")});
         }
         const metrics = await mycrt.getAllCaptureMetrics(this.state.captureId);
         if (metrics) {
            this.setState({allGraphs: this.makeObject(metrics, "type")});
            if (this.state.defaultReplay) {
               this.updateReplays(true, this.state.defaultReplay, true);
            } else {
               this.setWorkloadData(true);
            }
         }
      }
      if (this.state.replayInfo) {
         const chosenReplay = this.state.allReplays[this.state.replayInfo];
         const replayDB = await mycrt.getReplayDB(chosenReplay.dbId);
         if (replayDB) {
            chosenReplay.db = replayDB;
         }
         this.setState({replayObj: chosenReplay});
      }
      $(`#captureTabs a[href="#${this.state.view}"]`).tab('show');
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

   public async deleteCapture(id: number, deleteLogs: boolean) {
      await mycrt.deleteCapture(id, deleteLogs);
      window.location.assign(`./dashboard?id=${this.state.envId}`);
   }

   public async deleteReplay(id: number, deleteLogs: boolean) {
      await mycrt.deleteReplay(id, deleteLogs);
      window.location.assign(`./capture?id=${this.state.captureId}&envId=${this.state.envId}&view=replays`);
   }

   public async setWorkloadData(captureMetrics: boolean, replayId?: number) {
      const metrics = this.state.allGraphs;
      for (const graphType in metrics) {
         const graph = metrics[graphType];
         for (let k = 0; k < graph.dataPoints.length; k++) {
            const dataPoint = graph.dataPoints[k];
            if (captureMetrics) {
               const time = new Date(dataPoint.Timestamp);
               dataPoint.Timestamp = time.toLocaleString();
               dataPoint[this.state.capture.name] = dataPoint.Maximum;
            }
            if (replayId) {
               const replay = this.state.allReplays[replayId!];
               if (replay) {
                  const replayMetric = replay.metrics[graphType].dataPoints[k];
                  if (replayMetric) {
                     dataPoint[replay.name] = replayMetric.Maximum;
                  }
               }
            }
         }
      }
      this.setState({allGraphs: metrics});
   }

   public removeWorkloadData(replayName: string) {
      const metrics = this.state.allGraphs;
      for (const graphType in metrics) {
         metrics[graphType].dataPoints.forEach((dataPoint: any) => {
            delete dataPoint[replayName];
         });
      }
      this.setState({allGraphs: metrics});
   }

   public async setReplayMetrics(id: number) {
      const metrics = await mycrt.getAllReplayMetrics(id);
      if (!metrics) {
         logger.info("Couldn't get replay metrics");
         return;
      }
      const replays = this.state.allReplays;
         replays[id].metrics = this.makeObject(metrics, "type");
         this.setState({allReplays: replays});
      }

   public updateChartType(chartType: boolean) {
      this.setState({areaChart: chartType});
   }

   public async updateReplays(checked: boolean, id: number, updateCaptures: boolean) {
      const replay = this.state.allReplays[id];
      if (checked) {
         if (!replay.metrics) {
            await this.setReplayMetrics(id);
         }
         this.setState((prevState: any) => ({
            selectedReplays: [id, ...prevState.selectedReplays],
         }));
         this.setWorkloadData(updateCaptures, id);
      } else {
         this.setState({
            selectedReplays: this.state.selectedReplays.filter((selectedId: any) => {
               return selectedId !== id;
            }),
         });
         if (replay) {
            this.removeWorkloadData(replay.name);
         }
      }
   }

   public updateGraphs(checked: boolean, type: MetricType) {
      const graph = this.state.allGraphs[type];
      if (checked) {
         this.setState((prevState: any) => ({
            selectedGraphs: [type, ...prevState.selectedGraphs],
         }));
      } else {
         this.setState({
            selectedGraphs: this.state.selectedGraphs.filter((selectedType: MetricType) => {
               return selectedType !== type;
            }),
         });
      }
   }

   public updateSearch(searchText: string, type: string) {
      this.setState({[type]: searchText});
   }

   public render() {
      if (this.state.allGraphs.length === 0) { return (<div></div>); }
      const graphs: JSX.Element[] = [];
      if (this.state.selectedGraphs) {
         for (const graphType of this.state.selectedGraphs) {
            graphs.push((<div><Graph data={this.state.allGraphs[graphType]} key={graphType}
               id={this.state.captureId} filled={this.state.areaChart}/><br/></div>));
         }
      }
      const replays: JSX.Element[] = [];
      const replaysToGraph = [];
      if (this.state.allReplays) {
         for (const id in this.state.allReplays) {
            const replay = this.state.allReplays[id];
            if (replay.status === ChildProgramStatus.DONE) {
               replaysToGraph.push(replay);
            }
            const name = replay.name || `replay ${replay.id}`;
            replays.push((<ReplayPanel title={name} replay={replay} compare={false} key={name}
               capture={this.state.capture} envId = {this.state.envId}/>));
         }
      }
      const navTabs: JSX.Element[] = [];
      for (const tabName of this.state.navTabs) {
         navTabs.push(<li className="nav-item">
            <a className="nav-link" data-toggle="tab" href={`#${tabName.toLowerCase()}`} role="tab">
            {tabName}</a></li>);
      }
      const metricsTarget = `./metrics?id=${this.state.captureId}`;
      return (
         <div>
            <Breadcrumbs env={this.state.env} capture={this.state.capture}/>
            <div className="container"><div className="row"><div className="col-sm-12 mb-r">
               <div className="page-header">
                  <h1 className="align">{this.state.capture.name}</h1>
                  <a role="button" className="btn btn-danger deleteBtn" data-toggle="modal" href="#"
                     data-backdrop="static" data-keyboard={false}
                     data-target="#deleteCaptureModal">
                     <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                  </a>
                  <DeleteModal id="deleteCaptureModal" deleteId={this.state.captureId}
                     name={this.state.capture.name} delete={this.deleteCapture} type="Capture"/>
               </div><br/>
               <ul className="nav nav-tabs" role="tablist" id="captureTabs">{navTabs}</ul>
               <div className="tab-content">
                  <div className="tab-pane" id="details" role="tabpanel">
                     <CaptureInfo capture={this.state.capture} env={this.state.env}/>
                  </div>
                  <div className="tab-pane" id="metrics" role="tabpanel">
                     <div className="modal-body">
                        <div className="page-header"><br/>
                           <h2 className="align">Metrics</h2>
                           <GraphSelectDrop prompt="Metric Types"
                              graphs={this.state.allGraphs} update={this.updateGraphs}/>
                           {replaysToGraph.length > 0 ?
                              <ReplaySelectDrop prompt="Replays" replays={replaysToGraph}
                                 update={this.updateReplays} default={this.state.defaultReplay}/> : null
                           }
                           <ChartTypeCheck prompt="Chart Type" update={this.updateChartType}/><br/>
                           {graphs}<br/><br/>
                        </div>
                     </div>
                  </div>
                  <div className="tab-pane" id="replays" role="tabpanel">
                     {this.state.replayObj ?
                        <ReplayInfo replay={this.state.replayObj} bucket={this.state.env.bucket}
                        envId={this.state.envId} captureId={this.state.captureId} prefix={this.state.env.prefix}
                        delete={this.deleteReplay}/> : null
                     }<br/>
                     <div className="page-header">
                        <h2 style={{display: "inline"}}>Replays</h2>
                        <Search length={replays.length} type="replaySearch" update={this.updateSearch}
                           style={{float: "right", display: "inline-block", margin: "10px",
                           paddingTop: "5px", width: "50%"}}/>
                     </div>
                     <br/>
                     <div className="myCRT-overflow-col">
                        {replays.length ?
                           <div className="card-columns"><Pagination
                              list={replays.filter((val) =>
                                 val.props.title.toLowerCase().search(this.state.replaySearch.toLowerCase()) >= 0)}
                              limit={6}/></div> :
                           <p className="myCRT-empty-col">No replays exist.</p>
                        }
                     </div>
                  </div>
               </div>
            </div>
         </div></div></div>
      );
   }

}

ReactDom.render(<BasePage page={<CaptureApp />}/>, document.getElementById('capture-app'));
