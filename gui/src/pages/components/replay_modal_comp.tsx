import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from '../utils/mycrt-client';

export class ReplayModal extends React.Component<any, any>  {

    public render() {
        const captures: JSX.Element[] = [];
        if (this.props.captures) {
           for (const capture of this.props.captures) {
              let name = `${capture.name}`;
              if (!name) {
                  name = `capture ${capture.id}`;
              }
              captures.push((<option>{name}</option>));
           }
        }
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h5 className="modal-title">New Replay</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>Replay Name</b></label>
                                    <input type="name" className="form-control" id="replayName"
                                           aria-describedby="replayName" placeholder="Enter name"></input>
                                        <small id="replayName" className="form-text text-muted"></small>
                                </div>
                                {<select className="form-control">
                                    <option>Select Capture...</option>
                                    {captures}
                                </select>}
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info">Save Replay</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
