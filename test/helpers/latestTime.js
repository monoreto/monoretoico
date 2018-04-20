export default function latestTime () {
  return web3.eth.getBlock('latest').timestamp;
}
