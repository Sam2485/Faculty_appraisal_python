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
      { label: "Faculty List",   icon: I.list,    path: "/faculty"        },
      { label: "Add Faculty",    icon: I.addUser, path: "/faculty/add"    },
      { label: "Faculty Status", icon: I.refresh, path: "/faculty/status" },
    ],
  },
  {
    label: "Appraisal", icon: I.star,
    children: [
      { label: "Section Controls",  icon: I.gear,  path: "/appraisal/sections" },
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
    label: "Credentials", icon: I.key,
    children: [
      { label: "Generate Credentials", icon: I.layers, path: "/credentials"       },
      { label: "Reset Password",       icon: I.lock,   path: "/credentials/reset" },
    ],
  },
  {
    label: "Analytics", icon: I.trend,
    children: [
      { label: "Submission Trends",  icon: I.time, path: "/analytics"         },
      { label: "School Performance", icon: I.star, path: "/analytics/schools" },
      { label: "Export Reports",     icon: I.dl,   path: "/analytics/export"  },
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
