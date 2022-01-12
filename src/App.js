import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AuthProvider from "./context/auth";
import PrivateRoute from "./components/PrivateRoute";
import { SocketProvider } from "./context/SocketContext";
import Audio from "./pages/Audio";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          <Route
            exact
            path="/register"
            component={() => (
              <Layout>
                <Register />
              </Layout>
            )}
          />
          <Route
            exact
            path="/login"
            component={() => (
              <Layout>
                <Login />
              </Layout>
            )}
          />
          <PrivateRoute
            exact
            path="/profile"
            component={() => (
              <Layout>
                <Profile />
              </Layout>
            )}
          />
          <SocketProvider>
            <PrivateRoute
              exact
              path="/"
              component={() => (
                <Layout>
                  <Home />
                </Layout>
              )}
            />
            <PrivateRoute exact path="/audio" component={Audio} />
          </SocketProvider>
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
