import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { BrutalistButton } from "@/components/ui/BrutalistButton";
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
          <BrutalistButton variant="primary" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </BrutalistButton>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
