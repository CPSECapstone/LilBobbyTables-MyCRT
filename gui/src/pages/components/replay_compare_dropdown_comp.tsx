import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

export class ReplaySelectDrop extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public selectReplays(event: any) {
        const target = event.currentTarget;
        this.props.update(target.checked, target.value, false);
     }

    public render() {
        const checkboxes: JSX.Element[] = [];
        for (const id in this.props.replays) {
            const replay = this.props.replays[id];
            checkboxes.push(
                // https://codepen.io/bseth99/pen/fboKH
                <li key={replay.id}><p className="small" data-value={replay.id} tabIndex={-1}
                    style={{ color: "#3498DB", margin: "10px", marginLeft: "20px" }}>
                <input type="checkbox" onChange={(e) => this.selectReplays(e)} value={replay.id}
                    defaultChecked={this.props.default === String(replay.id) ? true : false}/>
                    &nbsp;&nbsp;&nbsp;{replay.name}</p>
            </li>);
        }
        return (
            <div className="button-group" style ={{display: "inline"}}>
                <button type="button" className="btn btn-default btn-md dropdown-toggle"
                    data-toggle="dropdown" style={{marginBottom: "20px",
                        marginLeft: "20px", border: "1px solid"}}>
                    {this.props.prompt}
                    <span className="caret"></span>
                </button>
                <ul className="dropdown-menu" onClick={(e) => this.selectReplays(e)}>
                    {checkboxes}
                </ul>
            </div>
        );
    }
}
