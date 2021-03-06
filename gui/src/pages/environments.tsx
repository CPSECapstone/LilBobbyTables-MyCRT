import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { EnvironmentPanel } from './components/env_panel_comp';
import { EnvModal } from './components/environment_modal_comp';
import { Pagination } from './components/pagination_comp';
import { Search } from './components/search_comp';
import { mycrt } from './utils/mycrt-client';

class EnvironmentsApp extends React.Component<any, any> {

  public constructor(props: any) {
    super(props);
    this.componentWillMount = this.componentWillMount.bind(this);
    this.updateSearch = this.updateSearch.bind(this);
    this.state = {envs: [], envSearch: ""};
  }

  public async componentWillMount() {
    const envResponse = await mycrt.getEnvironments();
    if (envResponse !== null) {
        this.setState({
            envs: envResponse,
        });
    }
  }

  public updateSearch(searchText: string, type: string) {
      this.setState({[type]: searchText});
   }

  public render() {
    const environments: JSX.Element[] = [];
    if (this.state.envs) {
      for (let id = this.state.envs.length - 1; id >= 0; id--) {
         const env = this.state.envs[id];
         let name = `${env.name}`;
         if (!name) {
           name = `Environment ${env.id}`;
         }
         environments.push((<EnvironmentPanel title={name} env={env} username={env.username} key={name} />));
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
                <a role="button" className="btn btn-outline-primary" data-toggle="modal" href="#" id="newEnv"
                  data-backdrop="static" data-keyboard={false}
                  data-target="#envModal" style={{ marginBottom: "20px", marginLeft: "15px" }}>
                  <i className="fa fa-plus" aria-hidden="true"></i>
                </a>
                <Search length={environments.length} type="envSearch" update={this.updateSearch}
                  style={{float: "right", display: "inline-block", margin: "10px", paddingTop: "10px", width: "50%"}}/>
              </div>
            </div>
          </div>
          <br></br>
          <div className="row">
            <div className="col-sm-12 mb-r">
              <EnvModal id="envModal" update={this.componentWillMount}/>
              <div className="myCRT-overflow-col">
                {environments.length ?
                  <Pagination list={environments.filter((val) =>
                     val.props.title.toLowerCase().search(this.state.envSearch.toLowerCase()) >= 0)}
                  limit={4}/> :
                  <p className="myCRT-empty-col">No environments currently exist.</p>}
              </div>
              <br/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDom.render(<BasePage page={<EnvironmentsApp />}/>, document.getElementById('environments-app'));
