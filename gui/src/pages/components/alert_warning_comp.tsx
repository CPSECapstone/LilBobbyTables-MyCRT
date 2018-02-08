import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class WarningAlert extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
    }

    public handleClose(event: any) {
        $('#' + this.props.id).hide();
    }

    public render() {
        return (
            <div className="alert alert-danger alert-dismissible fade show" role="alert" id={this.props.id}
                 style={this.props.style}>
                <button type="button" className="close" aria-label="Close" onClick={(e) => this.handleClose(e)}>
                    <span aria-hidden="true">&times;</span>
                </button>
                <strong>Warning! </strong>{this.props.msg}
            </div>
        );
    }
}
