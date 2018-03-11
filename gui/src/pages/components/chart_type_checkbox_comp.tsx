import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

const types = ["Line Chart", "Bar Chart", "Area Chart"];

export class ChartTypeCheck extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public fillChart(event: any) {
        const target = event.currentTarget;
        this.props.update(target.checked);
     }

    public render() {
        return (
            <label className="checkbox-inline" style={{paddingBottom: "20px", margin: "20px",
                verticalAlign: "middle", fontSize: "0.9rem"}}>
                <input type="checkbox" onChange={(e) => this.fillChart(e)}/>
                    &nbsp;&nbsp;&nbsp;Show Area Chart
            </label>
        );
    }
}
