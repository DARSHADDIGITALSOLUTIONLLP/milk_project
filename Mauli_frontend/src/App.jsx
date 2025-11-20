import AllRoutes from "./routes/AllRoutes";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

function App() {
  return (
    <>
      <Router>
        <AllRoutes />
      </Router>
    </>
  );
}

export default App;
