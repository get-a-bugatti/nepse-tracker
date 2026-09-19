import {createBrowserRouter} from "react-router-dom";
import App, {AppLoader} from "../App";


const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <App/>,
            loader: AppLoader
        }
    ]
)

export default router;