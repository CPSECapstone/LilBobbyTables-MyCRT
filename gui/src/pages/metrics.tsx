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
        this.state = {cpuData: null, memData: null, ioData: null};
    }

    public async componentWillMount() {
        const cpuData = this.getData(123, "cpuData", MetricType.CPU);
        const memData = this.getData(123, "memData", MetricType.MEMORY);
        const ioData = this.getData(123, "ioData", MetricType.IO);
    }

    public async getData(id: number, name: string, type: MetricType) {
        const passedData = await mycrt.getCaptureMetrics(id, type);
        if (passedData != null) {
            this.formatData(passedData);
            this.setState({[name]: passedData});
        }
    }

    public formatData(data: IMetricsList) {
        for (const dataPoint of data.dataPoints) {
            dataPoint.Maximum1 = dataPoint.Maximum;
            dataPoint.Maximum2 = dataPoint.Maximum * 1.5;
            dataPoint.Maximum3 = dataPoint.Maximum * 2;
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
                        <Graph title={this.state.cpuData ? this.state.cpuData.displayName : ''}
                               data={this.state.cpuData ? this.state.cpuData.dataPoints : []} />
                        <Graph title={this.state.memData ? this.state.memData.displayName : ''}
                               data={this.state.memData ? this.state.memData.dataPoints : []} />
                        <Graph title={this.state.ioData ? this.state.ioData.displayName : ''}
                               data={this.state.ioData ? this.state.ioData.dataPoints : []} />
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDom.render(<MetricsApp />, document.getElementById('metrics-app'));
