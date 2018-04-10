import React = require('react');
import { FormEvent } from 'react';
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from "moment";

import { BrowserLogger as logger } from '../../logging';

export class StartDateTime extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.state = {showDateTime: false};
        this.resetChecks = this.resetChecks.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.handleTimeSelection = this.handleTimeSelection.bind(this);
    }

    public handleOptionChange(event: FormEvent<HTMLInputElement>): void {
        this.setState({
            showDateTime: event.currentTarget.value === "specific",
        });
        this.props.updateType(event.currentTarget.value);
    }

    public handleTimeSelection(event: any) {
      this.props.updateTime(event.currentTarget.value);
    }

    public resetChecks(date: string) {
      $("#now").click();
      $("#start_date").val(this.props.default);
    }

    public render() {
        return (
            <div>
                <label><b>Start Options</b></label>
                <div className="form-check">
                    <label className="form-check-label" style={{padding: "5px"}}>
                        <input type="radio" className="form-check-input" name="start options" id="now"
                               onChange={this.handleOptionChange} defaultValue="immediate" defaultChecked/>
                        Immediate
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label" style={{padding: "5px"}}>
                        <input type="radio" className="form-check-input" name="start options" id="scheduled"
                               onChange={this.handleOptionChange} defaultValue="specific"/>
                        Scheduled
                    </label>
                    <input className={this.state.showDateTime ? 'form-control' : 'form-control hidden'}
                           style={{width: "70%", marginLeft: "10px"}}
                           type="datetime-local" defaultValue={this.props.default} id="start_date"
                           onChange={this.handleTimeSelection}/>
                </div>
            </div>
        );
    }
}
