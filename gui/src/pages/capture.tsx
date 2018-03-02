import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from './../logging';
import { Graph } from './components/graph_comp';

import { ChartTypeDrop } from './components/chart_type_dropdown_comp';
import { DeleteModal } from './components/delete_modal_comp';
import { GraphSelectDrop } from './components/graph_dropdown_comp';
import { MessageModal } from './components/message_handler_comp';
import { ReplaySelectDrop } from './components/replay_compare_dropdown_comp';
import { ReplayPanel } from './components/replay_panel_comp';

import { IChildProgram, IMetricsList, IReplay, MetricType } from '@lbt-mycrt/common/dist/data';

import { mycrt } from './utils/mycrt-client';

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

            this.state = {envId, env: null, captureId: id, capture: null,
                  chartType: "Line Chart", allReplays: [], selectedReplays: [],
                  allGraphs: [], selectedGraphs: ["CPU"],
            };
      }

      public async componentWillMount() {
            if (this.state.envId) {
                  this.setState({
                        env: await mycrt.getEnvironment(this.state.envId),
                  });
            }
            if (this.state.captureId) {
                  this.setState({capture: await mycrt.getCapture(this.state.captureId)});

                  const replays = await mycrt.getReplaysForCapture(this.state.captureId);
                  if (replays) {
                        this.setState({allReplays: this.makeObject(replays, "id")});
                  }

                  const metrics = await mycrt.getAllCaptureMetrics(this.state.captureId);
                  if (metrics) {
                        this.setState({allGraphs: this.makeObject(metrics, "type")});
                        this.setWorkloadData(true);
                  }
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

      public async deleteCapture(id: number, deleteLogs: boolean) {
            await mycrt.deleteCapture(id, deleteLogs);
            window.location.assign(`./dashboard?id=${this.state.envId}`);
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
                        } else {
                              const replay = this.state.allReplays[replayId!];
                              if (replay) {
                                    dataPoint[replay.name] = replay.metrics[graphType].dataPoints[k].Maximum;
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

      public updateChartType(type: string) {
            this.setState({chartType: type});
      }

      public async updateReplays(checked: boolean, id: number) {
            const replay = this.state.allReplays[id];
            if (checked) {
                  if (!replay.metrics) {
                        await this.setReplayMetrics(id);
                  }
                  this.setState((prevState: any) => ({
                        selectedReplays: [id, ...prevState.selectedReplays],
                  }));
                  this.setWorkloadData(false, id);
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

      public render() {
            if (this.state.allGraphs.length === 0) { return (<div></div>); }
            const graphs: JSX.Element[] = [];
            if (this.state.selectedGraphs) {
                for (const graphType of this.state.selectedGraphs) {
                    graphs.push((<Graph data={this.state.allGraphs[graphType]}
                        id={this.state.captureId} type={this.state.chartType}/>));
                }
            }
            const replays: JSX.Element[] = [];
            if (this.state.allReplays) {
                for (const id in this.state.allReplays) {
                        const replay = this.state.allReplays[id];
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
                           data-target="#deleteCaptureModal" style={{marginBottom: "20px", marginLeft: "12px"}}>
                            <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                        </a>
                        <DeleteModal id="deleteCaptureModal" deleteId={this.state.captureId}
                               name={this.state.capture.name} delete={this.deleteCapture} type="Capture"/>
                     </div>
                     <div className="modal-body">
                        <div className="page-header">
                           <h2 style={{display: "inline"}}>Metrics</h2>
                           <ChartTypeDrop prompt="Chart Type" update={this.updateChartType}/>
                           <GraphSelectDrop prompt="Metric Types"
                                graphs={this.state.allGraphs} update={this.updateGraphs}/>
                           <ReplaySelectDrop prompt="Replays" replays={this.state.allReplays}
                              update={this.updateReplays}/>
                           <br></br>
                           {graphs}
                        </div>
                        <div className="page-header">
                           <h2>Replays</h2>
                        </div>
                        <div className="card-columns">
                              {replays}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

}

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
