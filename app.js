// TODO: 
// equity chart, EOD csv
// websocket, research symbols

// from config.js
const apiKey = keys.apiKey;
const secretKey = keys.secretKey;
const AVKey = keys.alphaVantage;

// for http requests
const baseUrl = 'https://paper-api.alpaca.markets';
const ordersUrl = `${baseUrl}/v2/orders`;
const positionsUrl = `${baseUrl}/v2/positions`;
const accountUrl = `${baseUrl}/v2/account`;
const headers = {
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': secretKey
};

// for monitor function
let toggle = "off";
let marketOpen = false;
let monitorFromWatchlist = true;

// for watchlist monitoring
let watchList = [];
let watchListCounter = 1;

// for order filtering
let recent500Orders = []; // made accessible here to keep from having to call the API over and over again
let checkedRadio = $(".orders-filters").find('input:checked').val()

// API functions
// GET functions
const getAccount = ()=>{
    $.ajax({
        method: 'GET',
        url: accountUrl,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns object
        // console.log("Get account:")
        // console.log(response)
        // console.log(response.buying_power)
        // console.log(response.equity)
        let buyingPower = parseFloat(response.buying_power).toLocaleString();
        let equity = parseFloat(response.equity).toLocaleString();
        $('.equity').html(`${equity}`)
        $('.buying-power').html(`${buyingPower}`)
    })
}

const getTradeHistory = ()=>{
    let tradeHistoryArray = []
    let tradeHistoryHtml = '<h2>Trade History</h2><p> Out of the last 500 trades, here are the sells that filled:</p>'
    $.ajax({
        method: 'GET',
        url: `${ordersUrl}?status=closed&limit=500`,
        contentType: 'application/json',
        headers: headers
    }).then((response)=>{
        console.log(response)
        response.forEach((el)=>{
            // console.log(el)
            let symbol = el.symbol
            let side = el.side
            let qty = el.filled_qty
            if (side === 'sell' && qty > 0){
                tradeHistoryArray.push(symbol)
                
            }
        })
        // function that counts # of instances of each sell side order that was filled.
        // catalogs each symbol and how many times it sold.
        function counter(arr) {
            var a = [], b = [], prev;
            
            arr.sort();
            for ( var i = 0; i < arr.length; i++ ) {
                if ( arr[i] !== prev ) {
                    a.push(arr[i]);
                    b.push(1);
                } else {
                    b[b.length-1]++;
                }
                prev = arr[i];
            }
            
            return [a, b];
        }
        let instances = counter(tradeHistoryArray)
        // array that comes back is [<symbol>, <# of sell orders fulfilled>]
        let symbols = instances[0]
        let ordersFilled = instances[1]
        for (let j = 0; j < symbols.length; j++){
            tradeHistoryHtml += `<br><p class="tradeHistoryItem"><span class="tradeHistoryButton">${symbols[j]}</span> filled ${ordersFilled[j]}.</p>`
            // we want symbols that are filling at least 8 out of the 10 orders we ping
            if (ordersFilled[j] > 8){
                watchList.push(symbols[j])
            }
        }
        $(".trade-history").html(tradeHistoryHtml)
        createWatchlist(watchList)
    }).catch((err)=>{
        console.log(err)
        return err
    })
}

const checkOrders = ()=>{
    return new Promise((resolve, reject)=>{
        $.ajax({
            method: 'GET',
            url: ordersUrl+'?limit=500',
            contentType: 'application/json',
            headers: headers
        }).then(function (response){
            // returns array of objects
            // console.log("Check Orders:")
            // console.log(response)
            recent500Orders = response
            let ordersHtml = `
                <li class="column-headers">
                    <p>Symbol</p>
                    <p>Side</p>
                    <p>Price</p>
                    <p>Shares</p>
                    <p>Cancel</p>
                </li>
            `
            response.forEach(function(el){
                let symbol = el.symbol;
                let side = el.side.toUpperCase();
                let price = el.limit_price;
                let qty = el.qty;
                let id = el.id;
                let htmlToAppend = `
                    <li class="order">
                        <span class="order-symbol">${symbol}</span>
                        <span class="order-side">${side}</span>
                        <span class="order-price">${price}</span>
                        <span class="order-shares">${qty}</span>
                        <span class="order-cancel id-${id}">X</span>
                    </li>
                `
                ordersHtml = ordersHtml + htmlToAppend;
            })
            $('.orders-list').html(ordersHtml);
            resolve(response)
        }).catch(()=>{reject("Failed to check orders.")})
        
    })
}

