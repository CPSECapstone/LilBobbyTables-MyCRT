import React = require('react');
import ReactDom = require('react-dom');

export class Duration extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div className="col-3">
                <input className="form-control" type="number" defaultValue="1"/>
                <label style={{paddingLeft: "25px"}}>{this.props.type}</label>
            </div>
        );
    }
}
