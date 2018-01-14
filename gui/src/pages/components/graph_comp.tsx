import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import React = require('react');
import ReactDom = require('react-dom');

export class Graph extends React.Component<any, any>  {

    public render() {
        return (
            <div>
                <h3 style={{"padding-left": "20px"}}>{this.props.title}</h3>
                <LineChart width={800} height={500} data={this.props.data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pv" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="uv" stroke="#8884d8" strokeDasharray="3 3" />
                </LineChart>
            </div>
        );
    }
}
