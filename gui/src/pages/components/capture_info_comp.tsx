import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class CaptureInfo extends React.Component<any, any>  {
   public constructor(props: any) {
        super(props);
        this.formatTimeStamp = this.formatTimeStamp.bind(this);
   }

   public formatTimeStamp(date: string) {
      const time = new Date(date);
      return time.toLocaleString();
   }

   public render() {
      return (
         <div><br/>
            <div className="page-header">
               <h2>Capture Details</h2><br/>
            </div>
            <div className="myCRT-overflow-col"style={{padding: 0, paddingTop: "10px",
               paddingLeft: "20px", width: "1070px"}}>
               <br></br>
               <h5 style={{padding: "0px 5px", margin: "0px", display: "inline"}}>Creator:</h5>
               <label>{this.props.capture.username}</label>
               <div className="row">
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>General:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Start Time: </b>
                        {this.formatTimeStamp(this.props.capture.start)}
                     </label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;End Time: </b>
                        {this.formatTimeStamp(this.props.capture.end)}
                     </label><br/><br/>
                  </div>
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>Source Database:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Name: </b>{this.props.env.dbName}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;Host: </b>{this.props.env.host}</label><br/><br/>
                  </div>
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>S3 File Storage:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Bucket: </b>{this.props.env.bucket}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;Prefix: </b>{this.props.env.prefix + "/environment" +
                        this.props.env.id + "/capture" + this.props.capture.id}</label><br/><br/>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
