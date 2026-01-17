import AssessmentDetail from './pages/AssessmentDetail';
import Assessments from './pages/Assessments';
import Companies from './pages/Companies';
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
import ProcessAssessmentDetail from './pages/ProcessAssessmentDetail';
import ProcessAssessments from './pages/ProcessAssessments';
import ProcessDetail from './pages/ProcessDetail';
import RiskControlEngine from './pages/RiskControlEngine';
import RiskDetail from './pages/RiskDetail';
import RiskRegister from './pages/RiskRegister';
import SignOffDetail from './pages/SignOffDetail';
import SignOffs from './pages/SignOffs';
import SurveyBuilder from './pages/SurveyBuilder';
import SurveyDetail from './pages/SurveyDetail';
import Surveys from './pages/Surveys';
import ThirdParties from './pages/ThirdParties';
import ThirdPartyDetail from './pages/ThirdPartyDetail';
import WorkflowApproval from './pages/WorkflowApproval';
import Workflows from './pages/Workflows';
import iHPOM from './pages/iHPOM';
import Users from './pages/Users';
import Roles from './pages/Roles';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssessmentDetail": AssessmentDetail,
    "Assessments": Assessments,
    "Companies": Companies,
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
    "ProcessAssessmentDetail": ProcessAssessmentDetail,
    "ProcessAssessments": ProcessAssessments,
    "ProcessDetail": ProcessDetail,
    "RiskControlEngine": RiskControlEngine,
    "RiskDetail": RiskDetail,
    "RiskRegister": RiskRegister,
    "SignOffDetail": SignOffDetail,
    "SignOffs": SignOffs,
    "SurveyBuilder": SurveyBuilder,
    "SurveyDetail": SurveyDetail,
    "Surveys": Surveys,
    "ThirdParties": ThirdParties,
    "ThirdPartyDetail": ThirdPartyDetail,
    "WorkflowApproval": WorkflowApproval,
    "Workflows": Workflows,
    "iHPOM": iHPOM,
    "Users": Users,
    "Roles": Roles,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};