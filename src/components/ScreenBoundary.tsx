import { Component, type ErrorInfo, type ReactNode } from "react";

export class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unable to render the character builder screen.", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" className="panel status-message">
          <h2>This screen could not be loaded.</h2>
          <p>Your current character is still available through Save and Export above. Save your work before reloading the application.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload application</button>
        </section>
      );
    }
    return this.props.children;
  }
}
