import React = require('react');
import ReactDom = require('react-dom');

import { colors } from '../utils/color-picker';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Legend, Line, LineChart,
   Tooltip, XAxis, YAxis } from 'recharts';
import { BrowserLogger as logger } from '../../logging';

export class Graph extends React.Component<any, any>  {

   public render() {
      if (!this.props.data) { return (<div></div>); }
      const encodedStrData = encodeURIComponent(JSON.stringify(this.props.data.dataPoints));
      const downloadStr = "data:text/json;charset=utf-8," + encodedStrData;
      const downloadName = `capture${this.props.id}${this.props.data.displayName}.json`;

      const metrics: JSX.Element[] = [];
      if (this.props.data.dataPoints.length > 0) {
         const unit = `  ${this.props.data.dataPoints[0].Unit}`;
         let index = 0;
         for (const key in this.props.data.dataPoints[0]) {
            if (key !== "Timestamp" && key !== "Unit" && key !== "Maximum") {
               const LineType = this.props.filled ? Area : Line;
               metrics.push(<LineType name={key} type="monotone" dataKey={key} stroke={colors[index]}
                  fillOpacity={0.5} fill={colors[index]} isAnimationActive={true}
                  dot={ false } unit={unit} strokeWidth={1.5}/>);
               index++;
            }
         }
      }
      const ChartType = this.props.filled ? AreaChart : LineChart;
      return (
         <div className="graph">
            <h3 className="graphName" id={this.props.data.displayName}>{this.props.data.displayName}</h3>
            <span data-toggle="tooltip" data-placement="top" title="Download Metrics">
               <a role="button" href={downloadStr} className="btn btn-outline-primary downloadBtn"
                  download={downloadName}>
                  <i className="fa fa-download" aria-hidden="true"></i>
               </a>
            </span>
            <ChartType width={1000} height={400} data={this.props.data.dataPoints}
               margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
               <XAxis dataKey="Timestamp" />
               <YAxis allowDecimals={true}></YAxis>
               <CartesianGrid strokeDasharray="3 3" />
               <Tooltip />
               <Legend verticalAlign="bottom" height={36} />
               {metrics}
            </ChartType>
         </div>
      );
   }
}
