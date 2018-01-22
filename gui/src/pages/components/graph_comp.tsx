import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import React = require('react');
import ReactDom = require('react-dom');

export class Graph extends React.Component<any, any>  {

    public render() {
        return (
            <div>
                <h3 style={{paddingLeft: "20px", display: "inline"}}>{this.props.title}</h3>
                <button type="button" className="btn btn-primary" style={{margin: "10px 10px 20px", display: "inline"}}>
                    <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span> Download
                </button>
                <LineChart width={1000} height={400} data={this.props.data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="Timestamp"/>
                    <YAxis allowDecimals={true}/>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                    <Line name="replay 1" type="monotone" dataKey="Maximum" stroke="#8884d8" activeDot={{ r: 8 }} />
                    {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" strokeDasharray="3 3" /> */}
                </LineChart>
            </div>
        );
    }
}
