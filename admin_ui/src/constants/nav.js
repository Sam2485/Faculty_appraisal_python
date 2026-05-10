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
    label: "Faculty", icon: I.users,
    children: [
      { label: "Faculty List",   icon: I.list,    path: "/faculty"           },
      { label: "Add Faculty",    icon: I.addUser, path: "/faculty/add"       },
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
    label: "Tracking", icon: I.chart,
    children: [
      { label: "Submitted Faculty", icon: I.check,  path: "/tracking/submitted" },
      { label: "Pending Faculty",   icon: I.clock,  path: "/tracking/pending"   },
      { label: "School Statistics", icon: I.school, path: "/tracking/schools"   },
    ],
  },
  {
    label: "Analytics", icon: I.trend,
    children: [
      { label: "Analytics & Reports", icon: I.trend, path: "/analytics" },
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
      { label: "System Settings",  icon: I.monitor, path: "/settings"          },
      { label: "Role Permissions", icon: I.shield,  path: "/settings/roles"    },
      { label: "Security",         icon: I.lock,    path: "/settings/security" },
    ],
  },
];
