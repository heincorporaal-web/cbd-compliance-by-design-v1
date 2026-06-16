import './App.css'
import { Toaster } from "@/components/ui/toaster"
import ThemeProvider from '@/lib/ThemeProvider'
import MobileSettings from './pages/MobileSettings'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import GettingStarted from './pages/GettingStarted';
import PrincipalRisks from './pages/PrincipalRisks';
import ObjectivesSummary from './pages/ObjectivesSummary';
import PrincipalRisksSummary from './pages/PrincipalRisksSummary';
import HelpCentre from './pages/HelpCentre';
import AssessmentModels from './pages/AssessmentModels';
import AssessmentModelDetail from './pages/AssessmentModelDetail';
import EvidenceLibrary from './pages/EvidenceLibrary';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/GettingStarted" element={<LayoutWrapper currentPageName="GettingStarted"><GettingStarted /></LayoutWrapper>} />
        <Route path="/HelpCentre" element={<LayoutWrapper currentPageName="HelpCentre"><HelpCentre /></LayoutWrapper>} />
        <Route path="/AssessmentModels" element={<LayoutWrapper currentPageName="AssessmentModels"><AssessmentModels /></LayoutWrapper>} />
        <Route path="/AssessmentModelDetail" element={<LayoutWrapper currentPageName="AssessmentModelDetail"><AssessmentModelDetail /></LayoutWrapper>} />
        <Route path="/EvidenceLibrary" element={<LayoutWrapper currentPageName="EvidenceLibrary"><EvidenceLibrary /></LayoutWrapper>} />
        <Route path="/PrincipalRisks" element={<LayoutWrapper currentPageName="PrincipalRisks"><PrincipalRisks /></LayoutWrapper>} />
        <Route path="/ObjectivesSummary" element={<LayoutWrapper currentPageName="ObjectivesSummary"><ObjectivesSummary /></LayoutWrapper>} />
        <Route path="/PrincipalRisksSummary" element={<LayoutWrapper currentPageName="PrincipalRisksSummary"><PrincipalRisksSummary /></LayoutWrapper>} />
        <Route path="/ObjectivesSummary" element={<LayoutWrapper currentPageName="ObjectivesSummary"><ObjectivesSummary /></LayoutWrapper>} />
        <Route path="/PrincipalRisksSummary" element={<LayoutWrapper currentPageName="PrincipalRisksSummary"><PrincipalRisksSummary /></LayoutWrapper>} />
        <Route path="/MobileSettings" element={<LayoutWrapper currentPageName="MobileSettings"><MobileSettings /></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App