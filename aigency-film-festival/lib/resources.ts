export type Resource = {
  title: string;
  subtitle: string;
  /** public path of the served PDF */
  file: string;
  /** filename the browser saves it as — the document's real title */
  download: string;
  tag: string;
};

/** Training resources offered for download on /resources. */
export const RESOURCES: Resource[] = [
  {
    title: "Post-Production with AI",
    subtitle: "Day 1 Takeaways — Introduction to AI Video & Audio Generation",
    file: "/resources/Post-Production-with-AI-Day-1-Takeaways.pdf",
    download: "Post-Production with AI — Day 1 Takeaways.pdf",
    tag: "Workshop · Day 1",
  },
  {
    title: "Build Your Project",
    subtitle: "Day 2 Takeaways — Film Festival Submission: from idea to rough cut",
    file: "/resources/Build-Your-Project-Day-2-Takeaways.pdf",
    download: "Build Your Project — Day 2 Takeaways.pdf",
    tag: "Workshop · Day 2",
  },
  {
    title: "Advisor Mode — V2",
    subtitle: "Accuracy over approval — eight rules for the most exacting minds",
    file: "/resources/Advisor-Mode-V2-EN.pdf",
    download: "Advisor Mode V2 — Accuracy Over Approval.pdf",
    tag: "Guide · English",
  },
  {
    title: "Advisor Mode — V2",
    subtitle: "الدقة قبل المجاملة — وضع المستشار، النسخة العربية",
    file: "/resources/Advisor-Mode-V2-AR.pdf",
    download: "Advisor Mode V2 — Arabic.pdf",
    tag: "Guide · العربية",
  },
];
