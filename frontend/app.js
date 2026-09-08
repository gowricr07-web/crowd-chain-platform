// Tomorrow: Replace dummy functions with ethers.js logic
let provider;
let signer;
let contract;

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const contractABI = [ /* Solidity ABI pasted here */ ];

async function initWeb3() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
  } else {
    alert("Please install MetaMask!");
  }
}