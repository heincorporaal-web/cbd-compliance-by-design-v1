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
import StakeholderListReport from './pages/StakeholderListReport';
import RisksReport from './pages/RisksReport';
import ControlsReport from './pages/ControlsReport';
import PrincipalRisksReport from './pages/PrincipalRisksReport';
import IssuesReport from './pages/IssuesReport';
import IncidentsReport from './pages/IncidentsReport';
import AssessmentsReport from './pages/AssessmentsReport';
import ThirdPartiesReport from './pages/ThirdPartiesReport';
import ITCapabilitiesReport from './pages/ITCapabilitiesReport';
import PerformanceManagement from './pages/reports/PerformanceManagement';
import DataLibraries from './pages/reports/DataLibraries';
import IssueManagement from './pages/reports/IssueManagement';
import Matrices from './pages/reports/Matrices';
import HelpCentre from './pages/HelpCentre';
import FrameworkLibrary from './pages/FrameworkLibrary';
import MyActions from './pages/MyActions';
import AssessmentModels from './pages/AssessmentModels';
import AssessmentModelDetail from './pages/AssessmentModelDetail';
import EvidenceLibrary from './pages/EvidenceLibrary';
import BalancedScorecards from './pages/BalancedScorecards';
import BalancedScorecardDetail from './pages/BalancedScorecardDetail';
import About from './pages/About';
import AdvancedThirdPartyRiskManagement from './pages/AdvancedThirdPartyRiskManagement';
import AdminPlaybooks from './pages/AdminPlaybooks';
import AdvancedProcessModelling from './pages/AdvancedProcessModelling';
import OperationsByDesign from './pages/OperationsByDesign';
import PartnerByDesign from './pages/PartnerByDesign';
import StakeholderAssignmentGaps from './pages/StakeholderAssignmentGaps';
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
        <Route path="/MyActions" element={<MyActions />} />
        <Route path="/GettingStarted" element={<GettingStarted />} />
        <Route path="/HelpCentre" element={<HelpCentre />} />
        <Route path="/FrameworkLibrary" element={<FrameworkLibrary />} />
        <Route path="/AssessmentModels" element={<AssessmentModels />} />
        <Route path="/AssessmentModelDetail" element={<AssessmentModelDetail />} />
        <Route path="/EvidenceLibrary" element={<EvidenceLibrary />} />
        <Route path="/BalancedScorecards" element={<BalancedScorecards />} />
        <Route path="/BalancedScorecardDetail" element={<BalancedScorecardDetail />} />
        <Route path="/PrincipalRisks" element={<PrincipalRisks />} />
        <Route path="/ObjectivesSummary" element={<ObjectivesSummary />} />
        <Route path="/PrincipalRisksSummary" element={<PrincipalRisksSummary />} />
        <Route path="/StakeholderListReport" element={<StakeholderListReport />} />
        <Route path="/RisksReport" element={<RisksReport />} />
        <Route path="/ControlsReport" element={<ControlsReport />} />
        <Route path="/PrincipalRisksReport" element={<PrincipalRisksReport />} />
        <Route path="/IssuesReport" element={<IssuesReport />} />
        <Route path="/IncidentsReport" element={<IncidentsReport />} />
        <Route path="/AssessmentsReport" element={<AssessmentsReport />} />
        <Route path="/ThirdPartiesReport" element={<ThirdPartiesReport />} />
        <Route path="/ITCapabilitiesReport" element={<ITCapabilitiesReport />} />
        <Route path="/PerformanceManagement" element={<PerformanceManagement />} />
        <Route path="/DataLibraries" element={<DataLibraries />} />
        <Route path="/IssueManagement" element={<IssueManagement />} />
        <Route path="/Matrices" element={<Matrices />} />
        <Route path="/AdvancedThirdPartyRiskManagement" element={<AdvancedThirdPartyRiskManagement />} />
        <Route path="/AdminPlaybooks" element={<AdminPlaybooks />} />
        <Route path="/AdvancedProcessModelling" element={<AdvancedProcessModelling />} />
        <Route path="/OperationsByDesign" element={<OperationsByDesign />} />
        <Route path="/PartnerByDesign" element={<PartnerByDesign />} />
        <Route path="/StakeholderAssignmentGaps" element={<StakeholderAssignmentGaps />} />
        <Route path="/about" element={<About />} />
        <Route path="/MobileSettings" element={<MobileSettings />} />
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