const filterOrders = (str)=>{
    let ordersHtml = `
    <li class="column-headers">
        <p>Symbol</p>
        <p>Side</p>
        <p>Price</p>
        <p>Shares</p>
        <p>Cancel</p>
    </li>
    `
    if(str !== 'both'){
        recent500Orders.forEach(el=>{
            let symbol = el.symbol;
            let side = el.side.toUpperCase();
            let price = el.limit_price;
            let qty = el.qty;
            let id = el.id;
            if (side === str.toUpperCase()){
                let htmlToAppend = `
                <li class="order">
                <span class="order-symbol">${symbol}</span>
                <span class="order-side">${side}</span>
                <span class="order-price">${price}</span>
                <span class="order-shares">${qty}</span>
                <span class="order-cancel id-${id}">X</span>
                </li>
                `
                ordersHtml = ordersHtml + htmlToAppend;
            }
        })
        $('.orders-list').html(ordersHtml);
    } else {
        checkOrders()
    }
}

const checkOrdersBySymbol = (str)=>{
    return new Promise((resolve, reject)=>{
        $.ajax({
            method: 'GET',
            url: ordersUrl+'?limit=500',
            contentType: 'application/json',
            headers: headers
        }).then(function (response){
            // returns array of objects
            // console.log("Check Orders:")
            // console.log(response)
            let arr= [str];
            response.forEach(function(el){
                // console.log(el)
                let symbol = el.symbol;
                // console.log(symbol)
                if (symbol === str.toUpperCase()){
                    console.log("Match!")
                    arr.push(el)
                }
            })
            resolve(arr)
            // return arr
        }).catch((err)=>{reject(err)})
    })
}

const checkPositions = ()=>{
    return new Promise((resolve, reject)=>{
        $.ajax({
            method: 'GET',
            url: positionsUrl,
            contentType: 'application/json',
            headers: headers
        }).then(function (response){
            // returns array of objects
            // console.log("Check Positions:")
            // console.log(response)
            let positionsHtml = `
            <li class="column-headers">
                <p>Symbol</p>
                <p>Price</p>
                <p>Shares</p>
                <p>Profit/Loss</p>
                <p>Close</p>
            </li>`
            response.forEach(function(el){
                let assetId = el.asset_id;
                let symbol = el.symbol;
                let price = el.current_price;
                let shares = el.qty;
                let profitLoss = el.unrealized_pl;
                if (parseFloat(profitLoss) > 50 && marketOpen === true){
                    deleteOrdersBySymbol(symbol)
                    sleep(1000).then(()=>{
                        sellPositionBySymbol(symbol)
                    })
                } else {
                    let htmlToAppend = `
                <li class="position">
                    <span class="position-symbol">${symbol}</span>
                    <span class="position-price">${price}</span>
                    <span class="position-shares">${shares}</span>
                    <span class="position-pl">${profitLoss}</span>
                    <span class="position-cancel id-${assetId}">X</span>
                </li>
                `
                positionsHtml = positionsHtml + htmlToAppend;
                }
            })
            $('.positions-list').html(positionsHtml);
            resolve(response) ;
        }).catch((err)=>{
            console.log(err)
            reject(err)
        })
    })
}

const checkPositionsBySymbol = (symbol)=>{
    return new Promise(resolve=>{
            $.ajax({
                method: 'GET',
                url: `${positionsUrl}/${symbol.toUpperCase()}`,
                contentType: 'application/json',
                processData: false,
                headers: headers
            }).then(function (response){
                // returns object
                console.log("Check Positions by Symbol:")
                console.log(response)
                resolve(response) 
            }).catch(function(err){
                console.log(err)
                if (err.status === 404){
                    $(".status-msg").html("Position does not exist.").addClass("red-text")
                }
                return err
            })
    })
}

