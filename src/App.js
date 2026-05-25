import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import AdminSignIn from './pages/AdminSignIn';
import AdminSignUp from './pages/AdminSignUp';
import ProtectedRoute from './contexts/ProtectedRoute';
import AdminProfile from "./pages/AdminProfile";
import TestView from "./pages/TestView";
import TestPassing from './pages/TestPassing';
import TestBuilder from './pages/TestBuilder';
import { Toaster } from 'react-hot-toast';

function App() {
    return (<BrowserRouter>
        <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#ffffff',
                    color: '#04e818',
                    fontSize: '20px',
                },
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#2a7f3e',
                        secondary: '#fff',
                    },
                },
                error: {
                    style: {
                        color: '#dc3545',
                    },
                    duration: 4000,
                    iconTheme: {
                        primary: '#dc3545',
                        secondary: '#fff',
                    },
                },
            }}
        />
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
            <Route path="/admin/test-builder" element={
                <ProtectedRoute allowedRoles={['SUPER']}>
                    <TestBuilder />
                </ProtectedRoute>
            } />
        </Routes>
    </BrowserRouter>)
}

export default App;
