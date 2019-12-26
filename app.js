// TODO: 
// Drag and drop file uploading, monitor, 
// trade history, research, instructions for creating orders

const apiKey = keys.apiKey;
const secretKey = keys.secretKey;

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
        // id: "c523a473-763d-4fd3-b325-ac335c5ddf87"
        // client_order_id: "42c8244a-fb72-47d4-93ca-dcc4514e7128"
        // created_at: "2019-12-26T06:45:45.184363Z"
        // updated_at: "2019-12-26T06:45:45.189758Z"
        // submitted_at: "2019-12-26T06:45:45.16828Z"
        // filled_at: null
        // expired_at: null
        // canceled_at: null
        // failed_at: null
        // replaced_at: null
        // replaced_by: null
        // replaces: null
        // asset_id: "b6d1aa75-5c9c-4353-a305-9e2caa1925ab"
        // symbol: "MSFT"
        // asset_class: "us_equity"
        // qty: "10"
        // filled_qty: "0"
        // filled_avg_price: null
        // order_type: "market"
        // type: "market"
        // side: "buy"
        // time_in_force: "gtc"
        // limit_price: null
        // stop_price: null
        // status: "new"
        // extended_hours: false
        // legs: null
        // console.log("Check Orders:")
        // console.log(response)
        let ordersHtml = `
            <li class="column-headers">
                <p>Symbol</p>
                <p>Side</p>
                <p>Shares</p>
                <p>Cancel</p>
            </li>
        `
        response.forEach(function(el){
            let symbol = el.symbol;
            let side = el.side.toUpperCase();
            let qty = el.qty;
            let id = el.id;
            let htmlToAppend = `
                <li class="order">
                    <span class="order-symbol">${symbol}</span>
                    <span class="order-side">${side}</span>
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
            <p>Profit/Loss</p>
            <p>Shares</p>
            <p>Sell</p>
        </li>`
        response.forEach(function(el){
            let assetId = el.asset_id;
            let symbol = el.symbol;
            let shares = el.qty;
            let profitLoss = el.unrealized_pl;
            let htmlToAppend = `
            <li class="position">
                <span class="position-symbol">${symbol}</span>
                <span class="position-pl">${profitLoss}</span>
                <span class="position-shares">${shares}</span>
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
const createOrder = (sym)=>{
    let symbol = sym.toUpperCase();

    data = {
        'symbol': symbol,
        'qty': 100,
        'side': "buy",
        'type': "market",
        'time_in_force': "gtc"
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
        console.log("Create Orders:")
        console.log(response)
        checkOrders();
        checkPositions();
        sleep(1000).then(function(){
            checkPositionsBySymbol(symbol).then(function(response){
                console.log(response)
                for (let x=1;x<=10;x+=1){
                    let price = parseFloat(response.current_price);
                    price = price-(0.02*x)
                    createBuyLimits(symbol, price.toString());
                    sleep(500)
                    checkOrders();
                    checkPositions();
                }
                for(let y=1;y<=10;y+=1){
                    let price = parseFloat(response.current_price);
                    price = price+(0.02*y)
                    createSellLimits(symbol, price.toString())
                    sleep(500)
                    checkOrders();
                    checkPositions();
                }
            }).catch(function(err){
                console.log(err)
            });
            
        })
    })
}

const createBuyLimits = (sym, price)=>{
    let symbol = sym.toUpperCase();

    data = {
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
        checkOrders();
    })
}

const createSellLimits = (sym, price)=>{
    let symbol = sym.toUpperCase();

    data = {
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
        checkOrders();
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
        checkOrders();
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
        checkOrders();
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
        checkPositions();
        checkOrders();
    })
}

const sellPositionBySymbol = (symbol)=>{
    let data = {
        symbol
    }
    $.ajax({
        method: 'DELETE',
        url: `${ordersUrl}/${symbol}`,
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(data),
        headers: headers
    }).then(function (response){
        // returns ???
        console.log("Sell Position by ID:")
        console.log(response)
        checkPositions();
        checkOrders();
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
$(document).on("click", ".new-ping-pong", function(){
    $(".buttons").html(`
        <h2>Create a new Ping Pong</h2>
        <label for="ping-pong-symbol">Symbol:<br>
            <input type="text" name="ping-pong-symbol" id="ping-pong-symbol">
        </label> 
        <button class="submit-ping-pong">Create</button>
        <button class="cancel-ping-pong">Cancel</button>
    `)

    $(".submit-ping-pong").on("click", function(){
        let symbol = $("#ping-pong-symbol").val().toUpperCase();
        if (symbol){
            createOrder(symbol);
            $(".status-msg").html(`
                Ping Pong Created for ${symbol}.
            `)
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping-pong">New Ping Pong</button>
            `)
        }
        else {
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping-pong">New Ping Pong</button>
            `)
            $(".status-msg").html(`
                No New Ping Pongs Created.
            `)
        }
    })

    $(".cancel-ping-pong").on("click", function(){
        $("#ping-pong-symbol").val() = '';
            $(".buttons").html(`
                <h2>Controls</h2>
                <button class="new-ping-pong">New Ping Pong</button>
            `)
            $(".status-msg").html(`
                No New Ping Pongs Created.
            `)
    })
})

$(".begin-monitor").on("click", function(){
    beginMonitor();
})

$(".pause-monitor").on("click", function(){
    pauseMonitor();
})

$(document).on("click", ".menu-link", function(){
    console.log(this);
})

pageLoad();