import './common';

import '../../static/css/metrics.css';

import React = require('react');
import ReactDom = require('react-dom');

import { Graph } from './components/graph_comp';

const data = [
    {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
    {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
    {name: 'Page C', uv: 2000, pv: 9800, amt: 2291},
    {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
    {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
    {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
    {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
];

const data2 = [
    {Timestamp: 'Page A', Maximum: 4000, pv: 1000, amt: 2400},
    {Timestamp: 'Page B', Maximum: 3000, pv: 1333, amt: 2210},
    {Timestamp: 'Page C', Maximum: 2000, pv: 2222, amt: 2291},
    {Timestamp: 'Page D', Maximum: 2780, pv: 3333, amt: 2000},
    {Timestamp: 'Page E', Maximum: 1890, pv: 2222, amt: 2181},
    {Timestamp: 'Page F', Maximum: 2390, pv: 4444, amt: 2500},
    {Timestamp: 'Page G', Maximum: 3490, pv: 3332, amt: 2100},
];

// tslint:disable-next-line:no-var-requires
const data4: any = require('../../dummydata.json').Datapoints;

const data3 = [
  {Timestamp: 'Page A', Maximum: 4000, pv: 1333, amt: 2400},
  {Timestamp: 'Page B', Maximum: 3000, pv: 2400, amt: 2210},
  {Timestamp: 'Page C', Maximum: 2000, pv: 2222, amt: 2291},
  {Timestamp: 'Page D', Maximum: 2780, pv: 4444, amt: 2000},
  {Timestamp: 'Page E', Maximum: 1890, pv: 3800, amt: 2181},
  {Timestamp: 'Page F', Maximum: 2390, pv: 4444, amt: 2500},
  {Timestamp: 'Page G', Maximum: 3490, pv: 1000, amt: 2100},
];

const MetricsApp = () => {
   return (
      <div>
         <nav>
            <ol className="breadcrumb">
               <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
               <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
               <li className="breadcrumb-item"><a href="./capture">Capture</a></li>
               <li className="breadcrumb-item active">Metrics</li>
            </ol>
         </nav>

         <div className="container">
            <div className="row">
               <div className="col-xs-12">

                  <div className="page-header">
                     <h1>Capture Metrics</h1>
                  </div>
                  <Graph title={"CPU Utilization Chart"} data={data4} />
                  <Graph title={"Memory Chart"} data={data2} />
                  <Graph title={"I/O Chart"} data={data3} />

               </div>
            </div>
         </div>
      </div>
   );
};

ReactDom.render(<MetricsApp />, document.getElementById('metrics-app'));
