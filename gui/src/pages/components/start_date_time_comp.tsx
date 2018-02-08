import React = require('react');
import { FormEvent } from 'react';
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

export class StartDateTime extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.state = {showDateTime: false};
        this.handleOptionChange = this.handleOptionChange.bind(this);
    }

    public handleOptionChange(event: FormEvent<HTMLInputElement>): void {
        this.setState({
            showDateTime: event.currentTarget.value === "specific",
        });
    }

    public render() {
        return (
            <div>
                <label><b>Start Options</b></label>
                <div className="form-check">
                    <label className="form-check-label" style={{padding: "5px"}}>
                        <input type="radio" className="form-check-input" name="start options"
                               onChange={this.handleOptionChange} defaultValue="immediate" defaultChecked/>
                        Immediately
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label" style={{padding: "5px"}}>
                        <input type="radio" className="form-check-input" name="start options"
                               onChange={this.handleOptionChange} defaultValue="specific"/>
                        Specific Date/Time
                    </label>
                    <input className={this.state.showDateTime ? 'form-control' : 'form-control hidden'}
                           style={{width: "70%", marginLeft: "10px"}}
                           type="datetime-local" defaultValue="2011-08-19T13:45:00" id="start_date" />
                </div>
            </div>
        );
    }
}
