import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class ReplayInfo extends React.Component<any, any>  {
   public constructor(props: any) {
        super(props);
        this.compareReplay = this.compareReplay.bind(this);
        this.formatTimeStamp = this.formatTimeStamp.bind(this);
   }

   public formatTimeStamp(date: string) {
      const time = new Date(date);
      return time.toLocaleString();
   }

   public compareReplay() {
      window.location.assign(`/capture?id=${this.props.replay.captureId}&`
         + `replayId=${this.props.replay.id}envId=${this.props.envId}&view=metrics`);
   }

   public render() {
      return (
         <div><br/>
            <div className="page-header">
               <h2 style={{display: "inline"}}>{this.props.replay.name}</h2>
               <button type="button" className="btn btn-success"
                  style={{marginLeft: "20px", marginBottom: "15px"}} onClick={this.compareReplay}>
                  <i className="fa fa-line-chart"></i>  Compare
               </button>
            </div>
            <div className="myCRT-overflow-col"
               style={{padding: 0, paddingTop: "10px", paddingLeft: "20px", width: "1050px"}}>
               <div className="row">
                  <div className="col-xs-6" style={{padding: "20px 20px 0px"}}>
                     <h5>General:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Start Time: </b>
                        {this.formatTimeStamp(this.props.replay.start)}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;End Time: </b>
                        {this.formatTimeStamp(this.props.replay.end)}
                     </label><br/><br/>
                  </div>
                  <div className="col-xs-6" style={{padding: "20px 60px 0px"}}>
                     <h5>Target Database:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Name: </b>{this.props.replay.db.name}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;Host: </b>{this.props.replay.db.host}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;User: </b>{this.props.replay.db.user}</label><br/><br/>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
