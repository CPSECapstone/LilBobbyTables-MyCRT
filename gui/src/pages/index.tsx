import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

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
            this.state = { name: "Start", active: false, id: null, result: null };
        }
        public async handleChange(event: any) {
            this.setState({ active: !this.state.active });
            if (!this.state.active) {
                const captureId = await mycrt.postCapture({ name: 'lbt-capture' });
                logger.info(`Got capture id: ${captureId}`);
                if (captureId) {
                    this.setState({ id: captureId });
                }
            } else {
                let result = await mycrt.stopCapture(this.state.id);
                logger.info(`${result}`);
                if (!result) {
                    result = `Capture ${this.state.id}: Failed to get capture result.`;
                }
                this.setState({ result });
            }
        }
        public render() {
            return (
                <div>
                    <p className="capture-name">Lil-Bobby-Tables-Capture</p>
                    <button className={this.state.active ? 'stop-capture' : 'start-capture'}
                            onClick = { (e) => this.handleChange(e) }
                    >{ this.state.active ? 'Stop' : 'Start'}</button>
                    <br/>
                    <textarea className="result-textfield" value={this.state.result || ''}></textarea>
                </div>
            );
        }
}

ReactDom.render(<Title />, document.getElementById('title-block'));
ReactDom.render(<ButtonComponent />, document.getElementById('capture-button'));
