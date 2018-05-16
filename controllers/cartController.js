const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections') 
const functions   = require('../functions')
const stripe      = require("stripe")("sk_test_PriIYXaLvWm5L0uTm8fEIr4i")

const addToCart   = (req, res) => {
    const slug = req.params.slug
    const qty  = parseInt(req.body.qty)
    
    turbo.fetch( collections.foods, { slug: slug } )
    .then(data => {
        return data[0]
    })
    .then( food => {
        const cart = req.vertexSession.cart

        const index = cart.items.map( i => i.id ).indexOf( food.id )

        if( index > -1 ){
            req.vertexSession.msg = { 
                show: true, text: "This Item Is Already In Your Cart" , type: constants.alertTypes.danger
            }
            res.redirect('back')
            return
        }

        const newFood = {
            id: food.id, name: food.name, location: food.location, where: food.where, price: food.price,
            description: food.description, imgLink: food.imgLink , user_id: food.user_id, 
            slug: food.slug, active: true, qty: qty
        }
        const priceOfFood = newFood.price * newFood.qty
        
        cart.items.push( newFood )
        cart.numItems += 1
        cart.total = parseFloat(parseFloat(Math.round(priceOfFood * 100) / 100).toFixed(2))
        return cart
    })
    .then( cart => {
        turbo.updateEntity( collections.cart, cart.id, cart )
        .then(newCart => {
            req.vertexSession.cart = newCart
            res.redirect('/cart')
            return
        })
        return
    })
    .catch(err => {
        req.vertexSession.msg = { 
            show: true, text: err.message , type: constants.alertTypes.danger
        }
        res.redirect('back')
        return
    })
}

const show = (req, res) => {
    const cart     = req.vertexSession.cart 
    const showCart = cart.items != []
    const results  = functions.findTotalAndShipping(cart) 
    res.render('cart/show', { cart: cart, showCart: showCart, 
            shipping: results.shipping, totalCost: results.totalCost })
    return
}

const removeFromCart = (req, res) => {
    const slug = req.params.slug
    const cart = Object.assign({}, req.vertexSession.cart)

    const index = cart.items.map( i => i.slug ).indexOf(slug)

    const removeItem = cart.items[index]

    cart.numItems--
    cart.total -= removeItem.price * removeItem.qty
    const newItems = cart.items.filter( i => i.id != removeItem.id )

    cart.items = newItems

    turbo.updateEntity( collections.cart, cart.id, cart )
    .then(data => {
        req.vertexSession.cart = data
        res.redirect('back')
        return
    })
    .catch(err => {
        req.vertexSession.msg = { 
            show: true, text: err.message , type: constants.alertTypes.danger
        }
        res.redirect('back')
        return
    })
}

const update = (req, res) => {
    const ids  = req.body["id[]"]
    const qtys = req.body["qty[]"]
    const cart = req.vertexSession.cart
    if( typeof qtys == "string" ){
        cart.items[0].qty = parseInt( qtys )
    }else{

        for(let x = 0; x < qtys.length ; x++ ){
            cart.items[x].qty = qtys[x]
        }
    }
    const costs       = cart.items.map( i =>  i.qty *  i.price )
    const costsTotal  = costs.reduce( ( a, b ) => a + b, 0 )
    cart.total        = costsTotal

    turbo.updateEntity( collections.cart , cart.id, cart )
    .then(data => {
        req.vertexSession.cart = cart
        res.redirect("/cart")
        return
    })
    .catch(err => {
        req.vertexSession.msg = { show: true, text: err.message , type:'danger' }
        res.redirect('back')
        return  
    })
}

const checkout = (req, res) => {
    const cart     = req.vertexSession.cart 
    //redirects user back if cart.items length is equal to Zero
    const user = req.vertexSession.user
    functions.isAuth(user, res)
    if( cart.items.length == 0 ){
        res.redirect('back')
        return
    }
    turbo.fetch( collections.address, { user_id: user.id } )
    .then(data => {
        const results  = functions.findTotalAndShipping(cart) 
        for( let x = 0; x < data.length; x++ ){
            data[x].stringify = JSON.stringify(data[x])
        }
        res.render('cart/checkout', 
            { cart: cart, shipping: results.shipping, totalCost: results.totalCost, addresses: data }
        )
        return
    })
    .catch(err => {
        req.vertexSession.msg = { show: true, text: err.message , type:'danger' }
        res.redirect('back')
        return  
    })
    
}

const checkoutPost = (req, res) => {
    const cart   = req.vertexSession.cart
    const result = functions.findTotalAndShipping(cart)
    const user   = req.vertexSession.user
    let purchaseOb = null
    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token  = req.body.stripeToken // Using Express

    // Charge the user's card:
    stripe.charges.create({
        amount: (result.totalCost * 100),
        currency: "usd",
        description: "Food!",
        source: token,
        }, 
        function(err, charge) {
        // asynchronously called
        if(err){
            //if there's an error, it returns back to the previous route with an error warning
            req.vertexSession.msg = { show: true, text: err.message , type:'danger' }
            res.redirect('back')
            return  
        }
        const purchase = {
            charge: charge,
            cart: {
                numItems: cart.numItems, items: cart.items,
                total: cart.total, user_id: cart.user_id
            },
            totalCost: result.totalCost,
            created_at: new Date(),
            updated_at: new Date(),
            user_id: user.id,
            address: JSON.parse(req.body.address),
            active: 'true'
        }
        //submits the purchase object to the turbo datastore
        turbo.create( collections.purchase , purchase )
        .then(data => {
            purchaseOb = data
            return
        })
        .then( () => {
            //deletes the old cart
            turbo.removeEntity( collections.cart , cart.id )
            .then(data => {
                return
            })
            .then(() => {
                //here each individual item is added to the orders collection where
                //the customer or place(restaurant etc) can see what's active
                const items  = cart.items
                const length = items.length
                for( let x   = 0; x < length; x++ ){
                    const order = { place_id: items[x].user_id, customer_id: user.id, 
                        purchase_id: purchaseOb.id,food: items[x], 
                        created_at: new Date(), updated_at: new Date(), active:'true',
                        address_customer: JSON.parse(req.body.address),
                        startCooking:false, doneCooking: false
                    }
                    turbo.create( collections.orders, order )
                    .then(data => {
                        return
                    })
                    .catch(err => {
                        console.log('err: ', err.message)
                        return
                    })
                }
                return
            })
            .then( () => {
                //creates a new empty cart
                const newCart = { user_id: user.id , items:[], total:0, numItems:0 }
                turbo.create( collections.cart, newCart )
                .then(data => {
                    req.vertexSession.cart = data
                    res.redirect("/")
                    return
                })
                return
            })
            return
        })
        .catch(err => {
            // if there's an error this sends the user back to the previous route along
            // with an error as to why
            req.vertexSession.msg = { show: true, text: err.message , type:'danger' }
            res.redirect('back')
            return  
        })
    })
}

module.exports = {
    addToCart:      addToCart,
    show:           show,
    removeFromCart: removeFromCart,
    update:         update,
    checkout:       checkout,
    checkoutPost:   checkoutPost
}