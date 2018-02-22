// import { Action } from 'redux';
// import { AddCaptureAction, AddCaptureIdAction, AddGraphAction, ToggleGraphAction } from '../actions/capture_actions';

// import { BrowserLogger as logger } from '../../logging';

// export const toggleGraphReducer = (state: any, action: ToggleGraphAction) => {
//     return {
//         ...state,
//         show: action.value,
//     };
// };

// let nextId = 0;

// export const addGraphReducer = (state: any, action: AddGraphAction) => {
//     const id = nextId;
//     nextId += 1;
//     const result = {
//         ...state,
//         graphs: [...state.graphs, id],
//     };
//     result.graphsById[id] = {
//         show: action.show,
//         displayName: action.displayName,
//         data: action.data,
//     };
//     return result;
// };

// export const addCaptureIdReducer = (state: any, action: AddCaptureIdAction) => {
//     return {
//         ...state,
//         captureId: action.id,
//     };
// };

// export const addCaptureReducer = (state: any, action: AddCaptureAction) => {
//     return {
//         ...state,
//         capture: action.capture,
//     };
// };
