import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from '../utils/mycrt-client';

export class EnvironmentPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = {captureNum: null, replayNum: null};
    }

    public async componentWillMount() {
        const captures = await mycrt.getCapturesForEnvironment(this.props.env.id);
        let replayNum = 0;
        if (captures) {
            this.setState({captureNum: captures.length});
            for (const capture of captures) {
                if (capture.id) {
                    const replays = await mycrt.getReplaysForCapture(capture.id);
                    if (replays) {
                        replayNum += replays.length;
                    }
                }
            }
        }
        this.setState({replayNum});
    }

    public handleClick(event: any): void {
        window.location.assign(`./dashboard?id=${this.props.env.id}`);
    }

    public render() {
        if (this.state.replayNum === null) {return <div></div>; }
        return (
            <div className="myCRT-panel">
                <div className="card mt-3 w-100 myCRT-card">
                    <div className="card-header myCRT-env-card">
                        <h5 className="hover-text" role="button" onClick={ (e) => this.handleClick(e)}>
                           {this.props.title}</h5>
                    </div>
                    <div className="card-body">
                        <p>Captures: <b>{this.state.captureNum}</b></p>
                        <p>Replays: <b>{this.state.replayNum}</b></p>
                    </div>
                </div>
            </div>
        );
    }
}
