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
import Layout from './Layout.jsx';


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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};