import React = require('react');
import ReactDom = require('react-dom');

export class EnvironmentPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    public handleClick(event: any): void {
        window.location.assign('./dashboard');
    }

    public render() {
        return (
            <div onClick={ (e) => this.handleClick(e)} className="col-md-4 myCRT-panel">
                <div className="panel panel-info">
                    <div className="panel-heading">
                        <h3 className="panel-title">{this.props.title}</h3>
                    </div>
                    <div className="panel-body">
                        <p> Information about environment </p>
                    </div>
                </div>
            </div>
        );
    }
}
