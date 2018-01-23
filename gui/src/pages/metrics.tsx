import './common';

import '../../static/css/metrics.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { Graph } from './components/graph_comp';

import { IMetricsList } from '@lbt-mycrt/common';
import { mycrt } from './utils/mycrt-client';

class MetricsApp extends React.Component<any, any> {

    public constructor(props: any) {
        super(props);
        this.state = {data: null};
    }

    public async componentWillMount() {
        logger.info("getting data");
        const passedData = await mycrt.getCaptureMetrics(123);
        logger.info("got data");
        if (passedData != null) {
            this.setState({data: passedData});
            logger.info("changed state");
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
                        <Graph title={this.state.data ? this.state.data.displayName : ''}
                               data={this.state.data ? this.state.data.dataPoints : []} />
                        <Graph title={this.state.data ? this.state.data.displayName : ''}
                               data={this.state.data ? this.state.data.dataPoints : []} />
                        <Graph title={this.state.data ? this.state.data.displayName : ''}
                               data={this.state.data ? this.state.data.dataPoints : []} />
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDom.render(<MetricsApp />, document.getElementById('metrics-app'));
