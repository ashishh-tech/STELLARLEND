import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

/**
 * Connect to the Freighter Wallet using the v6 API.
 * In v6+, all API methods return Promises of objects: { result, error }
 * rather than direct primitive values.
 */
export const connectWallet = async () => {
  try {
    // v6: isConnected() returns { isConnected: boolean }
    const connectedResult = await isConnected();
    const isFreighterInstalled = connectedResult?.isConnected ?? connectedResult;

    if (!isFreighterInstalled) {
      window.open("https://www.freighter.app/", "_blank");
      alert("Freighter Wallet is not installed. We opened the extension page for you!\nInstall it, then refresh this page.");
      return null;
    }

    // v6: requestAccess() triggers the popup, returns { address } or { error }
    const accessResult = await requestAccess();

    if (accessResult?.error) {
      console.warn("Freighter access denied:", accessResult.error);
      return null;
    }

    // address may be directly in the result object
    let address = accessResult?.address ?? accessResult;

    // Fallback: if requestAccess didn't give us address, call getAddress()
    if (!address || typeof address !== "string") {
      const addrResult = await getAddress();
      address = addrResult?.address ?? addrResult;
    }

    if (address && typeof address === "string") {
      return address;
    }

  } catch (error) {
    console.error("Error connecting to Freighter:", error);
  }

  return null;
};
