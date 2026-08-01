import DepartmentHome from "@/components/DepartmentHome.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";

export default function Page() {
  return (
    <ErrorBoundary>
      <DepartmentHome />
    </ErrorBoundary>
  );
}
