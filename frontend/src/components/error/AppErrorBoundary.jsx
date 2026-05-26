import { Component } from "react";
import { ErrorPage } from "../../pages/error/ErrorPage";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled app error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage status={500} showBack={false} />;
    }

    return this.props.children;
  }
}
