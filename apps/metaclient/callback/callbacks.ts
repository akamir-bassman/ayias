/* eslint @typescript-eslint/no-var-requires: "off" */
import Reactverse, { types, ReactverseProps } from "@decentverse/client";
import { Socket as Soc } from "socket.io-client";
const Caver = require("caver-js");
export const Utils = {
  shuffle: <T>(arr: T[]): T[] => arr.sort((a, b) => 0.5 - Math.random()),
};
import { ethers } from "ethers";
import * as abi from "./abi";
export const donation: types.ItemCallback = async (
  store: types.AllStore,
  socket: Soc,
  id: string,
  option: any
) => {
  store.world.getState().pendingStart();
  const inventory = store.inventory.getState().inventory;
  const userId = store.world.getState().me.id;
  const item = inventory.find((cur) => cur?.item?.id === id);
  const num = option?.num ?? 1;
  const { chain, address, type } = item.item.contract;
  if (chain === "ethereum") {
    const [selectedAddress]: string[] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const contract = new ethers.Contract(
      item.item.contract.address,
      item.item.contract.abi,
      provider.getSigner(0)
    );
    const to = process.env.NEXT_PUBLIC_GET_DONATE_ADDRESS;
    if (typeof window.ethereum === "undefined") return;
    if (type === "ERC-721") {
      const tx = await contract.safeTransferFrom(
        selectedAddress,
        to,
        item.item.tokenId
      );
      await tx.wait();
    } else if (type === "ERC-1155") {
      const data = "0x0";
      const tx = await contract.safeTransferFrom(
        selectedAddress,
        to,
        item.item.tokenId,
        num,
        data
      );
      await tx.wait();
    }
  } else if (chain === "klaytn") {
    if (!window.klaytn) return;
    const account = (await window.klaytn.enable())[0];
    if (!account) return;
    const caver = new Caver(window.klaytn);
    try {
      // const to = "0x313944082ec65822a0c2B26DB6fAAdf566825342";
      const to = process.env.NEXT_PUBLIC_GET_DONATE_ADDRESS;
      if (type === "ERC-721") {
        const safetrnasferAbi = abi.safetransferFrom721;
        const contract = new caver.klay.Contract(
          safetrnasferAbi,
          item.item.contract.address
        );

        const rst = await contract.methods[
          "safeTransferFrom(address,address,uint256)"
        ](account, to, item.item.tokenId)
          .send({ from: account, gas: 300000 })
          .then(function (result) {
            console.log(result);
          });
      } else if (type === "ERC-1155") {
        const safetrnasferAbi = abi.safetransferFrom1155;
        const contract = new caver.klay.Contract(
          safetrnasferAbi,
          item.item.contract.address
        );
        const data = "0x0";
        const rst = await contract.methods[
          "safeTransferFrom(address,address,uint256,uint256,bytes)"
        ](account, to, item.item.tokenId, num, data)
          .send(
            { from: account, gas: 300000 },
            function (error, transactionHash) {
              console.log(error, transactionHash);
            }
          )
          .on("error", function (error) {
            console.log(error);
          })
          .on("transactionHash", function (transactionHash) {
            console.log(transactionHash);
          })
          .on("receipt", async function (receipt) {
            console.log("contract address", receipt); // contains the new contract address
            // await store.inventory.getState().syncInventory(userId);
          })
          .then(function (newContractInstance) {
            // console.log(newContractInstance.options.address); // instance with the new contract address
          });
        //       )
        //     .then(async function (result) {
        //       console.log(result);
        //     });
        //   console.log(rst);
      }
    } catch (err) {
      console.log(err);
      store.world.getState().pendingEnd();
      store.inventory.setState({
        isOpenInventory: false,
        isOpenItemMenu: false,
        isShowItemInfo: false,
      });

      return;
    }
  } else if (chain === "luniverse") {
    console.log("luniverse");
  }
  store.world.getState().pendingEnd();
  setTimeout(
    async () => await store.inventory.getState().syncInventory(userId),
    1000
  );
  store.visualEffect.setState({ effectType: "donationOut" });
  store.inventory.setState({
    isOpenInventory: false,
    isOpenItemMenu: false,
    isShowItemInfo: false,
  });
  setTimeout(() => store.visualEffect.setState({ effectType: "none" }), 3000);
  return;
};
export const goldenbell: types.ItemCallback = async (
  store: types.AllStore,
  socket: Soc,
  id: string,
  option: any
) => {
  store.world.getState().pendingStart();
  const inventory = store.inventory.getState().inventory;
  const item = inventory.find((cur) => cur?.item?.id === id);

  if (!item) return;
  const num = option?.num ?? 1;

  const user = store.world.getState().me;
  const otherPlayerIds = store.world.getState().otherPlayerIds;
  const otherPlayers = store.world.getState().otherPlayers;
  const { chain, address, type } = item.item.contract;
  const tokenId = item.item.tokenId;

  const tempTargets = otherPlayerIds
    .map((id) => {
      const otherPlayer = otherPlayers.get(id)?.user;
      const wallet = otherPlayer.wallets.find(
        (wallet) => wallet.chain === chain
      );
      if (!wallet) return null;
      return { id: otherPlayer.id, address: wallet.address };
    })
    .filter((cur) => cur && cur?.id !== user.id);
  const targets = Utils.shuffle(tempTargets).slice(0, num);
  const addresslist = targets.map((target) => target.address);
  if (chain === "klaytn") {
    const [account] = await window.klaytn.enable();
    const caver = new Caver(window.klaytn);
    const approvalForAllAbi = abi.approvalForAllAbi;
    const transferAbi = abi.transferContractAbi;
    const transferContractAddr =
      process.env.NEXT_PUBLIC_TRANSFER_CONTRACT_ADDRESS;
    const contract = new caver.klay.Contract(approvalForAllAbi, address);
    const transferContract = new caver.klay.Contract(
      transferAbi,
      transferContractAddr
    );
    const gasAmount2 = await contract.methods
      .setApprovalForAll(transferContractAddr, true)
      .estimateGas({
        from: account,
      });
    try {
      const isApproved = await contract.methods
        .isApprovedForAll(account, transferContractAddr)
        .call({
          from: account,
        });

      !isApproved &&
        (await contract.methods
          .setApprovalForAll(transferContractAddr, true)
          .send({
            from: account,
            gas: gasAmount2,
          }));

      if (item.item.contract.type === "ERC-721") {
        const ret = await transferContract.methods[
          "goldenbellKIP17(address,address,address[],uint256[])"
        ](address, account, addresslist, [tokenId]).send({
          from: account,
          gas: 300000,
        });
      } else if (item.item.contract.type === "ERC-1155") {
        const amounts = addresslist.map(() => 1);
        const ret = await transferContract.methods[
          "goldenbellERC1155(address,address,uint256,address[],uint256[])"
        ](address, account, tokenId, addresslist, amounts)
          .send({
            from: account,
            gas: 300000,
          })
          .then(async () => {
            console.log();
          });
      }
    } catch (err) {
      console.log(err);
      store.world.getState().pendingEnd();

      return;
    }
  } else if (chain === "ethereum") {
    console.log("ethereum");
  } else if (chain === "luniverse") {
    console.log("luniverse");
  }

  store.world.getState().pendingEnd();

  setTimeout(
    async () => await store.inventory.getState().syncInventory(user.id),
    1000
  );
  socket.emit("events", {
    userIds: targets.map((target) => target.id),
    type: "effect",
  });
  store.inventory.setState({
    isOpenInventory: false,
    isOpenItemMenu: false,
    isShowItemInfo: false,
  });
  store.visualEffect.setState({ effectType: "goldenBell" });
  setTimeout(() => store.visualEffect.setState({ effectType: "none" }), 3000);
};
export const eventCallback: types.scalar.EventCallback = async (
  store: types.AllStore,
  data: types.scalar.EventCallbackParameters
) => {
  const userId = store.world.getState().me.id;
  if (data.type === "effect" && data.userIds.includes(userId)) {
    //setEffect(1);
    setTimeout(
      async () => await store.inventory.getState().syncInventory(userId),
      1000
    );
    store.visualEffect.setState({ effectType: "donationIn" });
    setTimeout(() => store.visualEffect.setState({ effectType: "none" }), 3000);
  }
};
