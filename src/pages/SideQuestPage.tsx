import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SideQuestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 text-lg font-semibold text-foreground">SideQuest</h1>
      </header>
      <div className="flex-1 w-full">
        <iframe
          title="Google Maps - Singapore"
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d63824.37592486186!2d103.8198!3d1.3521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg"
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default SideQuestPage;
