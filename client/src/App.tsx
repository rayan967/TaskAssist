import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/lib/pages/not-found";
import Dashboard from "@/lib/pages/Dashboard";
import Calendar from "@/lib/pages/Calendar";
import Team from "@/lib/pages/Team";
import Login from "@/lib/pages/Login";
import Register from "@/lib/pages/Register";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login');
    } else if (!isLoading && isAuthenticated) {
      console.log("User is authenticated, rendering component");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // If not loading and authenticated, render the component
  if (!isLoading && isAuthenticated) {
    return <Component {...rest} />;
  }
  
  // Otherwise return null (redirection will happen in the useEffect)
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/:projectId">
        {({projectId}) => <ProtectedRoute component={Dashboard} path={`/dashboard/${projectId}`} />}
      </Route>
      <Route path="/calendar">
        {() => <ProtectedRoute component={Calendar} />}
      </Route>
      <Route path="/team">
        {() => <ProtectedRoute component={Team} />}
      </Route>
      <Route>
        {() => <ProtectedRoute component={NotFound} />}
      </Route>
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated ? (
        <Layout>
          <Router />
        </Layout>
      ) : (
        <Router />
      )}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
