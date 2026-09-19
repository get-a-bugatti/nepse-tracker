
import './App.css'
import axios from "axios";

export async function AppLoader() {
  try {

    const authProveResponse = await axios.get("https://nepalstock.com/api/authenticate/prove", {  
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Brave\";v=\"145\", \"Chromium\";v=\"145\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "Referer": "https://nepalstock.com/",
        "Origin": "https://nepalstock.com/",
      },
  });

    const response = await axios.get("https://nepalstock.com/api/nots/security?nonDelisted=true");

    console.log("authRespnse" , authProveResponse);
    console.log(response?.data);
  } catch (error) {
    console.error(error);
  }
}

function App() {

  return (
    <>
      <form>
        <input type="text" placeholder="Search" />
        <select name="share" id="share">

        </select>
      </form>
    </>
  )
}

export default App