// POST functions
const createOrder = (arr)=>{
    arr.forEach((el)=>{
        let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${el}&apikey=${AVKey}`
        $.ajax({
            method: 'GET',
            url: url,
            contentType: 'application/json',
            dataType: 'json'
        }).then(function(response){
            console.log(response["Global Quote"]["05. price"]);
            let firstOrderPrice = response["Global Quote"]["05. price"];
            // if we are selling, add a little to current price before starting the process,
            // else if we are buying, just use current price.
            let workingPrice = parseFloat(firstOrderPrice);
            let data = {
                'symbol': el,
                'qty': 100,
                'side': "buy",
                'type': "limit",
                'time_in_force': "gtc",
                "limit_price": workingPrice.toString()
            }
            $.ajax({
                method: 'POST',
                url: `${ordersUrl}`,
                contentType: 'application/json',
                dataType: 'json',
                processData: false,
                data: JSON.stringify(data),
                headers: headers
            }).then(function (response){
                // returns object
                console.log("Create Orders:")
                console.log(response)
                for (let x=0;x<9;x+=1){
                    let price1 = workingPrice;
                    price1 = price1-(0.01*x)
                    createBuyLimits(el, price1.toString());
                }
                pageLoad();
            })
        }).catch((err)=>{
            console.log(err)
            return err
        })
    })
}

const createBuyLimits = (sym, price)=>{
    let symbol = sym.toUpperCase();
    let data = {
        'symbol': symbol,
        'qty': 100,
        'side': "buy",
        'type': "limit",
        'time_in_force': "gtc",
        'limit_price': price
    }
    
    // console.log(data)
    
    $.ajax({
        method: 'POST',
        url: `${ordersUrl}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns object
        console.log("Create Buys:")
        console.log(response)
    })
}

const createSellLimits = (sym, price)=>{
    let symbol = sym.toUpperCase();
        
    let data = {
        'symbol': symbol,
        'qty': 100,
        'side': "sell",
        'type': "limit",
        'time_in_force': "gtc",
        'limit_price': price
    }
    
    // console.log(data)
    
    $.ajax({
        method: 'POST',
        url: `${ordersUrl}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns object
        console.log("Create sells:")
        console.log(response.symbol)
    })
}

// PATCH functions
const updateOrder = (orderId, sym, shares, side, tradeType, timeInForce)=>{
    let symbol = sym.toUpperCase();
    
    data = {
        'symbol': symbol,
        'qty': shares,
        'side': side,
        'type': tradeType,
        'time_in_force': timeInForce
    }
    
    $.ajax({
        method: 'PATCH',
        url: `${ordersUrl}/${orderId}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns ???
        console.log("Patch order:")
        console.log(response)
    })
}

// DELETE functions
const deleteAllOrders = ()=>{
    $.ajax({
        method: 'DELETE',
        url: `${ordersUrl}`,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns ???
        // console.log("Delete All Orders:")
        // console.log(response)
        pageLoad();
    })
}

const deleteOrdersBySymbol = (sym)=>{
    //construct promise so function runs in correct order
    let symbolsPromise = (str)=>{
        let arr = []
        arr.push(checkOrdersBySymbol(str.toUpperCase()))
        return Promise.all(arr)
    }

    symbolsPromise(sym.toUpperCase())
    .then((response)=>{
        console.log(response)
        for (let i = 1; i < response.length; i++){
            deleteOrderById(response[i].id)
        }
    })
    .catch(err=>{console.log(err)})
}

