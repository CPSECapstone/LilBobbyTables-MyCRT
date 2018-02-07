import './common';

import '../../static/css/metrics.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { Graph } from './components/graph_comp';

import { IMetricsList, MetricType } from '@lbt-mycrt/common/dist/data';
import { mycrt } from './utils/mycrt-client';

class MetricsApp extends React.Component<any, any> {

    public constructor(props: any) {
        super(props);

        // FIXME: THIS IS A QUICK AND DIRTY WAY TO DO THIS

        let id: any = 123;
        const match = window.location.search.match(/.*?.*id=(\d+)/);
        if (match) {
           id = match[1];
        }

        this.state = {cpuData: null, memData: null, ioData: null, captureId: id, capture: null};
    }

   public async componentWillMount() {
      const capture = await mycrt.getCapture(this.state.captureId);
      this.setState({capture});
      const id = capture!.id!; // TODO: handle the failure case
      const cpuData = this.getData(id, "cpuData", MetricType.CPU);
      const memData = this.getData(id, "memData", MetricType.MEMORY);
      const ioData = this.getData(id, "ioData", MetricType.IO);
   }

    public async getData(id: number, name: string, type: MetricType) {
        const passedData = await mycrt.getCaptureMetrics(id, type);
        if (passedData != null) {
            this.formatData(passedData, 4);
            this.setState({[name]: passedData});
        }
    }

    public formatData(data: IMetricsList, replayNum: any) {
        for (const dataPoint of data.dataPoints) {
            const time = new Date(dataPoint.Timestamp);
            dataPoint.Timestamp = time.toLocaleString();
            dataPoint[this.state.capture.name] = dataPoint.Maximum;
            for (let i = replayNum; i >= 1; i--) {
                dataPoint['Replay ' + i] = dataPoint.Maximum * (0.3 * i);
            }
            delete dataPoint.Maximum;
        }
    }

    public render() {
        return (
            <div>
                <nav>
                    <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                    <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="./capture">Capture</a></li>
                    <li className="breadcrumb-item active">Metrics</li>
                    </ol>
                </nav>

                <div className="container">
                    <div className="row">
                    <div className="col-xs-12">

                        <div className="page-header">
                            <h1>Capture Metrics</h1>
                        </div>
                        <br></br>
                        <Graph data={this.state.cpuData} id={this.state.captureId} type="CPU" />
                        <Graph data={this.state.memData} id={this.state.captureId} type="MEMORY" />
                        <Graph data={this.state.ioData} id={this.state.captureId} type="IO" />
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDom.render(<MetricsApp />, document.getElementById('metrics-app'));
