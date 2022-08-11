import { AppProps } from "next/app";
import Head from "next/head";
import "./styles.css";
import "antd/dist/antd.css";
import "react-toastify/dist/ReactToastify.css";

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AYIAS</title>
      </Head>
      <main className="app">
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default CustomApp;
