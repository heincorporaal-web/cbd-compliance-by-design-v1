/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AssessmentDetail from './pages/AssessmentDetail';
import Assessments from './pages/Assessments';
import AuditLogs from './pages/AuditLogs';
import Companies from './pages/Companies';
import CompanyOverviewReport from './pages/CompanyOverviewReport';
import ControlDetail from './pages/ControlDetail';
import Controls from './pages/Controls';
import Dashboard from './pages/Dashboard';
import FrameworkDetail from './pages/FrameworkDetail';
import Frameworks from './pages/Frameworks';
import GRCGoalDetail from './pages/GRCGoalDetail';
import GRCGoals from './pages/GRCGoals';
import Home from './pages/Home';
import ICTSystems from './pages/ICTSystems';
import Incidents from './pages/Incidents';
import Issues from './pages/Issues';
import KnowledgeArticleDetail from './pages/KnowledgeArticleDetail';
import KnowledgeManagement from './pages/KnowledgeManagement';
import ProcessAssessmentDetail from './pages/ProcessAssessmentDetail';
import ProcessAssessments from './pages/ProcessAssessments';
import ProcessDetail from './pages/ProcessDetail';
import ProcessManagement from './pages/ProcessManagement';
import ProcessManagementDetail from './pages/ProcessManagementDetail';
import Reports from './pages/Reports';
import RiskControlEngine from './pages/RiskControlEngine';
import RiskDetail from './pages/RiskDetail';
import RiskRegister from './pages/RiskRegister';
import Roles from './pages/Roles';
import SignOffDetail from './pages/SignOffDetail';
import SignOffs from './pages/SignOffs';
import SurveyBuilder from './pages/SurveyBuilder';
import SurveyDetail from './pages/SurveyDetail';
import Surveys from './pages/Surveys';
import ThirdParties from './pages/ThirdParties';
import ThirdPartyDetail from './pages/ThirdPartyDetail';
import Users from './pages/Users';
import WorkflowApproval from './pages/WorkflowApproval';
import Workflows from './pages/Workflows';
import iHPOM from './pages/iHPOM';
import iHPOMTreeReport from './pages/iHPOMTreeReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssessmentDetail": AssessmentDetail,
    "Assessments": Assessments,
    "AuditLogs": AuditLogs,
    "Companies": Companies,
    "CompanyOverviewReport": CompanyOverviewReport,
    "ControlDetail": ControlDetail,
    "Controls": Controls,
    "Dashboard": Dashboard,
    "FrameworkDetail": FrameworkDetail,
    "Frameworks": Frameworks,
    "GRCGoalDetail": GRCGoalDetail,
    "GRCGoals": GRCGoals,
    "Home": Home,
    "ICTSystems": ICTSystems,
    "Incidents": Incidents,
    "Issues": Issues,
    "KnowledgeArticleDetail": KnowledgeArticleDetail,
    "KnowledgeManagement": KnowledgeManagement,
    "ProcessAssessmentDetail": ProcessAssessmentDetail,
    "ProcessAssessments": ProcessAssessments,
    "ProcessDetail": ProcessDetail,
    "ProcessManagement": ProcessManagement,
    "ProcessManagementDetail": ProcessManagementDetail,
    "Reports": Reports,
    "RiskControlEngine": RiskControlEngine,
    "RiskDetail": RiskDetail,
    "RiskRegister": RiskRegister,
    "Roles": Roles,
    "SignOffDetail": SignOffDetail,
    "SignOffs": SignOffs,
    "SurveyBuilder": SurveyBuilder,
    "SurveyDetail": SurveyDetail,
    "Surveys": Surveys,
    "ThirdParties": ThirdParties,
    "ThirdPartyDetail": ThirdPartyDetail,
    "Users": Users,
    "WorkflowApproval": WorkflowApproval,
    "Workflows": Workflows,
    "iHPOM": iHPOM,
    "iHPOMTreeReport": iHPOMTreeReport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};