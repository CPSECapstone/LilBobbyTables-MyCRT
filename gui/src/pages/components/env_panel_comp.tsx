import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from '../utils/mycrt-client';

export class EnvironmentPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.formatUsername = this.formatUsername.bind(this);
        this.state = {captureNum: null, replayNum: null, userCount: null};
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
        const result = await mycrt.getEnvCount(this.props.env.id);
        if (result) {
           this.setState({userCount: result.count});
        }

    }

   public formatUsername() {
      const email = this.props.env.email;
      return email.substring(0, email.lastIndexOf("@"));
   }

    public handleClick(event: any): void {
        window.location.assign(`./dashboard?id=${this.props.env.id}`);
    }

    public render() {
        if (this.state.userCount === null) {return <div></div>; }
        return (
            <div className="myCRT-panel">
                <div className="card mt-3 w-100 myCRT-card">
                    <div className="card-header myCRT-env-card" style={{paddingBottom: "5px"}}>
                        <h5 className="hover-text" role="button" style={{display: "inline"}}
                           onClick={ (e) => this.handleClick(e)}>
                           {this.props.title}</h5>
                        <i className="fa fa-users fa-lg" style={{float: "right", marginTop: "4px"}}></i>
                        <p style={{float: "right", paddingRight: "10px"}}>{this.state.userCount}</p>
                    </div>
                    <div className="card-body" style={{paddingBottom: "5px", paddingRight: "8px"}}>
                        <p>Captures: <b>{this.state.captureNum}</b></p>
                        <p>Replays: <b>{this.state.replayNum}</b></p>
                        <i style={{float: "right", color: "#95a5a6"}}> {this.formatUsername()}</i>
                    </div>
                </div>
            </div>
        );
    }
}
