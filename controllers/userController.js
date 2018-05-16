const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections')
const functions   = require('../functions')

const signInGet = (req ,res) => {
    res.render('user/signin')
}

const signInPost = (req, res) => {
    const credentials = { username: req.body.username, password: req.body.password }
    turbo.login(credentials)
    .then(data => {
        const canEdit = (data.role != constants.customer.seller || data.role != constants.customer.buyer)
        req.vertexSession.user = { id: data.id, username: data.username, 
            firstName: data.firstName, lastName: data.lastName, role: data.role,
            email: data.email, loggedIn: true,
            notloggedIn:false, canEdit: canEdit
        }

        turbo.fetch( collections.cart, { user_id: data.id } )
        .then(cart => {
            req.vertexSession.cart = cart[0]
            res.redirect("/")
            return
        })
        return
    })
    .catch(err => {
        req.vertexSession.msg = { 
            show: true, text: err.message , type:'danger' 
        }
        res.redirect('back')
        return
    })
}

const signUpGet = (req, res) => {
    res.render('user/signup')
}

const signUpPost = (req, res) => {
    // post request that creates a new user
    const body    = req.body
    const newUser = { username: body.username, email: body.email, password: body.password, role: body.account_type }

    turbo.createUser(newUser)
    .then(data => {
        req.vertexSession.user = data
        const cart = {
            user_id: data.id,
            items: [],
            numItems: 0,
            total: 0
        }
        const user = data
        turbo.create( collections.cart , cart )
        .then(cart => {
            req.vertexSession.cart = cart
            req.vertexSession.msg = { show: true, 
                text: "Success!!! Please complete your profile, and Add at least ONE Address",
                type:constants.alertTypes.success }
            return 
        })
        .then( () => {
            turbo.create( collections.resProfiles,   
                { name: "", description: "", imgLink: "", user_id: user.id,  city: "", where: "" })
            .then(data => {
                res.redirect("/profile")
            })
        })
        return        
    })
    .catch(err => {
        req.vertexSession.msg = { show: true, text: err.message , type:'danger' }
        res.redirect('back')
        return
    })
}

const signOut = (req, res) => {
    //resets all session data
    req.vertexSession.user = { id: '', username: '', email:'', loggedIn: false, notloggedIn: true, canEdit:false, role:'' } 
    req.vertexSession.msg  = { show: false, text:'', type:'' }
    req.vertexSession.cart = { user_id:'', items:[], total:0, numItems:0 }
    res.redirect("/")
    return
}

const profile = (req, res) => {
    const user = req.vertexSession.user
    //redirects user to root path "/" if they are not signed in
    functions.isAuth(user, res)
    res.render('user/profileShow', { user: user })
}

const updateUser = (req, res) => {
    const user    = req.vertexSession.user
    const body    = req.body
    const newUserData =  {
        firstName: body.firstName, lastName: body.lastName, username: body.username
    }
    turbo.updateUser( user.id, newUserData )
    .then(data => {
        const canEdit = (data.role != constants.customer.seller || data.role != constants.customer.buyer)
        req.vertexSession.user = { id: data.id, username: data.username, 
            firstName: data.firstName, lastName: data.lastName,
            email: data.email, loggedIn: true,
            notloggedIn:false, canEdit: canEdit
        }
        req.vertexSession.msg = { show: true, text: "The User Was Updated" , type:constants.alertTypes.success }
        res.redirect('back')
        return
    })
    .catch(err => {
        req.vertexSession.msg = { show: true, text: err.message , type: constants.alertTypes.danger }
        res.redirect('back')
        return
    })
}

const profileAddress = (req, res) => {
    const user = req.vertexSession.user
    turbo.fetch( collections.address, { user_id: user.id } )
    .then(data => {
        res.render('user/addresses',{ addresses: data })
        return
    })
    .catch(err => {
        req.vertexSession.msg = { show: true, text: err.message , type: constants.alertTypes.danger }
        res.redirect('back')
        return
    })
}

const newAddress = (req, res) => {
    const user       = req.vertexSession.user
    //redirects user to root path "/" if they are not signed in
    functions.isAuth(user, res)
    const body       = req.body
    const newAddress =  {
        name: body.name, address: body.address, user_id: user.id
    }
    turbo.create( collections.address, newAddress )
    .then(data => {
        res.redirect('back')
        return
    })
    .catch( err => {
        req.vertexSession.msg = { show: true, text: err.message , type: constants.alertTypes.danger }
        res.redirect('back')
        return
    })
}

const updateAddress = (req, res) => {
    const id             = req.body.addressId
    const updatedAddress = { name: req.body.name, address: req.body.address }
    turbo.updateEntity( collections.address, id, updatedAddress  )
    .then(data => {
        res.redirect('back')
        return
    })
    .catch( err => {
        req.vertexSession.msg = { show: true, text: err.message , type: constants.alertTypes.danger }
        res.redirect('back')
        return
    })
}

module.exports = {
    signInGet:      signInGet,
    signInPost:     signInPost,
    signUpGet:      signUpGet,
    signUpPost:     signUpPost,
    signOut:        signOut,
    profile:        profile,
    updateUser:     updateUser,
    profileAddress: profileAddress,
    newAddress:     newAddress,
    updateAddress:  updateAddress
}