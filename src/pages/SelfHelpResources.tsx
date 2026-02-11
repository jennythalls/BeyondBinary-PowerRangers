import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Globe, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ntuResources = [
  {
    name: "NTU University Counselling Centre (UCC)",
    phone: "6790 4462",
    hours: "Mon–Fri, 8:30am–5:30pm",
    location: "Student Services Centre, Level 3",
    website: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-well-being/ucc",
    description: "Free and confidential counselling for all NTU students.",
  },
  {
    name: "NTU Peer Helper Programme",
    description: "Trained student volunteers offering peer support and a listening ear.",
    website: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-well-being",
  },
  {
    name: "NTU Emergency After-Office Hours",
    phone: "6790 1800",
    hours: "After office hours & weekends",
    description: "Campus security for urgent mental health emergencies outside office hours.",
  },
];

const sgHelplines = [
  {
    name: "Samaritans of Singapore (SOS)",
    phone: "1-767",
    hours: "24 hours",
    website: "https://www.sos.org.sg",
    description: "Crisis support for anyone in distress or at risk of suicide.",
    tags: ["Crisis", "Suicide Prevention"],
  },
  {
    name: "Institute of Mental Health (IMH) Helpline",
    phone: "6389 2222",
    hours: "24 hours",
    website: "https://www.imh.com.sg",
    description: "Mental health crisis support and psychiatric emergencies.",
    tags: ["Crisis", "Psychiatric"],
  },
  {
    name: "National CARE Hotline",
    phone: "1800 202 6868",
    hours: "8am–12am daily",
    description: "Emotional and psychological support for stress, anxiety, and mental well-being.",
    tags: ["Emotional Support"],
  },
  {
    name: "Singapore Association for Mental Health (SAMH)",
    phone: "1800 283 7019",
    hours: "Mon–Fri, 9am–6pm",
    website: "https://www.samhealth.org.sg",
    description: "Counselling, rehabilitation, and support for various mental health conditions.",
    tags: ["Counselling", "Rehabilitation"],
  },
  {
    name: "TOUCHline (TOUCH Community Services)",
    phone: "1800 377 2252",
    hours: "Mon–Fri, 9am–6pm",
    website: "https://www.touch.org.sg",
    description: "Counselling support for youth, families, and individuals.",
    tags: ["Youth", "Family"],
  },
  {
    name: "Tinkle Friend Helpline (Singapore Children's Society)",
    phone: "1800 274 4788",
    hours: "Mon–Fri, 2:30pm–5pm",
    website: "https://www.childrensociety.org.sg",
    description: "Support for children and young people facing emotional difficulties.",
    tags: ["Youth", "Children"],
  },
  {
    name: "ec2.sg (Counselling Online)",
    website: "https://www.ec2.sg",
    description: "Free online chat-based counselling for youth and young adults.",
    tags: ["Online", "Youth"],
  },
  {
    name: "Silver Ribbon Singapore",
    phone: "6386 1928",
    website: "https://www.silverribbonsingapore.com",
    description: "Anti-stigma campaigns, support groups, and resources for mental health awareness.",
    tags: ["Awareness", "Support Groups"],
  },
  {
    name: "CHAT (Community Health Assessment Team)",
    phone: "6493 6500 / 6493 6501",
    hours: "Tue–Sat, 12pm–9pm",
    website: "https://www.imh.com.sg/CHAT",
    description: "Free mental health checks for youth aged 16–30. Walk-in or by appointment.",
    tags: ["Youth", "Assessment"],
  },
  {
    name: "Fei Yue Community Services – eC2 Hotline",
    phone: "6422 1599",
    hours: "Mon–Fri, 10am–6pm",
    website: "https://www.fycs.org",
    description: "Emotional support and counselling for individuals and families.",
    tags: ["Counselling", "Family"],
  },
  {
    name: "Care Corner Counselling Centre",
    phone: "1800 353 5800",
    hours: "Mon–Fri, 10am–10pm; Sat, 10am–4pm",
    website: "https://www.carecorner.org.sg",
    description: "Mandarin-language counselling hotline and multi-language support services.",
    tags: ["Counselling", "Mandarin"],
  },
];

const ResourceCard = ({ resource }: { resource: typeof sgHelplines[0] & { location?: string } }) => (
  <Card className="border-border">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold text-foreground">{resource.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <p className="text-muted-foreground">{resource.description}</p>
      {resource.phone && (
        <div className="flex items-center gap-2 text-foreground">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <a href={`tel:${resource.phone.replace(/\s/g, "")}`} className="hover:underline">
            {resource.phone}
          </a>
        </div>
      )}
      {resource.hours && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{resource.hours}</span>
        </div>
      )}
      {"location" in resource && resource.location && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{resource.location}</span>
        </div>
      )}
      {resource.website && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-primary" />
          <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
            Visit website
          </a>
        </div>
      )}
      {"tags" in resource && resource.tags && (
        <div className="flex flex-wrap gap-1 pt-1">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const SelfHelpResources = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/questbook")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 font-display text-xl font-semibold text-foreground">Self-Help Resources</h1>
      </header>

      <div className="flex-1 space-y-8 px-4 pb-8 sm:px-6">
        {/* NTU Resources */}
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">🎓 NTU Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ntuResources.map((r) => (
              <ResourceCard key={r.name} resource={r as any} />
            ))}
          </div>
        </section>

        {/* Singapore Helplines */}
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">🇸🇬 Singapore Helplines &amp; Services</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sgHelplines.map((r) => (
              <ResourceCard key={r.name} resource={r as any} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SelfHelpResources;