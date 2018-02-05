import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { Graph } from './components/graph_comp';

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
            const ioData = this.getData(this.state.captureId, "ioData", MetricType.IO);
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
            }
        }

      public render() {
            const metricsTarget = `./metrics?id=${this.state.captureId}`;
            return (
                  <div>
                        <nav>
                              <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
                  <li className="breadcrumb-item active">{ this.state.capture ? this.state.capture.name :
                        `Capture ${this.state.captureId}` }</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-sm-12 mb-r">

                     <div className="page-header">
                        <h1>{ this.state.capture ? this.state.capture.name : `Capture ${this.state.captureId}` }</h1>
                     </div>
                     <div className="modal-body">
                        <div className="page-header">
                           <h2 style={{display: "inline"}}>Metrics</h2>
                           <a role="button" href={metricsTarget} className="btn btn-primary"
                              style={{marginBottom: "20px", marginLeft: "20px"}}>
                              <i className="fa fa-line-chart" aria-hidden="true"></i> Compare
                           </a>
                           <Graph title={this.state.cpuData ? this.state.cpuData.displayName : ''}
                               data={this.state.cpuData ? this.state.cpuData.dataPoints : []}
                               id={this.state.captureId} type="CPU" />
                           <Graph title={this.state.memData ? this.state.memData.displayName : ''}
                               data={this.state.memData ? this.state.memData.dataPoints : []}
                               id={this.state.captureId} type="MEMORY" />
                           <Graph title={this.state.ioData ? this.state.ioData.displayName : ''}
                               data={this.state.ioData ? this.state.ioData.dataPoints : []}
                               id={this.state.captureId} type="IO" />
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
