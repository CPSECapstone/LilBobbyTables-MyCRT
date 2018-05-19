import React = require('react');
import { FormEvent } from 'react';
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from "moment";

import { BrowserLogger as logger } from '../../logging';

export class AWSKeys extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.state = {newKeys: true};
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.accessKeyChange = this.accessKeyChange.bind(this);
        this.awsKeyNameChange = this.awsKeyNameChange.bind(this);
        this.secretKeyChange = this.secretKeyChange.bind(this);
        this.awsKeyChange = this.awsKeyChange.bind(this);
        this.reset = this.reset.bind(this);
        this.regionChange = this.regionChange.bind(this);
    }

    public awsKeyNameChange(event: any) {
      this.props.keyNameChange(event.currentTarget.value);
    }

    public accessKeyChange(event: any) {
      this.props.accessKeyChange(event.currentTarget.value);
    }

    public secretKeyChange(event: any) {
      this.props.secretKeyChange(event.currentTarget.value);
    }

    public regionChange(event: any) {
       this.props.regionChange(event.currentTarget.value);
    }

    public awsKeyChange(event: any) {
       this.props.keyChange(JSON.parse(event.currentTarget.value));
    }

    public handleOptionChange(event: FormEvent<HTMLInputElement>): void {
       const isNewKey = event.currentTarget.value === "newKeys";
        this.setState({
            newKeys: isNewKey,
        });
        this.props.updateType(isNewKey);
    }

    public reset() {
      $('#newKeys').click();
      $('#awsKeyName').val("");
      $('#accessKey').val("");
      $('#secretKey').val("");
      $("select#regionDrop").val('default');
    }

    public render() {
      const awsKeys: JSX.Element[] = [];
      const keys = this.props.awsKeys.sort((a: any, b: any) => a.name.localeCompare(b.name));
      for (const key of keys) {
         awsKeys.push((<option value={JSON.stringify(key)}>{key.name}</option>));
      }
        return (
            <div>
               <div className="form-check"
                  style={this.props.awsKeys.length > 0 ? {display: "block"} : {display: "none"}}>
                  <label className="form-check-label" style={{padding: "5px"}}>
                  <input type="radio" className="form-check-input" name="aws keys"
                     onChange={this.handleOptionChange}
                     defaultValue="existingKeys"/>
                     Existing AWS Key
                  </label>
               </div>
               <div className="form-check">
                  <label className="form-check-label" style={{padding: "5px"}}>
                  <input type="radio" className="form-check-input" name="aws keys"
                     onChange={this.handleOptionChange} id="newKeys"
                     defaultValue="newKeys" defaultChecked/>
                     New AWS Key
                  </label>
                  <br></br><br></br>
                  {this.state.newKeys ?
                     <div>
                        <input className="form-control input-lg" placeholder="Enter Name"
                           id="awsKeyName"
                           onInput={this.awsKeyNameChange}/> <br/>
                        <input className="form-control input-lg" placeholder="Enter Access Key"
                           id="accessKey"
                           onInput={this.accessKeyChange}/> <br/>
                        <input className="form-control input-lg" placeholder="Enter Secret Key"
                           id="secretKey" type="password"
                           onInput={this.secretKeyChange}/> <br/>
                        {<select className="form-control" id="regionDrop"
                           onChange={this.regionChange.bind(this)}>
                           <option value='default'>Select Region...</option>
                           {this.props.regions}
                        </select>}
                     </div> :
                     <div>{this.props.awsKeys.length === 0 ? null :
                        <select className="form-control" id="keyDrop"
                           onChange={this.awsKeyChange.bind(this)}>
                           <option value='default'>Select Previous Key...</option>
                           {awsKeys}
                        </select>}
                     </div>}
               </div>
               <br></br>
            </div>
        );
    }
}
