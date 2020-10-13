import React from 'react';
import { AppContainer } from './AppContainer';
import { WorkspaceContextProvider } from './store/WorkspaceContext';

export default class App extends React.PureComponent {
  render() {
    return (
      <WorkspaceContextProvider>
        <AppContainer />
      </WorkspaceContextProvider>
    );
  }
}
