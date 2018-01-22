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
            <div onClick={ (e) => this.handleClick(e)} className="myCRT-panel">
                <div className="card">
                    <div className="card-header">
                        <h5>{this.props.title}</h5>
                    </div>
                    <div className="card-body">
                        <p>
                           Information about environment
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
