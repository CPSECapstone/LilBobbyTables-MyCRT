import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { Graph } from './components/graph_comp';

import { CompareModal } from './components/compare_modal_comp';
import { ReplayPanel } from './components/replay_panel_comp';

import { IMetricsList, MetricType } from '@lbt-mycrt/common/dist/data';

import { mycrt } from './utils/mycrt-client';

class CaptureApp extends React.Component<any, any> {

      public constructor(props: any) {
            super(props);

            // FIXME: THIS IS A QUICK AND DIRTY WAY TO DO THIS

            let id: any = null;
            const match = window.location.search.match(/.*\?.*id=(\d+)/);
            if (match) {
                  id = match[1];
            }

            this.state = {
                  captureId: id,
                  capture: null,
            };
      }

      public async componentWillMount() {
            if (this.state.captureId) {
                  this.setState({
                        capture: await mycrt.getCapture(this.state.captureId),
                  });
            }
            const cpuData = this.getData(this.state.captureId, "cpuData", MetricType.CPU);
            const memData = this.getData(this.state.captureId, "memData", MetricType.MEMORY);
            const readData = this.getData(this.state.captureId, "readData", MetricType.READ);
            const writeData = this.getData(this.state.captureId, "writeData", MetricType.WRITE);
      }

      public async getData(id: number, name: string, type: MetricType) {
            const passedData = await mycrt.getCaptureMetrics(id, type);
            if (passedData != null) {
                  this.formatData(passedData);
                  this.setState({ [name]: passedData });
            }
      }

      public formatData(data: IMetricsList) {
            for (const dataPoint of data.dataPoints) {
                const time = new Date(dataPoint.Timestamp);
                dataPoint.Timestamp = time.toLocaleString();
                dataPoint[this.state.capture.name] = dataPoint.Maximum;
                delete dataPoint.Maximum;
            }
        }

      public render() {
            if (!this.state.capture) { return (<div></div>); }
            const metricsTarget = `./metrics?id=${this.state.captureId}`;
            return (
                  <div>
                        <nav>
                              <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
                  <li className="breadcrumb-item active">{ this.state.capture ? this.state.capture.name : '' }</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-sm-12 mb-r">

                     <div className="page-header">
                        <h1>{ this.state.capture ? this.state.capture.name : '' }</h1>
                     </div>
                     <div className="modal-body">
                        <div className="page-header">
                           <h2 style={{display: "inline"}}>Metrics</h2>
                           <a role="button" href="#" className="btn btn-primary" data-toggle="modal"
                              data-target="#compareModal" style={{marginBottom: "20px", marginLeft: "20px"}}>
                              <i className="fa fa-line-chart" aria-hidden="true"></i> Compare
                           </a>
                           <CompareModal id="compareModal" target={metricsTarget} capture={this.state.capture}/>
                           <br></br>
                           <Graph data={this.state.cpuData} id={this.state.captureId} type="CPU" />
                           <Graph data={this.state.memData} id={this.state.captureId} type="MEMORY" />
                           <Graph data={this.state.readData} id={this.state.captureId} type="READ" />
                           <Graph data={this.state.writeData} id={this.state.captureId} type="WRITE" />
                        </div>
                        <div className="page-header">
                           <h2>Replays</h2>
                        </div>
                        <div className="card-columns">
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
