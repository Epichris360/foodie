const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})

// initialize app
const app = vertex.app()

// import routes
const index = require('./routes/index')
const api = require('./routes/api')

app.use(function(req,res,next){
    if(  req.vertexSession == null || req.vertexSession.user == null ){
        req.vertexSession.user = { id: '', username: '', email:'', loggedIn: false, notloggedIn: true, canEdit:false, role:'' }
        req.vertexSession.msg  = { show: false, text:'', type:'' }
        req.vertexSession.cart = { user_id:'', items:[], total:0, numItems: 0 }
    }

    res.locals.vertexSession   = req.vertexSession
    next()
})

// set routes
app.use('/', index)
app.use('/api', api) // sample API Routes


module.exports = app 