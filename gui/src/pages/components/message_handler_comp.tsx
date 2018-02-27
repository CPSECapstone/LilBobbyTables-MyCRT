import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';

export class MessageModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        $("#messageModal").show();
    }

    public handleClick(event: any) {
        const cancelBtn = document.getElementById("close");
        if (cancelBtn) {
            cancelBtn.click();
        }
    }

    public render() {
        return (
            <div className="modal fade" role="dialog" id = "messageModal"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className={this.props.type === "Error" ?
                            "modal-header myCRT-modal-danger" : "modal-header myCRT-modal-success"}>
                            <h4 className="modal-title">{this.props.title}</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>{this.props.msg}</b></label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className={this.props.type === "Error" ?
                                "btn btn-danger" : "btn btn-success"}
                                onClick={this.handleClick.bind(this)}>Okay</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
