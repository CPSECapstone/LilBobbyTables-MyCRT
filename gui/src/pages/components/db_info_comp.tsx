import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';
import { ErrorModal } from './error_modal_comp';

export class DBInfo extends React.Component<any, any> {

   private baseState = {} as any;

   public constructor(props: any) {
     super(props);
     this.state = {dbName: "", host: "", parameterGroup: "", user: "", pass: "", instance: ""};
     this.handlePasswordChange = this.handlePasswordChange.bind(this);
     this.handleDBName = this.handleDBName.bind(this);
     this.baseState = this.state;
   }

   public handleDBName(event: any) {
      const target = event.currentTarget;
      if (target.value === "default") {
         this.setState({dbName: ''});
         this.props.handleDBName(target.value);
         return;
      }
      const dbRef = JSON.parse(target.value);
      dbRef.dbName = dbRef.name;
      delete dbRef.name;
      this.props.handleDBName(dbRef);
      this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
         host: dbRef.host, user: dbRef.user, pass: ""});
   }

   public handlePasswordChange(event: any) {
      this.setState({pass: event.target.value});
      this.props.handlePasswordChange(event.target.value);
   }

   public reset() {
      $("select#concurrentDrop").val('default');
      this.setState(this.baseState);
   }

   public render() {
      const databases: JSX.Element[] = [];
      if (this.props.dbRefs) {
         for (const db of this.props.dbRefs) {
            databases.push((<option value={JSON.stringify(db)}>{db.name}</option>));
         }
      }
      return (
         <div>
            <label><b>DB Reference</b></label>
            {<select className="form-control input-lg"
               onChange={this.handleDBName} id="concurrentDrop">
               <option value="default">Select Database...</option>
               {databases}
            </select>} <br/>
            <div style={this.state.dbName !== "" ? {display: "block"} : {display: "none"}}>
               <dl>
                  <dt><b>Instance:</b></dt>
                  <dd>&nbsp;&nbsp;&nbsp;{this.state.instance}</dd>
               </dl>
               <dl>
                  <dt><b>Host:</b></dt>
                  <dd>&nbsp;&nbsp;&nbsp;{this.state.host}</dd>
               </dl>
               <dl>
                  <dt><b>Parameter Group:</b></dt>
                  <dd>&nbsp;&nbsp;&nbsp;{this.state.parameterGroup}</dd>
               </dl>
               <dl>
                  <dt><b>Username:</b></dt>
                  <dd>&nbsp;&nbsp;&nbsp;{this.state.user}</dd>
               </dl>
               <br/>
               <label><b>Password</b></label>
               <input className="form-control" id="dbPass" value={this.state.pass}
                  placeholder="Enter Password" type="password"
                  onInput={this.handlePasswordChange}/>
            </div>
            <br></br>
         </div>
      );
   }
}
