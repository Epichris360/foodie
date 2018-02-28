
//ill only use this for the front page. this would make pagination hell
const shuffleArray = ( arr ) => {
    const newArr = arr
                    .map((a) => ({sort: Math.random(), value: a}))
                    .sort((a, b) => a.sort - b.sort)
                    .map((a) => a.value)
    return shuffle
}

const randomString = (length) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

//split array into page chunks
const paginationArrays = (arr, chunkSize) => {
    let groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
}

const pgLinks = (num, activePg) => {
    activePg++
    //8, 8
    //console.log("num: ",num,"activePg: ",activePg)
    let paginationLinks = {}
    if( num > activePg && (activePg - 1) > 0 ){
        paginationLinks.forward  = { class: '', num: activePg + 1 }
        paginationLinks.backward = { class: '', num: activePg -1 } 
    }else if( num > activePg && (activePg - 1) == 0 ){
        paginationLinks.forward  = { class: '', num: activePg + 1 }
        paginationLinks.backward = { class: 'disabled', num: '' } 
    }else if( num < activePg  ){
        paginationLinks.forward  = { class: 'disabled', num: '' }
        paginationLinks.backward = { class: '', num: activePg -1 } 
    }else if( num == activePg && num > 1 ){
        paginationLinks.forward  = { class: 'disabled', num: '' }
        paginationLinks.backward = { class: '', num: activePg -1 } 
    }else{
        paginationLinks.forward  = { class: 'disabled', num: '' }
        paginationLinks.backward = { class: 'disabled', num: '' } 
    }
    return paginationLinks
}

const findTotalAndShipping = (cart) => {
    const qtys = cart.items.map( i => parseInt(i.qty) )
    // this sums up the the array of qtys which are numbers using a reduce function 
    const sum  = qtys.reduce((a, b) => a + b, 0)

    //gets total amount of shipping cost. for concepts sake, shipping is a flat $5 per item
    const shipping = sum * 2
    // over all cost is cart.total + shipping
    const totalCost = parseFloat(cart.total) + shipping

    return {
        shipping: shipping, totalCost: totalCost
    }
}

 //to protect routes where the user must be authorized to enter
const isAuth = (user, res) => {
    if( user.id == '' ){
        res.redirect("/")
    }
    return
}

// if user is logged in it will redirect to root
// this is in case someone goes to /signin after having signed in
const isSignedIn = (user, res) => {
    if( user.id.length > 0 ){
        res.redirect("/")
    }
    return
}

//to protect routes where the user must be an admin to modify something
const isAdmin = (user, res) => {
    if(user.role == constants.customer ){
        res.redirect("/")
    }
    return
}
module.exports = {

    shuffleArray:         shuffleArray,
    randomString:         randomString,
    paginationArrays:     paginationArrays,
    pgLinks:              pgLinks,
    findTotalAndShipping: findTotalAndShipping,
    isAuth:               isAuth,
    isSignedIn:           isSignedIn,
    isAdmin:              isAdmin

}

 