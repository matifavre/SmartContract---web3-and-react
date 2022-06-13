import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {contractABI, contractAddress} from '../utils/constants'

export const TransactionContext = React.createContext();

// accessing metamask
const {ethereum} = window;

//Fetch Ethereum contract
// Address, ABI and Signer

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress,contractABI,signer);
    
    return transactionContract;
    
}

export const TransactionProvider = ({children})=>{
    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData] = useState({addressTo:'',amount:'',key:'',message:''});
    const [isLoading,setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount')); // LocalStorage since if we initiliaze at 0 its going to reset
    const [transactions, setTransactions] = useState([])

    const handleChange = (e,name)=>{
    // callback function + dynamically generate through target 
    setFormData((prevState)=>({...prevState,[name]:e.target.value}))
    }


    const getAllTransactions = async () => {
        try {
            if(!ethereum) return alert("Please install metamask");
            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            
            const structuredTransactions = availableTransactions.map((transaction)=>({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() *1000).toLocaleString(),
                message: transaction.message,
                key: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10**18) // > we multiply by 10**18 in order to get GWEI

            }))
            console.log(structuredTransactions);
            setTransactions(structuredTransactions);
        } catch (error) {
            console.log(error);
        }
    }

    // Checks if the wallet is connected to the account
    const checkIfWalletIsConnected = async ()=>{
    
        try {
            if(!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({method:'eth_accounts'})
            
            if(accounts.length){
                setCurrentAccount(accounts[0]);
                getAllTransactions();
            }else{
                console.log('No accounts found');
            }
            
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object")
        }
    
    }

    const checkIfTransactionsExist = async ()=>{
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();
            window.localStorage.setItem("transactionCount", transactionCount)
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object")
        }
    }

    
    // function for connecting the account
    const connectWallet = async ()=>{
        try {
            if(!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({method:'eth_requestAccounts'})
            
            setCurrentAccount(accounts[0]);//Connects the first account (therefor starts with 0)
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object")
        }
    }
    
    // Logic for sending and storing transactions
    const sendTransaction = async ()=>{
    try {
        if(!ethereum) return alert("Please install metamask");
        //Get Data from the form (Welcome)
        const {addressTo,amount,keyword,message} = formData;
        const transactionContract = getEthereumContract();
        //convert the decimal amount into GWEI
        const parsedAmount = ethers.utils.parseEther(amount);

        // Send Eth from account to another
        await ethereum.request({
            method:'eth_sendTransaction',
            params:[{
                from: currentAccount,
                to: addressTo,
                gas: '0x5208',// all values are written in hexadecimals = 21000 GWEI
                value: parsedAmount._hex //._hex > calls the parsed functionality in the Ether lib
            }]
        });

        // Store the transactions
        const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
        
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`)
        await transactionHash.wait();// waits for the transacton to be finished
        setIsLoading(false);
        console.log(`Success - ${transactionHash.hash}`)
        await transactionHash.wait();

        const transactionCount = await transactionContract.getTransactionCount();
        setTransactionCount(transactionCount.toNumber());
        window.reload();
    } catch (error) {
        console.log(error)
        throw new Error("No ethereum object")
    }
    }

    useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
    }, []);
    
    return(
        <TransactionContext.Provider value={{
            transactionCount,
            connectWallet,
            transactions,
            currentAccount,
            isLoading,
            sendTransaction,
            handleChange,
            formData,
            }}>
        {children}
        </TransactionContext.Provider>
    )
}