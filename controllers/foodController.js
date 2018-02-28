const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections') 
const functions   = require('../functions')

const createGet = (req, res) => {
    const locations = constants.locations
    res.render('food/create', { locations: locations })
}

const createPost = (req, res) => {
    const body = req.body
    const user = req.vertexSession.user
    
    //creates a unique slug for the specific product using it's name and a 5 char randomly generated
    //alphanumerical sequence. 
    let slug = body.name.split(" ").join("+")
    slug = slug+ '+' + functions.randomString(5)
    //the images are stringified on the front end, and here are parsed to turn them into javascript 
    //yet again
    const imgArr = JSON.parse(body.images)
    // creates the food object that will be added to the 'foods' collection in the data store
    // create active and inactive foods
    const newFood = {
        name: body.name, location: body.location, where: body.where, price: parseFloat(body.price),
        description: body.description, imgLink: [...imgArr], user_id: user.id, slug: slug, 
        active: true, created_at: new Date(), updated_at: new Date()
    }

    turbo.create( collections.foods, newFood )
    .then(data => {
        res.status(200).json({
            food: data
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

const editGet = (req, res) => {
    // if not admin or manager. redirect to root
    const slug = req.params.slug
    turbo.fetch( collections.foods, { slug: slug } )
    .then(data => {
        //creates images stringified array
        const imageArr = JSON.stringify(data[0].imgLink)

        const newLocations = constants.locations
        const index = newLocations.map( l => l.name ).indexOf( data[0].location )

        newLocations[index].selected = true

        res.render('food/edit',{ wine:data[0], imageArr: imageArr, locations: newLocations })
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

const editPost = (req, res) => {
    const slug = req.params.slug
    const body = req.body
    const imgArr = JSON.parse(body.images)

    turbo.fetch( collections.foods, { slug: slug } )
    .then( data => {
        const editFood = data[0]
        
        editFood.name        = body.name
        editFood.location    = body.location
        editFood.where       = body.where
        editFood.price       = parseFloat( body.price )
        editFood.description = req.body.description
        editFood.imgLink     = [ ...imgArr ] 
        editFood.updated_at  = new Date()
        
        turbo.updateEntity( collections.foods, editFood.id, editFood )
        .then( newFood => {
            res.redirect(`/food-${slug}`)
        })
        return
    })
    .catch( err => {
        req.vertexSession.msg = { 
            show: true, text: err.message , type: constants.alertTypes.danger
        }
        res.redirect('back')
        return
    })
}

const show = (req, res) => {
    const slug = req.params.slug
    turbo.fetch( collections.foods, { slug: slug } )
    .then(data => {
        const description = data[0].description.split("\n")
        res.render("food/show", { food: data[0], description: description })
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

const list = (req, res) => {
    let page
    
    if( typeof req.query.page == "undefined" || req.query.page == 1 ){
        page = 0
    }else{
        page = req.query.page - 1
    }

    turbo.fetch( collections.foods, null )
    .then(data => {
        const pageData  = functions.paginationArrays(data, 8)
        const pgLinks   = functions.pgLinks(pageData.length, page)

        res.render('food/list',{ foods: pageData[page], pgLinks: pgLinks  })
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

const myList = (req, res) => {
    const user = req.vertexSession.user
    let page
    
    if( typeof req.query.page == "undefined" || req.query.page == 1 ){
        page = 0
    }else{
        page = req.query.page - 1
    }

    turbo.fetch( collections.foods, { user_id: user.id } )
    .then(data => {
        const length = data.length
        for( let x = 0; x < length; x++ ){
            data[x].strDesc = data[x].description.substr(0,30)
        }
        const pageData = functions.paginationArrays(data, 8)
        const pgLinks  = functions.pgLinks(pageData.length, page)
        res.render('food/myFoodsList',{ foods: pageData[page], pgLinks: pgLinks })
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
    createGet:  createGet,
    createPost: createPost,
    editGet:    editGet,
    editPost:   editPost,
    show:       show,
    list:       list,
    myList:     myList
}