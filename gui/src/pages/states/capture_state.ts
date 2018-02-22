// import './common';

// import '../../static/css/capture.css';

// import React = require('react');
// import ReactDom = require('react-dom');
// import { connect, Provider } from 'react-redux';
// import { Action, createStore, Store } from 'redux';

// import * as actions from '../actions/capture_actions';
// import * as reducers from '../reducers/capture_reducers';

// const initialState = {
//     captureId: null,
//     capture: null,
//     replays: [],
//     replaysById: {},
//     graphs: [],
//     graphsById: {},
// };

// const reducer = (state: any = initialState, action: Action) => {
//     switch (action.type) {
//         case actions.TOGGLE_GRAPH: {
//             const toggleAction = action as actions.ToggleGraphAction;
//             return reducers.toggleGraphReducer(state.graphsById[toggleAction.id], toggleAction);
//         }
//         case actions.ADD_GRAPH: {
//             const addAction = action as actions.AddGraphAction;
//             return reducers.addGraphReducer(state, addAction);
//         }
//         case actions.ADD_CAPTURE_ID: {
//             const addCaptureIdAction = action as actions.AddCaptureIdAction;
//             return reducers.addCaptureIdReducer(state, addCaptureIdAction);
//         }
//         case actions.ADD_CAPTURE: {
//             const addCaptureAction = action as actions.AddCaptureAction;
//             return reducers.addCaptureReducer(state, addCaptureAction);
//         }
//         default:
//           return state;
//       }
// };

// const captureStore = createStore(reducer, initialState);
