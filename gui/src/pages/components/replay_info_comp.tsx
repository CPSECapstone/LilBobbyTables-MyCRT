import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

import { DeleteModal } from './delete_modal_comp';

export class ReplayInfo extends React.Component<any, any>  {
   public constructor(props: any) {
        super(props);
        this.compareReplay = this.compareReplay.bind(this);
        this.deleteReplay = this.deleteReplay.bind(this);
        this.formatTimeStamp = this.formatTimeStamp.bind(this);
   }

   public formatTimeStamp(date: string) {
      const time = new Date(date);
      return time.toLocaleString();
   }

   public deleteReplay(id: number, deleteLogs: boolean) {
      this.props.delete(id, deleteLogs);
   }

   public compareReplay() {
      window.location.assign(`/capture?id=${this.props.captureId}&`
         + `replayId=${this.props.replay.id}envId=${this.props.envId}&view=metrics`);
   }

   public render() {
      let canDelete = false;
      if (this.props.me) {
         if (this.props.me.isAdmin || this.props.me.email === this.props.replay.username) {
            canDelete = true;
         }
      }
      return (
         <div><br/>
            <div className="page-header">
               <h2 style={{display: "inline"}}>{this.props.replay.name}</h2>
               <label className={this.props.replay.status}>{this.props.replay.status}</label>
               <button type="button" className="btn btn-outline-success"
                  style={{marginLeft: "20px", marginBottom: "15px"}} onClick={this.compareReplay}>
                  <i className="fa fa-line-chart"></i>
               </button>
               {canDelete ? <a role="button" className="btn btn-outline-danger deleteBtn"
                  style={{marginBottom: "15px"}}
                  data-backdrop="static" data-keyboard={false}
                  data-target="#deleteReplayModal" data-toggle="modal" href="#">
                  <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
               </a> : null}
            </div>
            <DeleteModal id="deleteReplayModal" deleteId={this.props.replay.id}
                               name={this.props.replay.name} delete={this.deleteReplay} type="Replay"/>
            <div className="myCRT-overflow-col"
               style={{padding: 0, paddingTop: "10px", paddingLeft: "20px", width: "1070px"}}>
               <br></br>
               <h5 style={{padding: "0px 5px", margin: "0px", display: "inline"}}>Creator:</h5>
               <label>{this.props.replay.username}</label>
               <div className="row">
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>General:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Start Time: </b>
                        {this.formatTimeStamp(this.props.replay.start)}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;End Time: </b>
                        {this.formatTimeStamp(this.props.replay.end)}
                     </label><br/><br/>
                  </div>
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>Target Database:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Name: </b>{this.props.replay.db.name}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;Host: </b>{this.props.replay.db.host}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;User: </b>{this.props.replay.db.user}</label><br/><br/>
                  </div>
                  <div className="col-xs-6" style={{padding: "10px 20px 0px"}}>
                     <h5>S3 File Storage:</h5>
                     <label><b>&nbsp;&nbsp;&nbsp;Bucket: </b>{this.props.bucket}</label><br/>
                     <label><b>&nbsp;&nbsp;&nbsp;Prefix: </b>{this.props.prefix + "/environment" +
                        this.props.envId + "/replay" + this.props.replay.id}</label><br/><br/>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
