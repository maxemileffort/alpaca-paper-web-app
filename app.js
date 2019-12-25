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
        console.log(response)
    })
}

const checkOrders = ()=>{
    $.ajax({
        method: 'GET',
        url: ordersUrl,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns array
        console.log(response)
    })
}

const checkPositions = ()=>{
    $.ajax({
        method: 'GET',
        url: positionsUrl,
        contentType: 'application/json',
        headers: headers
    }).then(function (response){
        // returns array
        console.log(response)
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
        data: data,
        headers: headers
    }).then(function (response){
        // returns object
        console.log(response)
    })
}

// POST functions
const createOrder = (sym, shares, side, tradeType, timeInForce)=>{
    let symbol = sym.toUpperCase();
    let qty = shares.parseFloat();
    data = {
        symbol,
        qty,
        side,
        tradeType,
        timeInForce
    }

    $.ajax({
        method: 'POST',
        url: `${ordersUrl}`,
        contentType: 'application/json',
        processData: false,
        data: data,
        headers: headers
    }).then(function (response){
        // returns object
        console.log(response)
    })
}

// PATCH functions
const updateOrder = (orderId, sym, shares, side, tradeType, timeInForce)=>{
    let symbol = sym.toUpperCase();
    let qty = shares.parseFloat()
    data = {
        symbol,
        qty,
        side,
        tradeType,
        timeInForce
    }

    $.ajax({
        method: 'PATCH',
        url: `${ordersUrl}/${orderId}`,
        contentType: 'application/json',
        processData: false,
        data: data,
        headers: headers
    }).then(function (response){
        // returns ???
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
        console.log(response)
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
        processData: false,
        data: data,
        headers: headers
    }).then(function (response){
        // returns ???
        console.log(response)
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
        console.log(response)
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
        processData: false,
        data: data,
        headers: headers
    }).then(function (response){
        // returns ???
        console.log(response)
    })
}

// non-API functions
const beginMonitor = ()=>{
    console.log("Beginning monitor process!")
}

const pauseMonitor = ()=>{
    console.log("Pausing monitor process!")
}

const getWatchlistData = ()=>{
    
}

const renderWatchlist = (watchlist)=>{
    watchlist.forEach(function(){

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
$(".sell-all-positions").on("click", function(){
    sellAllPositions();
})

$(".cancel-all-orders").on("click", function(){
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

$(".create-new-order").on("click", function(){
    //turn controller section into input form
    //submit button or cancel button that 
    //reverts controller back to buttons

    //grab some input values

    //pass values to function
    createOrder();
})

$(".begin-monitor").on("click", function(){
    beginMonitor();
})

$(".pause-monitor").on("click", function(){
    pauseMonitor();
})

