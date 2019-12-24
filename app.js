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
    let qty = shares.parseFloat()
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

// Event listeners

// App logic
