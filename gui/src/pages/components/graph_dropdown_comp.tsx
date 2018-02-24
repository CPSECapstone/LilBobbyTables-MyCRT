import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

export class GraphSelectDrop extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public selectGraphTypes(event: any) {
        const target = event.currentTarget;
        this.props.update(target.checked, JSON.parse(target.value));
     }

    public render() {
        if (!this.props.graphs) { return (<div></div>); }
        const checkboxes: JSX.Element[] = [];
        for (const graph of this.props.graphs) {
            checkboxes.push(
                // https://codepen.io/bseth99/pen/fboKH
                <li><p className="small" data-value={graph} tabIndex={-1}
                    style={{ color: "#3498DB", margin: "10px", marginLeft: "20px" }}>
                <input type="checkbox" onChange={(e) => this.selectGraphTypes(e)} value={JSON.stringify(graph)}/>
                    &nbsp;&nbsp;&nbsp;{graph.displayName}</p>
            </li>);
        }
        return (
            <div className="button-group" style ={{display: "inline"}}>
                <button type="button" className="btn btn-default btn-sm dropdown-toggle"
                    data-toggle="dropdown" style={{marginBottom: "20px",
                        marginLeft: "20px", border: "1px solid"}}>
                    {this.props.prompt}
                    <span className="caret"></span>
                </button>
                <ul className="dropdown-menu">
                    {checkboxes}
                </ul>
            </div>
        );
    }
}
