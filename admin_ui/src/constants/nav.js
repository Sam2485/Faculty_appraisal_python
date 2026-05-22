import { I } from '../components/icons';

export const NAV = [
  {
    label: "Dashboard", icon: I.home,
    children: [
      { label: "Overview",        icon: I.eye,     path: "/"      },
      { label: "Appraisal Cycle", icon: I.refresh, path: "/cycle" },
    ],
  },
  {
    label: "User Registration", icon: I.users,
    children: [
      { label: "User List",      icon: I.list,    path: "/faculty"           },
      { label: "Add User",       icon: I.addUser, path: "/faculty/add"       },
      { label: "Reset Password", icon: I.lock,    path: "/credentials/reset" },
    ],
  },
  {
    label: "Appraisal", icon: I.star,
    children: [
      { label: "Submission Window", icon: I.doc,   path: "/appraisal/window"   },
      { label: "Submission Status", icon: I.check, path: "/appraisal/status"   },
    ],
  },
  {
    label: "NT Workflow", icon: I.layers,
    children: [
      { label: "Designations",       icon: I.star, path: "/workflow/designations" },
      { label: "Workflow Templates", icon: I.doc,  path: "/workflow/templates"    },
    ],
  },
  {
    label: "Feedback", icon: I.chat,
    children: [
      { label: "Queries & Bugs", icon: I.bug, path: "/feedback" },
    ],
  },
  {
    label: "Announcements", icon: I.bell,
    children: [
      { label: "Create Notice", icon: I.edit, path: "/announcements" },
    ],
  },
  {
    label: "Settings", icon: I.gear,
    children: [
      { label: "System Settings", icon: I.monitor, path: "/settings"          },
      { label: "Security",        icon: I.lock,    path: "/settings/security" },
    ],
  },
  {
    label: "Unauthorized Access", icon: I.star, superAdminOnly: true,
    children: [
      { label: "All Scores",       icon: I.eye,  path: "/marks" },
      { label: "Pending Reviews",  icon: I.clock, path: "/marks/pending" },
    ],
  },
];
