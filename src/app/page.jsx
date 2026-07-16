import App from "@/components/App.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";

export default function Page() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
