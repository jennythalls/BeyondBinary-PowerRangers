import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, List, Plus } from "lucide-react";

const SideQuestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold text-foreground">SideQuest</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <List className="h-4 w-4" />
          List View
        </Button>
      </header>
      <div className="relative flex-1 w-full overflow-hidden">
        <iframe
          title="Google Maps - Singapore"
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d63824.37592486186!2d103.8198!3d1.3521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg"
          className="absolute -top-[50px] -left-[200px] border-0"
          style={{ width: 'calc(100% + 200px)', height: 'calc(100% + 50px)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <Button
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 gap-2 shadow-lg"
          size="default"
        >
          <Plus className="h-4 w-4" />
          Create Quest
        </Button>
      </div>
    </div>
  );
};

export default SideQuestPage;
