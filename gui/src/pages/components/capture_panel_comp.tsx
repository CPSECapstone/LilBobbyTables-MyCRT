import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class CapturePanel extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        logger.info(this.props.capture.status);
    }

    public handleClick(event: any): void {
        window.location.assign(`./capture?id=${this.props.capture.id}`);
    }

    public render() {
        return (
            <div className="card myCRT-panel mt-3" onClick={ (e) => this.handleClick(e)}>
                <div className="card-header">
                    <h5>{this.props.title} {this.props.capture.status === ChildProgramStatus.LIVE ?
                        "Live" : "Dead"}</h5>
                </div>
                <div className="card-body">
                    <p> Information about this capture </p>
                </div>
            </div>
        );
    }
}
