import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import React = require('react');
import ReactDom = require('react-dom');

export class Graph extends React.Component<any, any>  {

    public render() {
        return (
            <div>
                <h3 style={{paddingLeft: "20px", display: "inline"}}>{this.props.title}</h3>
                <a role="button" href="/api/captures/123/metrics" className="btn btn-primary"
                style={{marginBottom: "10px", marginLeft: "10px"}} download="metrics.json">
                    <i className="fa fa-download" aria-hidden="true"></i> Download
                </a>
                <LineChart width={1000} height={400} data={this.props.data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="Timestamp"/>
                    <YAxis allowDecimals={true}/>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                    <Line name="replay 1" type="monotone" dataKey="Maximum" stroke="#18BC9C"
                          activeDot={{ r: 8 }} isAnimationActive={false}/>
                    {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" strokeDasharray="3 3" /> */}
                </LineChart>
            </div>
        );
    }
}
