import './common';

import '../../static/css/index.css';

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

const data = [
      {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
      {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
      {name: 'Page C', uv: 2000, pv: 9800, amt: 2291},
      {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
      {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
      {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
      {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
];

// const data2 = [
//       {name: 'Page A', uv: 4000, pv: 1000, amt: 2400},
//       {name: 'Page B', uv: 3000, pv: 1333, amt: 2210},
//       {name: 'Page C', uv: 2000, pv: 2222, amt: 2291},
//       {name: 'Page D', uv: 2780, pv: 3333, amt: 2000},
//       {name: 'Page E', uv: 1890, pv: 2222, amt: 2181},
//       {name: 'Page F', uv: 2390, pv: 4444, amt: 2500},
//       {name: 'Page G', uv: 3490, pv: 3332, amt: 2100},
// ];

const IndexApp = () => {
    return (
        <LineChart width={800} height={500} data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="uv" stroke="#82ca9d" strokeDasharray="3 3" />
        </LineChart>
    );
 };

ReactDom.render(<IndexApp />, document.getElementById('index-app'));
