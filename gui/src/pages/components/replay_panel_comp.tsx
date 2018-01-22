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
            <div className="card myCRT-panel" onClick={ (e) => this.handleClick(e)}>
                <div className="card-header">
                    <h5>{this.props.title}</h5>
                </div>
                <div className="card-body">
                    <p> Information about this replay </p>
                </div>
            </div>
        );
    }
}
