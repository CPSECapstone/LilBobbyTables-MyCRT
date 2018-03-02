import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

const types = ["Line Chart", "Bar Chart", "Area Chart"];

export class ChartTypeDrop extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public selectChart(event: any) {
        const target = event.currentTarget;
        this.props.update(target.value);
     }

    public render() {
        const checkboxes: JSX.Element[] = [];
        for (const type of types) {
            checkboxes.push(
                // https://codepen.io/bseth99/pen/fboKH
                <li key={type}><p className="small" data-value={type} tabIndex={-1}
                    style={{ color: "#3498DB", margin: "10px", marginLeft: "20px" }}>
                <input type="radio" name="chartType" onChange={(e) => this.selectChart(e)} value={type}
                    defaultChecked={type === "Line Chart" ? true : false}/>
                    &nbsp;&nbsp;&nbsp;{type}</p>
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
                <ul className="dropdown-menu" onClick={(e) => this.selectChart(e)}>
                    {checkboxes}
                </ul>
            </div>
        );
    }
}
