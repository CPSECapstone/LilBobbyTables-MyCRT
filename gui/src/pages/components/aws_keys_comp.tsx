import React = require('react');
import { FormEvent } from 'react';
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from "moment";

import { BrowserLogger as logger } from '../../logging';

export class AWSKeys extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.state = {newKeys: false};
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.accessKeyChange = this.accessKeyChange.bind(this);
        this.awsKeyNameChange = this.awsKeyNameChange.bind(this);
        this.secretKeyChange = this.secretKeyChange.bind(this);
        this.awsKeyChange = this.awsKeyChange.bind(this);
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

    public render() {
      const awsKeys: JSX.Element[] = [];
      for (const key of this.props.awsKeys) {
         awsKeys.push((<option value={JSON.stringify(key)}>{key.name}</option>));
      }
        return (
            <div>
               <div className="form-check">
                  <label className="form-check-label" style={{padding: "5px"}}>
                  <input type="radio" className="form-check-input" name="aws keys"
                     onChange={this.handleOptionChange}
                     defaultValue="existingKeys" defaultChecked/>
                     Existing AWS Key
                  </label>
               </div>
               <div className="form-check">
                  <label className="form-check-label" style={{padding: "5px"}}>
                  <input type="radio" className="form-check-input" name="aws keys"
                     onChange={this.handleOptionChange}
                     defaultValue="newKeys"/>
                     New AWS Key
                  </label>
                  <br></br><br></br>
                  {this.state.newKeys ?
                     <div>
                        <input className="form-control input-lg" placeholder="Enter Name (Optional)"
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
                           <option value='default'>Enter Region...</option>
                           {this.props.regions}
                        </select>}
                     </div> :
                     <div>{this.props.awsKeys.length === 0 ?
                        <label>No previous AWS Keys</label> :
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
