import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Frameworks from './pages/Frameworks';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import ControlDetail from './pages/ControlDetail';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Companies": Companies,
    "Frameworks": Frameworks,
    "Assessments": Assessments,
    "AssessmentDetail": AssessmentDetail,
    "ControlDetail": ControlDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};