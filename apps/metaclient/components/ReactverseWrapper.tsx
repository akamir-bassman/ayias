import Reactverse, { types, ReactverseProps } from "@decentverse/client";
import * as callback from "./../callback/callbacks";
const ReactVerseWrapper = () => {
  const uri = `${process.env.NEXT_PUBLIC_REACT_APP_API_PROTOCOL}://${process.env.NEXT_PUBLIC_REACT_APP_API_HOST}:${process.env.NEXT_PUBLIC_REACT_APP_API_PORT}/graphql`;
  const ws = `${process.env.NEXT_PUBLIC_WEBSOCKET_PROTOCOL}://${process.env.NEXT_PUBLIC_WEBSOCKET_HOST}:${process.env.NEXT_PUBLIC_WEBSOCKET_PORT}`;
  const config: types.Configuration = {
    kaikas: {
      address: "0xe47e90c58f8336a2f24bcd9bcb530e2e02e1e8ae",
    },
    metamask: {
      address: "0x37572d0c069221ed7e8406b34cbd332983353ab6",
    },
    login: {
      logoImage: "./logo.svg",
      backgroundImage: "./back.png",
    },
  };

  const callbacks: types.ItemCallbacks = [
    {
      label: "Donation",
      callback: callback.donation,
    },
    {
      label: "Golden Bell",
      callback: callback.goldenbell,
      isAdminRights: true,
    },
  ];
  const eventCallback = callback.eventCallback;

  return (
    <Reactverse
      uri={uri}
      ws={ws}
      config={config}
      itemCallbacks={callbacks}
      eventCallback={eventCallback}
    />
  );
};
export default ReactVerseWrapper;
