const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections') 
const functions   = require('../functions')
const moment      = require('moment')

const getDashboard = (req, res) => {
    const user = req.vertexSession.user
    functions.isAuth(user, res)

    turbo.fetch( collections.orders, { place_id: user.id, active: "true" } )
    .then(data => {
        const length = data.length
        for( let x = 0; x < length; x++ ){
            //just created as a shortcut
            data[x].start  = data[x].startCooking
            //this was a little tricky to figure out
            // sets done to true in case that data[x].start is true and doneCooking is true 
            // or in case that data[x].start is false
            // this covers the cases when the food cooking process has begun and ended and
            // for when start has already been initiated.
            if( data[x].start && data[x].doneCooking || !data[x].start ){
                data[x].done = true
            }else {
                data[x].done = false
            }
            // the remove btn only shows up when both the start and end buttons have been pressed
            data[x].remove = !(data[x].startCooking && data[x].doneCooking)
        }

        // this is used so that the ajax knows which is the oldest order so far, that way it can 
        // get older orders using ajax. So that manual page reloads wont be necessay. 
        // reloads will be set every 30sec, but that can be changed

        const orders = data.sort(function(a,b){
            return new Date(a.created_at) - new Date(b.created_at)
        })

        const oldest_created_at = orders[length-1].created_at

        res.render('dashboard/index', { orders: orders, oldest_created_at: oldest_created_at })
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

const dashBoardUpdate = (req, res) => {
    const oldest_created_at = req.body.oldest_created_at
    turbo.fetch( collections.orders, { active: true } )
    .then(data => {

        const filtered = data.filter( d => new Date(d.created_at) > new Date(oldest_created_at) )
        const length = filtered.length
        for( let x = 0; x < length; x++ ){
            filtered[x].start  = filtered[x].startCooking
            if( filtered[x].start && filtered[x].doneCooking || !filtered[x].start ){
                filtered[x].done = true
            }else {
                filtered[x].done = false
            }
            filtered[x].remove = !(filtered[x].startCooking && filtered[x].doneCooking)
        }
        if(filtered.length == 0){
            res.status(200).json({
                update: false
            })
            return
        }

        const newOrders = filtered.sort(function(a,b){
            return new Date(a.created_at) - new Date(b.created_at)
        })

        res.status(200).json({
            update: true,
            newOrders: newOrders
        })
        return
    })
    .catch(err => {
        res.status(500).json({
            errMsg: err.message
        })
        return
    })
    
}

const changeStatusOfOrder = (req, res) => {
    const body  = req.body
    const id    = body.id
    const which = body.which
    const status = {}
    
    if( which == "remove" ){
        // remove is for when the food has been cooked and given or delivered to the customer
        // sets active to false
        status.active = "false"
    }else{
        // which will be equal to "startCooking" and "doneCooking"
        status[which] = true
    }
    turbo.updateEntity( collections.orders, id, status )
    .then(data => {
        res.status(200).json({
            status: true
        })
        return
    })
    .catch(err => {
        res.status(500).json({
            errMsg: err.message,
            status: false
        })
        return
    })
}

const previousOrders = (req, res) => {
    let page
    let date
    
    if( typeof req.query.page == "undefined" || req.query.page == 1 ){
        page = 0
    }else{
        page = req.query.page - 1
    }

    if( typeof req.query.date == "undefined"  ){
        //will return all
        date = "undefined"
    }else{
        date = req.query.date
    }
    
    turbo.fetch( collections.orders, { active: "false" } )
    .then(data => {
        let filteredByDate
        if( date == "undefined" ){
            filteredByDate = data
        }else{
            filteredByDate = 
            data.filter( d => moment(d.created_at, 'YYYY-MM-DD').isBetween( moment(date,'YYYY-MM-DD').subtract(1,'days'), moment(date,'YYYY-MM-DD').add(1,'days') ) )
        }

        for( let x = 0; x < filteredByDate.length; x++ ){
            const priceOfFood = filteredByDate[x].food.qty * filteredByDate[x].food.price
            filteredByDate[x].total = parseFloat(parseFloat(Math.round(priceOfFood * 100) / 100).toFixed(2))

            filteredByDate[x].created_date = new Date( filteredByDate[x].created_at ).toString()
        }
        const orders = filteredByDate.sort(function(a,b){
            return new Date(a.created_at) - new Date(b.created_at)
        })
        
        const pageData = functions.paginationArrays(orders, 8)
        const pgLinks  = functions.pgLinks(pageData.length, page)

        const dateLink =`?date=${date}`

        if(date == "undefined"){
            res.render('dashboard/previousOrders',{ orders: pageData[page], pgLinks: pgLinks, dateLink: "" })
            return
        }

        res.render('dashboard/previousOrders',{ orders: pageData[page], pgLinks: pgLinks, dateLink: dateLink, date: date })
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

// Customer DashBoard from Here

const currentOrders = (req, res) => {
    const user = req.vertexSession.user
    turbo.fetch( collections.orders, { customer_id: user.id, active: "true" } )
    .then(data => {
        const orders = data.sort(function(a,b){
            return new Date(b.created_at) - new Date(a.created_at)
        })
        
        res.render('customerDashboard/myOrders', { orders: orders })
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

const oldCarts = (req, res) => {
    let page

    if( typeof req.query.page == "undefined" || req.query.page == 1 ){
        page = 0
    }else{
        page = req.query.page - 1
    }

    const user = req.vertexSession.user
    turbo.fetch( collections.purchase, { user_id: user.id } )
    .then(data => {

        const orders = data.sort(function(a,b){
            return new Date(b.created_at) - new Date(a.created_at)
        })
 
        for( let x = 0; x < orders.length; x++ ){
            orders[x].created_string = new Date( orders[x].created_at ).toString()
            orders[x].created_string = orders[x].created_string.split('GMT')[0]
            orders[x].stringified    = JSON.stringify( orders[x] )
        }
          
        const pageData = functions.paginationArrays(orders, 4)
        const pgLinks  = functions.pgLinks(pageData.length, page)

        res.render('customerDashboard/oldCartsList',{ purchases: pageData[page], pgLinks: pgLinks })
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

const getRestaurantProfile = (req, res) => {
    const user = req.vertexSession.user
    turbo.fetch( collections.resProfiles, { user_id: user.id } )
    .then(data => {
        data[0].imgStr = JSON.stringify( data[0].imgLink )
        const locations = constants.locations
        for( let x = 0; x < locations.length; x++ ){
            if( data[0].city == locations[x].name ){
                locations[x].class = true
            }else{
                locations[x].class = false
            }
        }
        res.render('dashboard/restaurantProfileUpdate', { profile: data[0], locations: locations })
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

const updateRestaurantProfile = (req, res) => {
    const body        = req.body
    const name        = body.name
    const description = body.description
    const imgLink     = body.imgLink
    const profileId   = body.profileId
    const city        = body.city
    const where       = body.where
    let slug          = name.split(" ").join("+")
    slug              = slug + '+' + functions.randomString(5)

    const user = req.vertexSession.user

    let profile = {
        name: name, description: description, imgLink: JSON.parse( imgLink ), user_id: user.id,
        city: city, where: where
    }

    turbo.fetch( collections.resProfiles, { user_id: user.id } )
    .then(data => {
        if(data[0].name != profile.name ){
            profile.slug = slug
        }
        return
    })
    .then( () => {
        turbo.updateEntity( collections.resProfiles, profileId , profile )
        .then(data => {
            res.redirect(`/res-${data.slug}`)
            return
        })
    })
    .catch(err => {
        req.vertexSession.msg = { 
            show: true, text: err.message , type: constants.alertTypes.danger
        }
        res.redirect('back')
        return
    })


}

module.exports = {
    getDashboard:            getDashboard,
    changeStatusOfOrder:     changeStatusOfOrder,
    dashBoardUpdate:         dashBoardUpdate,
    previousOrders:          previousOrders,
    currentOrders:           currentOrders,
    oldCarts:                oldCarts,
    getRestaurantProfile:    getRestaurantProfile,
    updateRestaurantProfile: updateRestaurantProfile
}
