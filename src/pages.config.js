import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Frameworks from './pages/Frameworks';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import ControlDetail from './pages/ControlDetail';
import ICTSystems from './pages/ICTSystems';
import Incidents from './pages/Incidents';
import ThirdParties from './pages/ThirdParties';
import ThirdPartyDetail from './pages/ThirdPartyDetail';
import Issues from './pages/Issues';
import Surveys from './pages/Surveys';
import SurveyBuilder from './pages/SurveyBuilder';
import SurveyDetail from './pages/SurveyDetail';
import RiskRegister from './pages/RiskRegister';
import RiskDetail from './pages/RiskDetail';
import Controls from './pages/Controls';
import GRCGoals from './pages/GRCGoals';
import GRCGoalDetail from './pages/GRCGoalDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Companies": Companies,
    "Frameworks": Frameworks,
    "Assessments": Assessments,
    "AssessmentDetail": AssessmentDetail,
    "ControlDetail": ControlDetail,
    "ICTSystems": ICTSystems,
    "Incidents": Incidents,
    "ThirdParties": ThirdParties,
    "ThirdPartyDetail": ThirdPartyDetail,
    "Issues": Issues,
    "Surveys": Surveys,
    "SurveyBuilder": SurveyBuilder,
    "SurveyDetail": SurveyDetail,
    "RiskRegister": RiskRegister,
    "RiskDetail": RiskDetail,
    "Controls": Controls,
    "GRCGoals": GRCGoals,
    "GRCGoalDetail": GRCGoalDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};