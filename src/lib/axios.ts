import Axios from "axios";

const axios = Axios.create({
 // baseURL: process.env.NEXT_PUBLIC_API_URL,
  maxBodyLength: Infinity,
  timeout: 12000, // 12 second timeout (optimized for serverless environments like Vercel)
  headers: {
    Accept: "application/json",
  },
});

export default axios;
