import axios from "axios";

const response = await axios.post(
  "https://realtime.oxylabs.io/v1/querys",
  {
    source: "universal",
    url: "https://www.nike.com/t/air-force-1-07-mens-shoes-5QFp5Z",
    render: "html",
  },
  {
    auth: {
      username: "crossborder_2CqEu",
      password: "evanamor21EC+",
    },
    timeout: 30000,
  }
);
console.log("STATUS:", response.status);
console.log("CONTENT LENGTH:", response.data.results[0].content.length);
