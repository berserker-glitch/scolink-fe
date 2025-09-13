import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ModernButton } from "@/components/ui";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <AlertCircle className="w-24 h-24 text-text-muted mx-auto mb-6" />
          <h1 className="text-hero font-bold text-text-primary mb-4">404</h1>
          <h2 className="text-heading text-text-primary mb-4">Page Not Found</h2>
          <p className="text-body text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Link to="/">
          <ModernButton variant="solid" size="lg" icon={Home} iconPosition="left">
            Return to Dashboard
          </ModernButton>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
