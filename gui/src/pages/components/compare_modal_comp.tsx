import React = require('react');
import ReactDom = require('react-dom');

export class CompareModal extends React.Component<any, any>  {

    public render() {
        const checkBoxes: JSX.Element[] = [];
        for (let i = 1; i < 21; i++) {
            checkBoxes.push(
                <div className="form-check">
                    <label className="form-check-label">
                        <input className="form-check-input" type="checkbox" value="" />
                        Replay {i}
                    </label>
                </div>);
        }
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h5 className="modal-title">Compare to <b>{this.props.capture.name}</b></h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>Select Replays</b></label>
                                    <div className="container myCRT-multi-select">
                                        {checkBoxes}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelReplayBtn"
                                    data-dismiss="modal">Cancel</button>
                            <a role="button" href={this.props.target} className="btn btn-info">
                              Compare </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
