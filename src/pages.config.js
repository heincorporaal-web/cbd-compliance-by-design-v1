import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Frameworks from './pages/Frameworks';
import Assessments from './pages/Assessments';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Companies": Companies,
    "Frameworks": Frameworks,
    "Assessments": Assessments,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};