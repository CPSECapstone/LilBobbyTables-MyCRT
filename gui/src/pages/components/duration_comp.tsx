import React = require('react');
import ReactDom = require('react-dom');

export class Duration extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div className="col-10">
                <input className="form-control myCRT-duration-unit" type="number" value="1"
                       id="example-number-input"/>
                <div>
                    <label>{this.props.type}</label>
                </div>
            </div>
        );
    }
}
