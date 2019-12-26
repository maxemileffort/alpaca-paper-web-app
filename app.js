// TODO: 
// Drag and drop file uploading, monitor, 
// support for limit orders, watchlist, delete single orders/positions,
// trade history, reasearch, csv template, DL link to template,
// instructions for creating orders

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

let symbolWatchlist = []

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
                    <span class="order-cancel-${id}">X</span>
                </li>
            `
            ordersHtml = ordersHtml + htmlToAppend;
        })
        $('.orders-list').html(ordersHtml)
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
                <span class="position-cancel-${assetId}">X</span>
            </li>
            `
            positionsHtml = positionsHtml + htmlToAppend;
        })
        $('.positions-list').html(positionsHtml) 
    })
}

const checkPositionsBySymbol = (symbol)=>{
    let data = {
        'symbol': symbol.toUpperCase()
    }

    $.ajax({
        method: 'GET',
        url: `${positionsUrl}/${data.symbol}`,
        contentType: 'application/json',
        processData: false,
        headers: headers
    }).then(function (response){
        // returns object
        console.log("Check Positions by Symbol:")
        console.log(response)
    })
}

// POST functions
const createOrder = (sym, shares, side, tradeType, timeInForce)=>{
    let symbol = sym.toUpperCase();

    data = {
        'symbol': symbol,
        'qty': shares,
        'side': side,
        'type': tradeType,
        'time_in_force': timeInForce
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
        // console.log("Create Orders:")
        // console.log(response)
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

const beginMonitor = ()=>{
    console.log("Beginning monitor process!")
}

const pauseMonitor = ()=>{
    console.log("Pausing monitor process!")
}

const getWatchlistData = ()=>{
    console.log("getting watchlist data")
}

const renderWatchlist = (watchlist)=>{
    console.log('trying to render watchlist')
    watchlist.forEach(function(){
        console.log('boom')
    })
}

const addToWatchlist = (symbol)=>{
    console.log("Adding to watchlist... " + symbol)
    symbolWatchlist.push(symbol);
    console.log(symbolWatchlist)
    $("div.buttons").html(`
        <h2>Controls</h2>
        <button class="create-new-order">Create New Order</button>
        <button class="begin-monitor">Begin Monitor</button>
        <button class="add-to-watchlist">Add to Watchlist</button>
        <button class="pause-monitor">Pause Monitor</button>
        <button class="sell-all-positions">Sell All Positions</button>
        <button class="cancel-all-orders">Cancel All Orders</button>`)
}

// App logic & interaction
$(document).on("click", ".sell-all-positions", function(){
    sellAllPositions();
})

$(document).on("click", ".cancel-all-orders", function(){
    deleteAllOrders();
})

//watchlist handlers
$(document).on("click", ".add-to-watchlist", function(){
    //turn controls section into input form
    $("div.buttons").html(`
        <label for="new-wl-symbol">Symbol to watch:</label><br>
        <input id="new-wl-symbol" type="text"><br>
        <button class="new-wl-submit">Add to WL</button><br>
        <button class="cancel-add-to-wl">Cancel Add to WL</button>
    `)

    $(".new-wl-submit").on("click", function(){
        //grab desired symbol
        let symbol = $("#new-wl-symbol").val();
        //add to watchlist
        if (symbol){
            addToWatchlist(symbol)
        } else {
            //change form back to controls
            $("div.buttons").html(`
            <h2>Controls</h2>
            <button class="create-new-order">Create New Order</button>
            <button class="begin-monitor">Begin Monitor</button>
            <button class="add-to-watchlist">Add to Watchlist</button>
            <button class="pause-monitor">Pause Monitor</button>
            <button class="sell-all-positions">Sell All Positions</button>
            <button class="cancel-all-orders">Cancel All Orders</button>`)
        }
    })

    $(".cancel-add-to-wl").on("click", function(){
        //turn input form back to contols buttons
        console.log("click")
        $("div.buttons").html(`
            <h2>Controls</h2>
            <button class="create-new-order">Create New Order</button>
            <button class="begin-monitor">Begin Monitor</button>
            <button class="add-to-watchlist">Add to Watchlist</button>
            <button class="pause-monitor">Pause Monitor</button>
            <button class="sell-all-positions">Sell All Positions</button>
            <button class="cancel-all-orders">Cancel All Orders</button>`)
    })
})

//new order handlers
$(document).on("click", ".create-new-order", function(){
    //turn controls section into input form
    $("div.buttons").html(`
        <label for="new-order-symbol">Symbol:</label><br>
        <input id="new-order-symbol" type="text" value="MSFT"><br>
        <label for="new-order-shares">Shares:</label><br>
        <input id="new-order-shares" type="text" value="10"><br>
        <label for="new-order-side">Side:</label><br>
        <input id="new-order-side" type="text" value="buy"><br>
        <label for="new-order-type">Type:</label><br>
        <input id="new-order-type" type="text" value="market"><br>
        <label for="new-order-timeinforce">Time in force:</label><br>
        <input id="new-order-timeinforce" type="text" value="gtc"><br>
        <button class="new-order-submit">Create New Order</button><br>
        <button class="cancel-new-order">Cancel</button>
    `)

    $(".new-order-submit").on("click", function(){
        //grab info
        let symbol = $("#new-order-symbol").val();
        let shares = $("#new-order-shares").val();
        let side = $("#new-order-side").val();
        let type = $("#new-order-type").val();
        let timeInForce = $("#new-order-timeinforce").val();
        //create order
        if (symbol && shares && side && type && timeInForce){
            createOrder(symbol, shares, side, type, timeInForce)
            $("div.buttons").html(`
            <h2>Controls</h2>
            <button class="create-new-order">Create New Order</button>
            <button class="begin-monitor">Begin Monitor</button>
            <button class="add-to-watchlist">Add to Watchlist</button>
            <button class="pause-monitor">Pause Monitor</button>
            <button class="sell-all-positions">Sell All Positions</button>
            <button class="cancel-all-orders">Cancel All Orders</button>`)
        } else {
            //change form back to controls
            $("div.buttons").html(`
            <h2>Controls</h2>
            <button class="create-new-order">Create New Order</button>
            <button class="begin-monitor">Begin Monitor</button>
            <button class="add-to-watchlist">Add to Watchlist</button>
            <button class="pause-monitor">Pause Monitor</button>
            <button class="sell-all-positions">Sell All Positions</button>
            <button class="cancel-all-orders">Cancel All Orders</button>`)
        }
    })

    $(".cancel-new-order").on("click", function(){
        //turn input form back to contols buttons
        console.log("click")
        $("div.buttons").html(`
            <h2>Controls</h2>
            <button class="create-new-order">Create New Order</button>
            <button class="begin-monitor">Begin Monitor</button>
            <button class="add-to-watchlist">Add to Watchlist</button>
            <button class="pause-monitor">Pause Monitor</button>
            <button class="sell-all-positions">Sell All Positions</button>
            <button class="cancel-all-orders">Cancel All Orders</button>`)
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