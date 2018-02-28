const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections') 
const functions   = require('../functions')

 
const restaurantShow = (req, res) => {
    const slug = req.params.slug
    const user = req.vertexSession.user
    turbo.fetch( collections.resProfiles, { slug: slug } )
    .then(data => {
        return data[0]
    })
    .then( rest => {
        const description = rest.description.split('\n')
        turbo.fetch( collections.foods, {user_id: user.id} )
        .then(data => {
            const foods = data.slice(0,3)
            res.render('restaurant/show',{ profile: rest, description: description, foods: foods })
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


const restaurantList = (req, res) => {
    let page
    
    if( typeof req.query.page == "undefined" || req.query.page == 1 ){
        page = 0
    }else{
        page = req.query.page - 1
    }

    turbo.fetch( collections.resProfiles, null )
    .then(data => {
        const pageData = functions.paginationArrays(data, 8)
        const pgLinks  = functions.pgLinks(pageData.length, page)
        res.render('restaurant/list',{ profiles: pageData[page], pgLinks: pgLinks })
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




module.exports = {
    restaurantShow: restaurantShow,
    restaurantList: restaurantList
}