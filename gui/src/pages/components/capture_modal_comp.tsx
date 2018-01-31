import React = require('react');
import ReactDom = require('react-dom');

import { StartDateTime } from './start_date_time_comp';

export class CaptureModal extends React.Component<any, any>  {

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h5 className="modal-title">New Capture</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>Capture Name</b></label>
                                    <input type="name" className="form-control" id="captureName"
                                           aria-describedby="captureName" placeholder="Enter name"></input>
                                    <small id="captureName" className="form-text text-muted"></small>
                                    <br/>
                                    <StartDateTime />
                                    <br/>
                                    <label><b>Duration</b></label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary"
                                data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
