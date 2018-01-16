import React = require('react');
import ReactDom = require('react-dom');

export class ReplayPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    public handleClick(event: any): void {
        window.location.assign('./replay');
    }

    public render() {
        return (
            <div className="panel panel-info myCRT-panel" onClick={ (e) => this.handleClick(e)}>
                <div className="panel-heading">
                    <h3 className="panel-title">{this.props.title}</h3>
                </div>
                <div className="panel-body">
                    <p> Information about this replay </p>
                </div>
            </div>
        );
    }
}
