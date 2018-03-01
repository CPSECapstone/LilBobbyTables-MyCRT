import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from './../logging';
import { Graph } from './components/graph_comp';

import { DeleteModal } from './components/delete_modal_comp';
import { GraphSelectDrop } from './components/graph_dropdown_comp';
import { MessageModal } from './components/message_handler_comp';
import { ReplaySelectDrop } from './components/replay_compare_dropdown_comp';
import { ReplayPanel } from './components/replay_panel_comp';

import { IMetricsList, IReplay, MetricType } from '@lbt-mycrt/common/dist/data';

import { mycrt } from './utils/mycrt-client';

class CaptureApp extends React.Component<any, any> {

      public constructor(props: any) {
            super(props);
            this.updateGraphs = this.updateGraphs.bind(this);
            this.formatData = this.formatData.bind(this);
            this.deleteCapture = this.deleteCapture.bind(this);

            // FIXME: THIS IS A QUICK AND DIRTY WAY TO DO THIS
            let id: any = null;
            const match = window.location.search.match(/.*\?.*id=(\d+)/);
            if (match) {
                  id = match[1];
            }
            let envId: any = null;
            const envMatch = window.location.search.match(/.*\?.*envId=(\d+)/);
            if (envMatch) {
                  envId = envMatch[1];
            }

            this.state = {
                  envId,
                  env: null,
                  captureId: id,
                  capture: null,
                  allReplays: [],
                  selectedReplays: [],
                  allGraphs: [],
                  selectedGraphs: [],
            };
      }

      public async componentWillMount() {
            if (this.state.envId) {
                  this.setState({
                        env: await mycrt.getEnvironment(this.state.envId),
                  });
            }
            if (this.state.captureId) {
                  this.setState({
                        capture: await mycrt.getCapture(this.state.captureId),
                        allReplays: await mycrt.getReplaysForCapture(this.state.captureId), // error check later
                  });
            }
            const allGraphs = await mycrt.getAllCaptureMetrics(this.state.captureId);
            if (allGraphs != null) {
                this.formatData(allGraphs);
                this.setState({allGraphs});
            }
      }

      public async deleteCapture(id: number, deleteLogs: boolean) {
            await mycrt.deleteCapture(id, deleteLogs);
            window.location.assign(`./dashboard?id=${this.state.envId}`);
      }

      // add in this.state.selectedReplays to loop in later and have child replay dropdown call this function
      public formatData(metricsList: [IMetricsList]) {
            metricsList.forEach((metric) => {
                  for (const dataPoint of metric.dataPoints) {
                        const time = new Date(dataPoint.Timestamp);
                        dataPoint.Timestamp = time.toLocaleString();
                        dataPoint[this.state.capture.name] = dataPoint.Maximum;
                        delete dataPoint.Maximum;
                  }
            });
      }

      public updateReplays(checked: boolean, value: IReplay) {
            if (checked) {
                  this.setState((prevState: any) => ({
                      selectedReplays: [value, ...prevState.selectedReplays],
                  }));
            } else {
                  this.setState({
                      selectedReplays: this.state.selectedReplays.filter( (replay: IReplay) => {
                        return replay.id !== value.id;
                      }),
                  });
            }
      }

    // fix bugs in this...isn't working right now
      public updateGraphs(checked: boolean, value: IMetricsList) {
          if (checked) {
            this.setState((prevState: any) => ({
                selectedGraphs: [value, ...prevState.selectedGraphs],
            }));
          } else {
            this.setState({
                selectedGraphs: this.state.selectedGraphs.filter( (graph: IMetricsList) => {
                  return graph.type !== value.type;
                }),
            });
          }
      }

      public render() {
            if (!this.state.capture) { return (<div></div>); }
            const graphs: JSX.Element[] = [];
            if (this.state.selectedGraphs) {
                for (const graph of this.state.selectedGraphs) {
                    graphs.push((<Graph data={graph} id={this.state.captureId} />));
                }
            }
            const replays: JSX.Element[] = [];
            if (this.state.allReplays) {
                for (const replay of this.state.allReplays) {
                  let name = `${replay.name}`;
                  if (!name) {
                      name = `replay ${replay.id}`;
                  }
                  replays.push((<ReplayPanel title={name} replay={replay}
                        capture={this.state.capture} envId = {this.state.envId}/>));
                }
            }
            const metricsTarget = `./metrics?id=${this.state.captureId}`;
            return (
                  <div>
                        <nav>
                              <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                                    <li className="breadcrumb-item">
                                          <a href={`./dashboard?id=${this.state.envId}`}>{this.state.env.name}</a>
                                    </li>
                                    <li className="breadcrumb-item active">{this.state.capture.name}</li>
                              </ol>
                        </nav>
            <div className="container">
               <div className="row">
                  <div className="col-sm-12 mb-r">
                     <div className="page-header">
                        <h1 style={{display: "inline"}}>{ this.state.capture.name }</h1>
                        <a role="button" className="btn btn-danger" data-toggle="modal" href="#"
                           data-target="#deleteCaptureModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                        </a>
                        <DeleteModal id="deleteCaptureModal" deleteId={this.state.captureId}
                               name={this.state.capture.name} delete={this.deleteCapture} type="Capture"/>
                     </div>
                     <div className="modal-body">
                        <div className="page-header">
                           <h2 style={{display: "inline"}}>Metrics</h2>
                           <GraphSelectDrop prompt="Graph Types"
                                graphs={this.state.allGraphs} update={this.updateGraphs}/>
                           <ReplaySelectDrop prompt="Replays" replays={this.state.allReplays}
                              update={this.updateReplays}/>
                           <br></br>
                           {graphs}
                        </div>
                        <div className="page-header">
                           <h2>Replays</h2>
                           <br></br>
                           {replays}
                        </div>
                        <div className="card-columns"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

}

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
