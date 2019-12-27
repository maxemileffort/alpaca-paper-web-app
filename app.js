// TODO: 
// research tab, tab behavior, 
// intervals to check orders to re-ping and re-pong,
// 

const apiKey = keys.apiKey;
const secretKey = keys.secretKey;
const AVKey = keys.alphaVantage;

const baseUrl = 'https://paper-api.alpaca.markets';
const ordersUrl = `${baseUrl}/v2/orders`;
const positionsUrl = `${baseUrl}/v2/positions`;
const accountUrl = `${baseUrl}/v2/account`;
const headers = {
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': secretKey
};

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

const checkOrders = ()=>{
    $.ajax({
        method: 'GET',
        url: ordersUrl,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns array of objects
        // console.log("Check Orders:")
        // console.log(response)
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
        return response;
    })
}

const checkPositions = ()=>{
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
            <p>Sell</p>
        </li>`
        response.forEach(function(el){
            let assetId = el.asset_id;
            let symbol = el.symbol;
            let price = el.current_price;
            let shares = el.qty;
            let profitLoss = el.unrealized_pl;
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
        })
        $('.positions-list').html(positionsHtml);
        return response;
    })
}

const checkPositionsBySymbol = (symbol)=>{
    return new Promise(resolve=>{
        if (resolve){
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
                return response
            }).catch(function(err){
                console.log(err)
                if (err.status === 404){
                    $(".status-msg").html("Position does not exist.").addClass("red-text")
                }
                return err
            })
        }
    })
}

// POST functions
const createOrder = (sym, pingOrPong)=>{
    let symbol = sym.toUpperCase();
    let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AVKey}`
    $.ajax({
        method: 'GET',
        url: url,
        contentType: 'application/json',
        dataType: 'json'
    }).then(function(response){
        console.log(response["Global Quote"]["05. price"]);
        let firstOrderPrice = response["Global Quote"]["05. price"]
        let data = {
            'symbol': symbol,
            'qty': 100,
            'side': (pingOrPong === "ping") ? "buy" : "sell",
            'type': "limit",
            'time_in_force': "gtc",
            "limit_price": firstOrderPrice
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
            pageLoad();
            sleep(1000)
            if (pingOrPong === "ping"){
                for (let x=1;x<=10;x+=1){
                    let price1 = parseFloat(firstOrderPrice);
                    price1 = price1-(0.02*x)
                    createBuyLimits(symbol, price1.toString());
                    sleep(500)
                }
            }
            if (pingOrPong === "pong"){
                for(let y=1;y<=10;y+=1){
                    let price2 = parseFloat(firstOrderPrice);
                    price2 = price2+(0.02*y)
                    createSellLimits(symbol, price2.toString())
                    sleep(500)
                }
            }
            pageLoad();
        })
        }).catch((err)=>{
            console.log(err)
            return err
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
        console.log(response)
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
    checkOrders();
    checkPositions();
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

// App logic & interaction
// create buy orders
$(document).on("click", ".new-ping", function(){
    $(".buttons").html(`
        <h2>Create a new Ping</h2>
        <label for="ping-symbol">Symbol:<br>
            <input autofocus type="text" name="ping-symbol" id="ping-symbol">
        </label> 
        <button class="submit-ping">Create</button>
        <button class="cancel-ping">Cancel</button>
    `)

    $(".submit-ping").on("click", function(){
        let symbol = $("#ping-symbol").val().toUpperCase();
        if (symbol){
            createOrder(symbol, "ping");
            $(".status-msg").html(`
                Ping Created for ${symbol}.
            `)
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping">New Ping</button>
                <button class="new-pong">New Pong</button>
                <button class="clear-pending">Clear Pending Orders</button>
            `)
        }
        else {
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping">New Ping</button>
                <button class="new-pong">New Pong</button>
                <button class="clear-pending">Clear Pending Orders</button>
            `)
            $(".status-msg").html(`
                No New Pings Created.
            `)
        }
    })

    $(".cancel-ping").on("click", function(){
        $(".buttons").html(`
            <h2>Controls</h2>
            <button class="new-ping">New Ping</button>
            <button class="new-pong">New Pong</button>
            <button class="clear-pending">Clear Pending Orders</button>
        `)
        $(".status-msg").html(`
            No New Pings Created.
        `)
    })
})

// create sell orders
$(document).on("click", ".new-pong", function(){
    $(".buttons").html(`
        <h2>Create a new Pong</h2>
        <label for="pong-symbol">Symbol:<br>
            <input autofocus type="text" name="pong-symbol" id="pong-symbol">
        </label> 
        <button class="submit-pong">Create</button>
        <button class="cancel-pong">Cancel</button>
    `)

    $(".submit-pong").on("click", function(){
        let symbol = $("#pong-symbol").val().toUpperCase();
        if (symbol){
            createOrder(symbol, "pong");
            $(".status-msg").html(`
                Pong Created for ${symbol}.
            `)
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping">New Ping</button>
                <button class="new-pong">New Pong</button>
                <button class="clear-pending">Clear Pending Orders</button>
            `)
        }
        else {
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping">New Ping</button>
                <button class="new-pong">New Pong</button>
                <button class="clear-pending">Clear Pending Orders</button>
            `)
            $(".status-msg").html(`
                No New Pongs Created.
            `)
        }
    })

    $(".cancel-pong").on("click", function(){
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping">New Ping</button>
                <button class="new-pong">New Pong</button>
                <button class="clear-pending">Clear Pending Orders</button>
            `)
            $(".status-msg").html(`
                No New Pongs Created.
            `)
    })
})

$(document).on("click", ".clear-pending", function(){
    deleteAllOrders();
    sleep(500).then(pageLoad())
})

$(document).on("click", ".menu-link", function(e){
    e.preventDefault();
    let test = e.currentTarget.className.includes("active-link");
    // console.log(test);
    if(test){return}
    else{
        $(".active-link").removeClass("active-link");
        $(e.currentTarget).addClass("active-link")
    }
    pageLoad();
})

$(document).on("click", ".refresh", function(){
    pageLoad();
})

$(document).on("click", ".position-cancel", function(e){
    let symbol = e.target.parentNode.children[0].innerText
    console.log(symbol)
    sellPositionBySymbol(symbol);
    pageLoad();
})

$(document).on("click", ".order-cancel", function(e){
    let idString = e.target.classList[1]
    let slicedId = idString.replace("id-", '')
    console.log(slicedId)
    deleteOrderById(slicedId)
    sleep(500).then(pageLoad())
})

pageLoad();