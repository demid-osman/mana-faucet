import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Mana, Row, Button, Blockie, Address, Hero } from 'decentraland-ui'
import abi from './abi/faucet.json'
import { convertToBalance, secondsToHms } from './utils/functions'
import { FAUCET_ADDRESS } from './utils/config'

function App() {
  const [manaAmount, setManaAmount] = useState(0)
  const [cooldown, setCooldown] = useState()
  const [chainId, setChainId] = useState()
  const [connectBtnDisabled, setConnectBtnDisabled] = useState(false)
  const [getBtnDisabled, setGetBtnDisabled] = useState(true)
  const [address, setAddress] = useState('')
  const [signer, setSigner] = useState()
  const [txData, setTxData] = useState()
  const [manaBalance, setManaBalance] = useState(0)
  const [faucetBalance, setFaucetBalance] = useState(0)

  const infoStyles = { paddingBottom: 5 }

  useEffect(() => {
    getCurrentWalletConnected()
    addWalletListener()
  }, [address])

  async function requestMana() {
    try {
      const contract = new ethers.Contract(FAUCET_ADDRESS, abi, signer)
      
      const resp = await contract.requestMana()
      console.log(resp)
      setTxData(resp.hash)
    } catch (error) {
      console.log('ERROR', error)
      alert(error)
    }
  }

  async function connectWallet() {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const { chainId } = await provider.getNetwork()
        setChainId(chainId)
        if (chainId != 5) {
          setConnectBtnDisabled(true)
        } else {
          setConnectBtnDisabled(false)
          const accounts = await provider.send("eth_requestAccounts", []);
          setSigner(provider.getSigner());
          setAddress(accounts[0]);
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      alert("Please install MetaMask")
      console.log("Please install MetaMask")
    }
  }

  async function getCurrentWalletConnected() {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const { chainId } = await provider.getNetwork()
        setChainId(chainId)
        if (chainId != 5) {
          setConnectBtnDisabled(true)
          setGetBtnDisabled(true)
        } else {
          const accounts = await provider.send("eth_accounts", [])
          if (accounts.length > 0) {
            setSigner(provider.getSigner())
            setAddress(accounts[0])

            // Faucet info:
            let contract = new ethers.Contract(FAUCET_ADDRESS, abi, provider)
            let amount = await contract.amount()
            amount = ethers.utils.formatEther(amount)
            setManaAmount(convertToBalance(amount))

            let cooldown = await contract.cooldown()
            cooldown = parseInt(cooldown._hex, 16)
            cooldown = secondsToHms(cooldown)
            setCooldown(cooldown)
        
            let balance = await contract.manaBalance()
            balance = ethers.utils.formatEther(balance)
            setFaucetBalance(convertToBalance(balance))
        
            let userBalance = await contract.manaBalanceOf(accounts[0])
            userBalance = ethers.utils.formatEther(userBalance)
            setManaBalance(convertToBalance(userBalance))

            setConnectBtnDisabled(true)
            setGetBtnDisabled(false)
          } else {
            console.log("Connect to MetaMask using the Connect Wallet button")
          }
        }
      } catch (err) {
        console.error(err.message)
      }
    } else {
      alert("Please install MetaMask")
      console.log("Please install MetaMask")
    }
  };

  function addWalletListener() {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length != 0) {
          setAddress(accounts[0])
        } else {
          setConnectBtnDisabled(false)
          setGetBtnDisabled(true)
          setAddress('')
          setManaBalance(0)
          setTxData(null)
        }
      })
      window.ethereum.on("chainChanged", (chainId) => {
        setChainId(chainId)
        if (chainId != "0x5") {
          console.log('chainId != goerli')
          setConnectBtnDisabled(true)
          setGetBtnDisabled(true)
          setChainId(0)
          setTxData(null)
        } else {
          if (!address) {
            setConnectBtnDisabled(false)
            setGetBtnDisabled(true)
          } else {
            setConnectBtnDisabled(true)
            setGetBtnDisabled(false)
          }
          setChainId(5)
        }
      })
    } else {
      alert("Please install MetaMask")
      console.log("Please install MetaMask");
    }
  }

  return (
    <>
      <div className="dcl navbar" role="navigation">
        <div className="ui container">
          <div className="dcl navbar-menu">
            <div className="ui secondary stackable menu">
              <a target='_blank' className="dcl navbar-logo" href="https://decentraland.org"><i className="dcl logo"></i></a>
              <a target='_blank' href="https://demid.gitbook.io/mana-faucet/" className="item"><span>Documentation</span></a>
              <a target='_blank' href="https://github.com/demid-osman/mana-faucet" className="item"><span>Repository</span></a>
              <a target='_blank' href="https://github.com/demid-osman" className="item"><span>Developer</span></a>
            </div>
          </div>
          <div className="dcl navbar-account">
            <span className="dcl account-wrapper ">
              <div className="ui small header dcl mana">
                <Mana size='large'>{manaBalance}</Mana>
                {address ? 
                <a target='_blank' href={`https://goerli.etherscan.io/address/${address}`}>
                <Blockie seed={address}>
                  <Address value={address}></Address>
                </Blockie>
                </a>
                :
                <Blockie seed={address}>
                  <Address value={address}></Address>
                </Blockie>
                }
              </div>
            </span>
          </div>
        </div>
      </div>

      <div className='dcl page'>
        <div className='ui container'>
        <Hero centered>
              <Hero.Header>Decentraland MANA faucet</Hero.Header>
              <Hero.Description>
                You can request <Mana size='medium'>{manaAmount}</Mana> per {cooldown}
              </Hero.Description>
            </Hero>
          <div className='ui segment'>
            <div className='ui medium header'>Faucet info:</div>
            <div className="ui sub" style={infoStyles}>Contract: <a target={'_blank'} href={`https://goerli.etherscan.io/address/${FAUCET_ADDRESS}`}>{FAUCET_ADDRESS}</a></div>
            <div className="ui sub" style={infoStyles}>Network: Goerli</div>
            <div className="ui sub" style={infoStyles}>Balance: <Mana size='small'>{faucetBalance}</Mana></div>
            <div className='ui' style={{ marginTop: 20 }}>
            <Row>
                <Button primary disabled={connectBtnDisabled} onClick={connectWallet}>{chainId != 5 ? 'Switch network' : address ? 'Wallet connected' : 'Connect wallet'}</Button>
                <Button primary disabled={getBtnDisabled} onClick={requestMana}>Request mana</Button>
            </Row>
            { txData && address ? 
            <p style={{ marginTop: 20 }}>
              <a target='_blank' href={`https://goerli.etherscan.io/address/${FAUCET_ADDRESS}`}>Faucet</a>  transfered <Mana inline>{convertToBalance(manaAmount)}</Mana> to{' '}
              <a target='_blank' href={`https://goerli.etherscan.io/address/${address}`}>
                <Blockie scale={3} seed={address}>
                  <Address value={address} />
                </Blockie>
              </a> {' '}
              in  <a target='_blank' href={`https://goerli.etherscan.io/tx/${txData}`}>transaction</a> 
            </p>
            :
            null
          }
            </div>
          </div>
          <Hero centered>
            <Hero.Description>Created by <a target='_blank' href='https://github.com/demid-osman'>Demid</a> for community</Hero.Description>
          </Hero>
        </div>
      </div>
    </>
  )
}

export default App