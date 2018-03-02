import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Legend, Line, LineChart,
    Tooltip, XAxis, YAxis } from 'recharts';

import React = require('react');
import ReactDom = require('react-dom');

import { colors } from '../utils/color-picker';

import { BrowserLogger as logger } from '../../logging';

export class Graph extends React.Component<any, any>  {

    public render() {
        if (!this.props.data) { return (<div></div>); }
        const downloadLink = `/api/captures/${this.props.id}/metrics?type=${this.props.type}`;
        const downloadFileName = `${this.props.type}metrics.json`;
        const lineNum = Object.keys(this.props.data).length;

        const metrics: JSX.Element[] = [];
        if (this.props.data.dataPoints) {
            const unit = `  ${this.props.data.dataPoints[0].Unit}`;
            let index = 0;
            for (const key in this.props.data.dataPoints[0]) {
                if (key !== "Timestamp" && key !== "Unit" && key !== "Maximum") {
                    if (this.props.type === "Line Chart") {
                        metrics.push(<Line name={key} type="monotone" dataKey={key} stroke={colors[index]}
                        activeDot={{ r: 8 }} isAnimationActive={true} unit={unit} strokeWidth={1.5}/>);
                    } else if (this.props.type === "Bar Chart") {
                        metrics.push(<Bar name={key} dataKey={key} fill={colors[index]}
                         isAnimationActive={true} unit={unit}/>);
                    } else {
                        metrics.push(<Area name={key} type="monotone" dataKey={key} stroke={colors[index]}
                        fillOpacity={0.5} fill={colors[index]} isAnimationActive={true}
                        activeDot={{ r: 8 }} unit={unit}/>);
                    }
                    index++;
                }
            }
        }
        let chart: JSX.Element;
        if (this.props.type === "Line Chart") {
            chart = <LineChart width={1000} height={400} data={this.props.data.dataPoints}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="Timestamp" />
                    <YAxis allowDecimals={true}>
                    {/* <Label value="Unit" position="insideLeft" angle={-90} /> */}
                    </YAxis>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    {metrics}
                </LineChart>;
        } else if (this.props.type === "Bar Chart") {
            chart = <BarChart width={1000} height={400} data={this.props.data.dataPoints}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="Timestamp" />
                    <YAxis allowDecimals={true}>
                    {/* <Label value="Unit" position="insideLeft" angle={-90} /> */}
                    </YAxis>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    {metrics}
            </BarChart>;
        } else {
            chart = <AreaChart width={1000} height={400} data={this.props.data.dataPoints}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="Timestamp" />
                    <YAxis allowDecimals={true}>
                    {/* <Label value="Unit" position="insideLeft" angle={-90} /> */}
                    </YAxis>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    {metrics}
            </AreaChart>;
        }
        return (
            <div style={{paddingTop: "20px"}}>
                <h3 style={{ paddingLeft: "20px", display: "inline" }}>{this.props.data.displayName}</h3>
                <a role="button" href={downloadLink} className="btn btn-primary"
                    style={{ marginBottom: "10px", marginLeft: "10px" }} download={downloadFileName}>
                    <i className="fa fa-download" aria-hidden="true"></i> Download
                </a>
                {chart}
            </div>
        );
    }
}
