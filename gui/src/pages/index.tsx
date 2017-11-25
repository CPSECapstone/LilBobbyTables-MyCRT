import '../../static/css/index.css';

import React = require('react');
import ReactDom = require('react-dom');

const Title = () => {
   return (
      <div className="title-block">
          <h1 className="my-crt-title">Capture a Workload</h1>
          <h2 className="amazon-subtitle">Amazon Web Services</h2>
      </div>
   );
};

class ButtonComponent extends React.Component<any, any> {
        constructor(props: any) {
            super(props);
            this.state = { name: "Start", active: false };
        }
        public handleChange(event: any): void {
            this.setState({ active: !this.state.active });
        }
        public render() {
            return (
                <div>
                    <p className="capture-name">Lil-Bobby-Tables-Capture</p>
                    <button className={this.state.active ? 'stop-capture' : 'start-capture'}
                            onClick = { (e) => this.handleChange(e) }
                    >{ this.state.active ? 'Stop' : 'Start'}</button>
                </div>
            );
        }
}

const TextField = () => {
    return (
        <textarea className="result-textfield"></textarea>
    );
};

ReactDom.render(<Title />, document.getElementById('title-block'));
ReactDom.render(<ButtonComponent />, document.getElementById('capture-button'));
ReactDom.render(<TextField />, document.getElementById('capture-results'));
