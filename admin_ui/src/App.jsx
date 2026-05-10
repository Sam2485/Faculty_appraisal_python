import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'

import OverviewPage        from './pages/dashboard/OverviewPage'
import AppraisalCyclePage  from './pages/dashboard/AppraisalCyclePage'

import FacultyListPage     from './pages/faculty/FacultyListPage'
import AddFacultyPage      from './pages/faculty/AddFacultyPage'

import SubmissionWindowPage   from './pages/appraisal/SubmissionWindowPage'
import SubmissionStatusPage   from './pages/appraisal/SubmissionStatusPage'

import SubmittedFacultyPage  from './pages/tracking/SubmittedFacultyPage'
import PendingFacultyPage    from './pages/tracking/PendingFacultyPage'
import SchoolStatisticsPage  from './pages/tracking/SchoolStatisticsPage'

import CredentialDetailsPage from './pages/credentials/CredentialDetailsPage'

import AnalyticsPage     from './pages/analytics/AnalyticsPage'
import FeedbackPage      from './pages/feedback/FeedbackPage'
import AnnouncementsPage from './pages/announcements/AnnouncementsPage'
import SettingsPage      from './pages/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<MainLayout />}>
        {/* Dashboard */}
        <Route index                  element={<OverviewPage />}        />
        <Route path="cycle"           element={<AppraisalCyclePage />}  />

        {/* Faculty */}
        <Route path="faculty"     element={<FacultyListPage />} />
        <Route path="faculty/add" element={<AddFacultyPage />} />

        {/* Appraisal */}
        <Route path="appraisal/window"   element={<SubmissionWindowPage />} />
        <Route path="appraisal/status"   element={<SubmissionStatusPage />} />

        {/* Tracking */}
        <Route path="tracking/submitted" element={<SubmittedFacultyPage />}  />
        <Route path="tracking/pending"   element={<PendingFacultyPage />}    />
        <Route path="tracking/schools"   element={<SchoolStatisticsPage />}  />

        {/* Credentials */}
        <Route path="credentials/reset" element={<CredentialDetailsPage />} />

        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* Feedback */}
        <Route path="feedback" element={<FeedbackPage />} />

        {/* Announcements */}
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Settings */}
        <Route path="settings"          element={<SettingsPage />} />
        <Route path="settings/roles"    element={<SettingsPage />} />
        <Route path="settings/security" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
