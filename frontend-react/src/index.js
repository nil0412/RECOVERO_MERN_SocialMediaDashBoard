import React from 'react';
import ReactDOM from 'react-dom/client';
// import { ToastProvider } from 'react-toast-notifications';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.css';
import { App } from './components';
import { AuthProvider, PostsProvider } from './providers';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <ToastProvider autoDismiss autoDismissTimeout={5000} placement="top-right"> */}
    <ToastContainer />
      <AuthProvider>
        <PostsProvider>
          <App />
        </PostsProvider>
      </AuthProvider>
    {/* </ToastProvider> */}
  </React.StrictMode>
);
