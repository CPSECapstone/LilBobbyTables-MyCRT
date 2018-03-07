import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from './../logging';

import { EnvironmentPanel } from './components/env_panel_comp';
import { EnvModal } from './components/environment_modal_comp';
import { mycrt } from './utils/mycrt-client';

class EnvironmentsApp extends React.Component<any, any> {

  public constructor(props: any) {
    super(props);
    this.componentWillMount = this.componentWillMount.bind(this);
    this.state = {envs: []};
  }

  public async componentWillMount() {
    const envResponse = await mycrt.getEnvironments();
    logger.info(JSON.stringify(envResponse));
    if (envResponse !== null) {
        this.setState({
            envs: envResponse,
        });
    }
  }

  public render() {
    const environments: JSX.Element[] = [];
    if (this.state.envs) {
      logger.info("hi");
      logger.info(JSON.stringify(this.state.envs));
      for (const env of this.state.envs) {
        logger.info("WHAT?");
        let name = `${env.name}`;
        if (!name) {
          name = `Environment ${env.id}`;
        }
        environments.push((<EnvironmentPanel title={name} env={env} />));
      }
    }
    return (
      <div>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item active"><a>Environments</a></li>
          </ol>
        </nav>
        <div className="container">
          <div className="row">
            <div className="col-sm-12 mb-r">
              <div className="page-header">
                <h1 style={{ display: "inline"}}>Environments</h1>
                <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                    data-target="#envModal" style={{ marginBottom: "20px", marginLeft: "15px" }}>
                    <i className="fa fa-plus" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </div>
          <br></br>
          <div className="row">
            <div className="col-sm-12 mb-r">
              <EnvModal id="envModal" update={this.componentWillMount}/>
              <div className="myCRT-overflow-col">
                {environments.length ? environments : <p className="myCRT-empty-col">
                            No environments currently exist.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDom.render(<EnvironmentsApp />, document.getElementById('environments-app'));
