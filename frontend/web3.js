// web3.js
// Bridge between the frontend and the CrowdChain smart contract.

const CONTRACT_ADDRESS = "0xc935CDd48A37E41566F493Ba14a5Ffb133Ea28d6"; // <- confirm this matches your real Sepolia deployment

const SEPOLIA_CHAIN_ID = 11155111n; // ethers v6 returns chainId as a BigInt

const CONTRACT_ABI = [{"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_requestId", "type": "uint256"}], "name": "approveRequest", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "string", "name": "_title", "type": "string"}, {"internalType": "string", "name": "_description", "type": "string"}, {"internalType": "uint256", "name": "_goal", "type": "uint256"}, {"internalType": "address payable", "name": "_organizer", "type": "address"}], "name": "createCampaign", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_requestId", "type": "uint256"}], "name": "rejectRequest", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_amount", "type": "uint256"}, {"internalType": "string", "name": "_purpose", "type": "string"}], "name": "requestFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"inputs": [], "name": "admin", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "campaignCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "campaigns", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "goal", "type": "uint256"}, {"internalType": "uint256", "name": "amountRaised", "type": "uint256"}, {"internalType": "uint256", "name": "amountUtilized", "type": "uint256"}, {"internalType": "address payable", "name": "organizer", "type": "address"}, {"internalType": "bool", "name": "active", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "donations", "outputs": [{"internalType": "address", "name": "donor", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "fundRequests", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "uint256", "name": "campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "string", "name": "purpose", "type": "string"}, {"internalType": "bool", "name": "approved", "type": "bool"}, {"internalType": "bool", "name": "rejected", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_index", "type": "uint256"}], "name": "getDonation", "outputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "getDonationCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "uint256", "name": "_index", "type": "uint256"}], "name": "getFundRequest", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "string", "name": "", "type": "string"}, {"internalType": "bool", "name": "", "type": "bool"}, {"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}], "name": "getFundRequestCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}];

let provider;
let signer;
let contract;

// Writes a friendly message into whichever container exists on the current page,
// instead of letting a failed read call fail silently.
function showLoadError(message) {
  ["campaignList", "campaignName"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p style="color:#f87171">${message}</p>`;
  });
}

async function initContract(requestAccounts) {
  if (typeof window.ethereum === "undefined") {
    if (requestAccounts) alert("Please install MetaMask to use CrowdChain!");
    return null;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  if (requestAccounts) {
    await provider.send("eth_requestAccounts", []);
  }

  const accounts = await provider.send("eth_accounts", []);
  if (accounts.length === 0) return null; // not connected yet, and we didn't ask

  // Network check — contract calls on the wrong chain fail with confusing errors,
  // so catch it here instead of letting every call downstream break mysteriously.
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    if (requestAccounts) {
      alert("Please switch MetaMask to the Sepolia test network to use CrowdChain.");
    } else {
      showLoadError("Wrong network — switch MetaMask to Sepolia and reload.");
    }
    contract = null;
    return null;
  }

  signer = await provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const btn = document.getElementById("connectBtn");
  if (btn) btn.textContent = accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4);

  return contract;
}

async function connectWallet() {
  await initContract(true);
  if (typeof onWalletConnected === "function") onWalletConnected();
}

// Reload automatically if the user switches network or account in MetaMask,
// rather than leaving the page in a stale, half-connected state.
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("chainChanged", () => window.location.reload());
  window.ethereum.on("accountsChanged", () => window.location.reload());
}

// ---- Read functions ----

async function getCampaigns() {
  if (!contract) return [];
  try {
    const count = await contract.campaignCount();
    const list = [];
    for (let i = Number(count); i >= 1 ; i--) {
      const c = await contract.campaigns(i);
      list.push({
        id: Number(c.id),
        name: c.title,
        goal: Number(ethers.formatEther(c.goal)),
        raised: Number(ethers.formatEther(c.amountRaised)),
        used: Number(ethers.formatEther(c.amountUtilized)),
        organizer: c.organizer,
        active: c.active
      });
    }
    return list;
  } catch (err) {
    console.error(err);
    showLoadError("Couldn't load campaigns — check your wallet is connected to Sepolia.");
    return [];
  }
}

async function getCampaignById(id) {
  if (!contract) return null;
  try {
    const c = await contract.campaigns(id);
    if (c.organizer === "0x0000000000000000000000000000000000000000") return null;

    // Pull fund requests for the Fund Utilization section.
    // getFundRequest returns (id, amount, purpose, approved, rejected) — campaignId
    // is dropped since it's already known from the call. If your contract orders
    // these differently, adjust the destructuring below to match.
    const reqCount = await contract.getFundRequestCount(id);
    const utilization = [];
    for (let i = 0; i < Number(reqCount); i++) {
      const [reqId, amount, purpose, approved, rejected] = await contract.getFundRequest(id, i);
      utilization.push({
        id: Number(reqId),
        index: i, // use this for approve/reject calls if reqId doesn't match the array index
        title: purpose,
        amount: Number(ethers.formatEther(amount)),
        approved,
        rejected,
        status: approved ? "Approved" : rejected ? "Rejected" : "Pending"
      });
    }

    return {
      id: Number(c.id),
      name: c.title,
      description: c.description,
      goal: Number(ethers.formatEther(c.goal)),
      raised: Number(ethers.formatEther(c.amountRaised)),
      used: Number(ethers.formatEther(c.amountUtilized)),
      organizer: c.organizer,
      active: c.active,
      utilization
    };
  } catch (err) {
    console.error(err);
    showLoadError("Couldn't load this campaign — check your wallet is connected to Sepolia.");
    return null;
  }
}

async function isAdmin() {
  if (!contract || !signer) return false;
  try {
    const adminAddr = await contract.admin();
    const myAddr = await signer.getAddress();
    return adminAddr.toLowerCase() === myAddr.toLowerCase();
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ---- Write functions ----

async function donateToCampaign(id, amountEth) {
  if (!contract) { alert("Connect your wallet first!"); return null; }
  try {
    const tx = await contract.donate(id, { value: ethers.parseEther(amountEth.toString()) });
    await tx.wait();
    return await getCampaignById(id);
  } catch (err) {
    console.error(err);
    alert("Donation failed: " + (err.reason || err.message));
    return null;
  }
}

async function createCampaignOnChain(title, description, goalEth, organizerAddress) {
  if (!contract) { alert("Connect your wallet first!"); return false; }
  try {
    const tx = await contract.createCampaign(
      title,
      description,
      ethers.parseEther(goalEth.toString()),
      organizerAddress
    );
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    alert("Failed to create campaign: " + (err.reason || err.message));
    return false;
  }
}

async function requestFunds(campaignId, amountEth, purpose) {
  if (!contract) { alert("Connect your wallet first!"); return false; }
  try {
    const tx = await contract.requestFunds(campaignId, ethers.parseEther(amountEth.toString()), purpose);
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    alert("Request failed: " + (err.reason || err.message));
    return false;
  }
}

async function approveFundRequest(campaignId, requestId) {
  if (!contract) { alert("Connect your wallet first!"); return false; }
  try {
    const tx = await contract.approveRequest(campaignId, requestId);
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    alert("Approval failed: " + (err.reason || err.message));
    return false;
  }
}

async function rejectFundRequest(campaignId, requestId) {
  if (!contract) { alert("Connect your wallet first!"); return false; }
  try {
    const tx = await contract.rejectRequest(campaignId, requestId);
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    alert("Rejection failed: " + (err.reason || err.message));
    return false;
  }
}