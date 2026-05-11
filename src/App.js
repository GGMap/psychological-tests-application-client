import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import AdminSignIn from './pages/AdminSignIn';
import AdminSignUp from './pages/AdminSignUp';
import ProtectedRoute from './contexts/ProtectedRoute';
import AdminProfile from "./pages/AdminProfile";
import TestView from "./pages/TestView";
import TestPassing from './pages/TestPassing';

function App() {
    return (<BrowserRouter>
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/admin/signin" element={<AdminSignIn/>}/>
            <Route path="/admin/profile" element={
                <ProtectedRoute>
                <AdminProfile/>
                </ProtectedRoute>
            }/>
            <Route path="/admin/signup" element={
                <ProtectedRoute>
                <AdminSignUp/>
                </ProtectedRoute>
            }/>
            <Route path="/admin/test/:testId" element={
                <ProtectedRoute>
                    <TestView />
                </ProtectedRoute>
            } />
            <Route path="/test/:testId" element={<TestPassing />} />
        </Routes>
    </BrowserRouter>)
}

export default App;
