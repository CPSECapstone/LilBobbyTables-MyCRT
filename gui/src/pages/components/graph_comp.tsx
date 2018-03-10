import React = require('react');
import ReactDom = require('react-dom');

import { colors } from '../utils/color-picker';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Legend, Line, LineChart,
   Tooltip, XAxis, YAxis } from 'recharts';
import { BrowserLogger as logger } from '../../logging';

export class Graph extends React.Component<any, any>  {

   public render() {
      if (!this.props.data) { return (<div></div>); }
      const downloadLink = `/api/captures/${this.props.id}/metrics?type=${this.props.type}`;
      const downloadFileName = `${this.props.type}metrics.json`;
      const lineNum = Object.keys(this.props.data).length;

      const metrics: JSX.Element[] = [];
      if (this.props.data.dataPoints.length > 0) {
         const unit = `  ${this.props.data.dataPoints[0].Unit}`;
         let index = 0;
         for (const key in this.props.data.dataPoints[0]) {
            if (key !== "Timestamp" && key !== "Unit" && key !== "Maximum") {
               const LineType = this.props.filled ? Area : Line;
               metrics.push(<LineType name={key} type="monotone" dataKey={key} stroke={colors[index]}
                  fillOpacity={0.5} fill={colors[index]} isAnimationActive={true}
                  activeDot={{ r: 8 }} unit={unit} strokeWidth={1.5}/>);
               index++;
            }
         }
      }
      const ChartType = this.props.filled ? AreaChart : LineChart;
      return (
         <div className="graph">
            <h3 className="graphName">{this.props.data.displayName}</h3>
            <a role="button" href={downloadLink} className="btn btn-primary downloadBtn"
               download={downloadFileName}>
               <i className="fa fa-download" aria-hidden="true"></i> Download
            </a>
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