const deleteOrderById = (orderId)=>{
    let data = {
        orderId
    }
    $.ajax({
        method: 'DELETE',
        url: `${ordersUrl}/${orderId}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns ???
        console.log("Delete Order by ID:")
        console.log(response)
        pageLoad();
    })
}

const sellAllPositions = ()=>{
    $.ajax({
        method: 'DELETE',
        url: `${positionsUrl}`,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns ???
        // console.log("Sell All Positions:")
        // console.log(response)
        pageLoad();
    })
}

const sellPositionBySymbol = (symbol)=>{
    let data = {
        symbol
    }
    $.ajax({
        method: 'DELETE',
        url: `${positionsUrl}/${symbol}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns ???
        console.log("Sell Position by ID:")
        console.log(response)
        pageLoad();
    }).catch((err)=>{
        console.log(err)
        pageLoad();
        return err
    })
}

// non-API functions
const pageLoad = ()=>{
    getAccount();
    filterOrders(checkedRadio);
    checkPositions();
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const timeStamper = ()=>{
    const d = Date.now();
    let timeCalc = new Date(d)
    let day = timeCalc.getDay();
    switch(day){
        case 0:
            day = "Sunday"
            break;
        case 1:
            day = "Monday"
            break;
        case 2:
            day = "Tuesday"
            break;
        case 3:
            day = "Wednesday"
            break;
        case 4:
            day = "Thursday"
            break;
        case 5:
            day = "Friday"
            break;
        case 6:
            day = "Saturday"
            break;
        default:
            day = "Today"
    }
    let Hh = timeCalc.getHours();
    let minutes= timeCalc.getMinutes();
    let secs = timeCalc.getSeconds();
    console.log("Time calc:")
    console.log(`${day}, ${Hh}:${minutes}:${secs}`)
    let timeData = {
        timeString: `${day}, ${Hh}:${minutes}:${secs}`,
        timeArray: [day, Hh, minutes, secs]
    }
    console.log(timeData)
    return timeData
}

const marketOpenCheck = ()=>{
    const timeCheck = timeStamper();
    console.log(timeCheck)
    let timeString = timeCheck.timeString
    let day = timeCheck.timeArray[0]
    let hour = timeCheck.timeArray[1]
    let minute = timeCheck.timeArray[2]
    let sec = timeCheck.timeArray[3]
    console.log(timeString)
    // check day
    if(day === "Saturday" || day === "Sunday"){
        marketOpen = false;
        $(".status-msg").html("<h1>Market is Closed today!</h1>")
        // check every 6 hours to see what day it is
        setTimeout(marketOpenCheck, 2.16e7)
        // if day is ok, check the time every minute
    } else {
        if (hour >= 8 && hour < 15){
            // for 8 am, minutes needs to be 30 or higher
            // doesn't matter the rest of the time
            if (hour === 8 && minute >= 30){
                marketOpen = true;
                monitor(toggle)
            } else {
                marketOpen = true;
                monitor(toggle)
            }
        } else {
            marketOpen = false;
            monitor("off")
            $(".status-msg").html("<h1>Market is Closed right now!</h1>")
            sleep(60000).then(()=>{
                marketOpenCheck()
            })
        }
    }
}

let timeoutId;
const monitorCheckPositions = ()=>{
    let rateLimiter = 0;
    checkPositions().then((response)=>{
        if (response.length === "0"){
            console.log("No orders found. Try again in 3 seconds...")
            sleep(3000).then(()=>{monitor(toggle)})
            return false
        } else {
            console.log("Monitor positions:")
            console.log(response)
            response.forEach((el)=>{
                let shares = el.qty;
                let symbol = el.symbol;
                let minSalePrice = el.avg_entry_price; 
                let numOfOrders = Math.abs(Math.round(shares / 100) );
                // to prevent massive amounts of short orders,
                // immediately cancel orders with negative shares
                if(shares < 0){
                    deleteOrdersBySymbol(symbol)
                    sleep(1000).then(()=>{
                        sellPositionBySymbol(symbol)
                    })
                } else {
                    rateLimiter += numOfOrders;
                    console.log("num of orders:")
                    console.log(numOfOrders)
                    let x = 1
                    while (x < numOfOrders) {
                        minSalePrice = (parseFloat(minSalePrice)+(0.01*x)).toString()   
                        createSellLimits(symbol, minSalePrice)
                        x+=1
                    }
                }
            })
            pageLoad();
            // alpaca has a 200 requests per min limit, 
            // so this forces us to respect that
            // to keep the calls from failing
            let waitTime = Math.round(2000+(1000*(rateLimiter/2.7)))
            console.log("Checking again in "+ waitTime/1000 + " secs...")
            timeoutId = setTimeout(marketOpenCheck, waitTime)
        }
    })
}

const monitorCheckWatchlist = ()=>{
    console.log("Watchlist:")
    console.log(watchList)

    // watchlist symbols are high quality because they have sold at least 
    // 7 times in the past 500 trades. so we scan it...
    let matchWatchlistToOrders = ()=>{
        let arr = []
        for (let symbol of watchList){
            arr.push(checkOrdersBySymbol(symbol))
        }
        return Promise.all(arr)
    }    
    
    // to see if there are ANY orders, buy or sell, that exist for those symbols
    matchWatchlistToOrders().then((response)=>{
        console.log(response)
        response.forEach((el)=>{
            // if there are, we'll make sure there's at least 
            // 10 orders out there by adding some buy orders
            console.log(el)
            if (el.length > 1 && el.length< 6){
                // if there are some but less than 10, we'll go ahead and fill that difference to 10
                for (let i = 1; i<=10-el.length; i++){
                    // console.log(i)
                    sleep(1000).then(()=>{
                        createBuyLimits(el[0], (parseFloat(el[el.length-1].limit_price)-0.01*i).toString())
                    })
                }
                // if there are no orders, but the symbol is on the watchlist,
                // then go out and create some buy orders
            } else if (el.length === 1){
                console.log(el)
                sleep(1000).then(()=>{
                    createOrder(el)
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
    })
}

const monitor = (status)=>{
    if (status === "on"){
        // first check open positions and create sell orders if needed
        monitorCheckPositions();
        // then check watchlist and open buy orders if there aren't any open now
        if (monitorFromWatchlist){
            console.log("Checking watchlist...")
            monitorCheckWatchlist();
        } else {
            console.log("Not Checking watchlist.")
        }
    } else if (status === "off"){
        clearTimeout(timeoutId)
        return false
    }
}

const streamTrades = (status)=>{
    let socket;
    if (status === 'on'){
        socket = new WebSocket("wss://paper-api.alpaca.markets/stream/")
        
        let subscribeData = {
            "action": "listen",
            "data": {
                "streams": ["trade_updates", "account_updates"]
            }
        }
        
        let authData = {
            "action": "authenticate",
            "data": {
                "key_id": apiKey,
                "secret_key": secretKey
            }
        }
        
        socket.onopen = function(event) {
            console.log(event)
            socket.send(authData)
            socket.send(subscribeData)
            console.log("Sent authData!")
        };
        
        socket.onmessage = function(msg) {
            console.log(msg)
            let stream = msg.stream
            let data = msg.data
            switch(stream){
                // recieve account updates
                case "account_updates":
                    console.log("Received account updates:")
                    console.log(data)
                    break;
                // recieve trade updates
                case "trade_updates":
                    console.log("Received trade updates:")
                    console.log(data)
                    break;
                // in case it sends a msg with both???
                case ["trade_updates", "account_updates"] || ["account_updates", "trade_updates"]:
                    console.log("Received multiple types of updates:")
                    console.log(data)
                    break;
                // confirm subscription to data stream
                case "listening":
                    console.log("Watching for trade and account updates...")
                    console.log(data)
                    break;
                // auth
                case "authorization":
                    console.log("Auth status:")
                    console.log(data.status)
                    // if auth is ok, subscribe to trade updates and account updates
                    if (data.status === "authorized"){
                        socket.send(subscribeData)
                    }
                    // else try to login a few times, and if those fail, close the socket
                    else {
                        let x = 0
                        if (x<3){
                            while (x<3){
                                socket.send(authData)
                                x+=1
                            }
                        } else {
                            console.log("Socket closed: could not authorize.")
                            socket.close()
                        }
                    }
                    break;
                default:
                    console.log("Unrecognized message.")
            }
        };
        
        socket.onerror = function(err){
            console.log("There was an error:")
            console.log(err)
            socket.close()
        }
        
        socket.onclose = function(msg){
            console.log("Closed the socket.")
            console.log(msg)
        }
    } else if (status === "off"){
        socket.close()
    }
}

const createWatchlist = (arr)=>{
    console.group(watchList)
    $(".watchlist").html(`
        <h2>Watchlist (${watchList.length} items)</h2>
        <ul class="list-of-symbols">
            <li class="column-headers">
                <p>Symbol</p>
                <p>1D Ago</p>
                <p>7D Ago</p>
                <p>14D Ago</p>
                <p>28D Ago</p>
                <p>Remove</p>
            </li>
        </ul>
    `)
    if (watchList.length > 5){
        var i = 0;                     //  set your counter to 0

        function watchLoop () {           //  create a loop function
            setTimeout(function () {    //  call a 3s setTimeout when the loop is called
                getWatchlist(arr[i]);          //  your code here
                i++;                     //  increment the counter
                if (i < watchList.length) {            //  if the counter < 10, call the loop function
                    watchLoop();             //  ..  again which will trigger another 
                }                        //  ..  setTimeout()
            }, 12000)
        }

        watchLoop()
    } else {
        watchList.forEach((el)=>{
            getWatchlist(el)
        })
    }
    

    // watchList.forEach((el)=>{
    //     getWatchlist(el)
    // })

    return null
    
}

const getWatchlist = (str)=>{
    let dynamicHtml;
    let x = 1;
    let el7d, el14d, el28d, current;
    let high, low, open, close;
    $.ajax({
        method: 'GET',
        url: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${str}&apikey=${AVKey}`,
        // contentType: 'application/json',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        dataType: 'json'
    }).then((response)=>{
        let timeSeries = Object.entries(response['Time Series (Daily)'])
        timeSeries.forEach(stock=>{
            high = parseFloat(stock[1]["2. high"])
            low = parseFloat(stock[1]["3. low"])
            open = parseFloat(stock[1]["1. open"])
            close = parseFloat(stock[1]["4. close"])
            let avg = (high + low + open + close) / 4
            avg = avg.toFixed(2)
            console.log(`${str} had an avg of ${avg} ${x} day(s) ago.`)
            switch(x){
                case 1:
                    current = avg
                    break;
                case 7:
                    el7d = avg;
                    break;
                case 14:
                    el14d = avg;
                    break;
                case 28:
                    el28d = avg;
                    break;
                default:
                    break;
            }
            dynamicHtml = `<li class="watch-item"><span class="watch-symbol">${watchListCounter}. ${str}</span>`
            dynamicHtml += `<span class="watch-price">${current}</span>`
            dynamicHtml += `<span class="watch-7d">${el7d}</span>`
            dynamicHtml += `<span class="watch-14d">${el14d}</span>`
            dynamicHtml += `<span class="watch-28d">${el28d}</span>`
            dynamicHtml += `<span class="watch-remove">X</span></li>`
            // console.log(dynamicHtml)
            x++
        })
        watchListCounter++
        renderWatchlist(dynamicHtml)
    }).catch(err=>{
        console.log(err)
    })
}

const renderWatchlist = (html)=>{
    $(".list-of-symbols").append(`${html}`)
}

// App logic & interaction
// create buy orders
$(document).on("click", ".new-ping", function(){
    $(".buttons").html(`
        <h2>Create a new Ping</h2>
        <label for="ping-symbol">Symbol:<br>
            <p>MAX: 4 symbols. Separate multiple symbols with commas.</p>
            <input autofocus type="text" name="ping-symbol" id="ping-symbol" autocomplete="off">
        </label> 
        <button class="submit-ping">Create</button>
        <button class="cancel-ping">Cancel</button>
    `)
    
    $("#ping-symbol").focus();
    
    $(".submit-ping").on("click", function(){
        let symbol = $("#ping-symbol").val().toUpperCase().replace(/\s/g, "");
        let arr = symbol.split(',')
        // watchList.push(symbol);
        // renderWatchlist();
        if (arr){
            $(".status-msg").html(`
            Ping Created for ${symbol}.
            `)
            $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
            createOrder(arr)
        }
        else {
            $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
            $(".status-msg").html(`
                No New Pings Created.
            `)
        }
    })
    
    $(".cancel-ping").on("click", function(){
        $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
        $(".status-msg").html(`
            No New Pings Created.
        `)
    })
})

$(document).on("click", ".clear-pending", function(){
    deleteAllOrders();
})

$(document).on("click", ".clear-pending-symbol", function(){
    $(".buttons").html(`
        <h2>Delete Orders by Symbol</h2>
        <label for="delete-symbol">Symbol:<br>
            <p>Separate multiple symbols with commas.</p>
            <input autofocus type="text" name="delete-symbol" id="delete-symbol" autocomplete="off">
        </label> 
        <button class="submit-delete">Delete</button>
        <button class="cancel-delete">Cancel</button>
    `)
    
    $("#delete-symbol").focus();
    
    $(".submit-delete").on("click", function(){
        let symbol = $("#delete-symbol").val().toUpperCase().replace(/\s/g, "");
        let arr = symbol.split(',')
        // watchList.push(symbol);
        // renderWatchlist();
        if (arr){
            $(".status-msg").html(`
            Deleting all orders for ${symbol}.
            `)
            $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
            arr.forEach((el)=>{
                deleteOrdersBySymbol(el)
            })
        }
        else {
            $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
            $(".status-msg").html(`
                No Orders Deleted.
            `)
        }
    })
    
    $(".cancel-delete").on("click", function(){
        $(".buttons").html(`
        <h2>Controls</h2>
                <div class="monitor-buttons">
                    <button class="toggle-monitor">Toggle Monitor</button>
                    <label class="watchlist-checkbox" for="monitor-from-watchlist"><input type="checkbox" name="monitor-from-watchlist" id="monitor-from-watchlist" checked> - Monitor from watchlist?</label>
                </div>
                <button class="new-ping">New Ping</button>
                <button class="clear-pending">Clear Pending Orders</button>
                <button class="clear-pending-symbol">Delete All Orders by Symbol</button>
        `)
        $(".status-msg").html(`
            No Orders Deleted.
        `)
    })
})

$(document).on("click", ".refresh", function(){
    pageLoad();
})

$(document).on("click", ".position-cancel", function(e){
    let symbol = e.target.parentNode.children[0].innerText
    console.log(symbol)
    deleteOrdersBySymbol(symbol);
    sleep(100).then(()=>{
        sellPositionBySymbol(symbol);
        sleep(100).then(()=>{
            pageLoad()
        })
    })
})

$(document).on("click", ".order-cancel", function(e){
    let idString = e.target.classList[1]
    let slicedId = idString.replace("id-", '')
    console.log(slicedId)
    deleteOrderById(slicedId)
    sleep(100).then(()=>{
        pageLoad()
    })
})

$(document).on("click", ".tradeHistoryButton", function(e){
    let text = e.currentTarget.innerText
    let check = watchList.includes(text)
    console.log(check)
    if (check === false){
        watchList.push(text)
        createWatchlist(watchList)
    }
})

$(document).on("click", ".watch-remove", function(e){
    let text = e.currentTarget.parentNode.firstElementChild.innerText
    let query = watchList.indexOf(text)
    watchList.splice(query, 1)
    createWatchlist(watchList)
})

$(document).on("click", ".toggle-monitor", function(){
    //     if(toggle === "off"){
    //         streamTrades("on");
    //         toggle = "on";
    //         $(".status-msg").html("<h1>Monitor Initiated. Don't close or refresh the window. Just... don't touch anything. ANYTHING.")
    //     } else if (toggle === "on"){
    //         streamTrades("off");
    //         toggle = "off"
    //         $(".status-msg").html("<h1>Monitor paused. Click that same button again to resume.</h1>")
    //     }
    if(toggle === "off"){
        toggle = "on";
        marketOpenCheck();
        $(".status-msg").html("<h1>Monitor Initiated. Don't close or refresh the window. Just... don't touch anything. ANYTHING.")
    } else if (toggle === "on"){
        toggle = "off"
        marketOpenCheck();
        $(".status-msg").html("<h1>Monitor paused. Click that same button again to resume.</h1>")
    }
})

$(".research-query").on("submit", (e)=>{
    e.preventDefault();
    let symbol = $("#symbol-query").val().toUpperCase().replace(/\s/g, "");
    let arr = symbol.split(',')
    
    // always reload the form and header part
    $("#research").html(`
    <h2>Research</h2>
    <form class="research-query" action="#" method="post">
        <label for="symbol-query">Symbol to Research:</label>
        <br>
        <br>
        <p>You can separate multiple symbols by commas.</p>
        <br>
        <input type="text" name="symbol-query" id="symbol-query">
        <input type="submit" value="Submit">
    </form>`)

    const ajaxCall = (string)=>{
        let researchToAppend;
        let url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${string.toUpperCase()}&apikey=${AVKey}`
        $.ajax({
            method: 'GET',
            url: url,
            // contentType: 'application/json',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            dataType: 'json'
        }).then((response)=>{
            console.log(response["Time Series (Daily)"])
            // returns object of objects where keys are dates, so they
            // are dynamic. Need to loop through them and display the date,
            // each data point, and a chart with the symbol on top
            let researchArray = Object.entries(response["Time Series (Daily)"])
            for (let day of researchArray){
                console.log(day)
                let date = day[0]
                let open = day[1]["1. open"]
                let high = day[1]["2. high"]
                let low = day[1]["3. low"]
                let close = day[1]["4. close"]
                let volume = day[1]["5. volume"]
                console.log(typeof(open))
                researchToAppend = `<br>
                <p>For ${string.toUpperCase()} on ${date}, here were the stats:</p>
                <p>open: ${open}</p>
                <p>high: ${high}</p>
                <p>low: ${low}</p>
                <p>close: ${close}</p>
                <p>volume: ${volume}</p>
                <svg class="date-${date}"></svg>
                `
                // append actual research to research section
                $("#research").append(researchToAppend)
                // create graph in the above svg element
                createBarGraph(date, open, high, low, close)
            }
        })
    }

    const createBarGraph = (date, open, high, low, close)=>{
        // everything passed in is a string, so turn them all into numbers first
        let openNum = parseFloat(open)
        let highNum = parseFloat(high)
        let lowNum = parseFloat(low)
        let closeNum = parseFloat(close)
        let dataSet = [openNum, highNum, lowNum, closeNum];
        // setup chart
        const graph = d3.select(`.date-${date}`)
                        .attr("width", 500)
                        .attr('height', 100);
        // bind data
        const bars = graph.selectAll('rect')
                          .data(dataSet)
                          .enter()
                          .append('rect');
        // style graph
        bars.attr("x", (d, i) => 75 + i * 100)
            .attr("y", (d, i) => 100 - 3 * d)
            .attr("width", 40)
            .attr("height", (d, i) => 3 * d)
            .attr('fill', '#5FCF80')
       
        // add labels
        bars.selectAll("text")
            .data(dataSet)
            .enter()
            .append("text")
            .text((d) => d.toFixed())
            .attr("x", (d, i) => 75 + i * 100)
            .attr("y", (d, i) => 100 - (3 * d) - 10)
    }

    arr.forEach((el)=>{
        ajaxCall(el)
    })
    
})

// filters for order section
$("input[type='radio']").on("change", (e)=>{
    console.log(e)
    checkedRadio = $(".orders-filters").find('input:checked').val()
    console.log(checkedRadio)
    filterOrders(checkedRadio)
})

$( "input[type=checkbox]" ).on( "change", (e)=>{
    monitorFromWatchlist = e.target.checked
})

pageLoad();
getTradeHistory();