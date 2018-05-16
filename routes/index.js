const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const collections = require('../collections')

const staticPagesController = require('../controllers/staticPagesController')
const userController		= require('../controllers/userController')
const foodController		= require('../controllers/foodController')
const cartController		= require('../controllers/cartController')
const dashboardController   = require('../controllers/dashboardController')
const restaurantController  = require('../controllers/restaurantController')
/*  This is the home route. It renders the index.mustache page from the views directory.
	Data is rendered using the Mustache templating engine. For more
	information, view here: https://mustache.github.io/#demo */
router.get('/', staticPagesController.Home )

//user Routes
router.get('/signup',  		     userController.signUpGet     )
router.post('/signup', 		     userController.signUpPost    )
router.get('/signin',  		     userController.signInGet     )
router.post('/signin', 		     userController.signInPost    )
router.get('/signout', 		     userController.signOut       )
router.get('/profile', 		     userController.profile       )
router.post('/update-user',      userController.updateUser    )
router.get("/profile-address",   userController.profileAddress)
router.post("/new-address",      userController.newAddress    )
router.post("/update-address",    userController.updateAddress )

//create Food
router.get('/food-create',     foodController.createGet  )
router.post('/food-create',    foodController.createPost )
router.get('/food-:slug',      foodController.show       )
router.get('/foods',		   foodController.list		 )
router.get('/edit-:slug-food', foodController.editGet    )
router.post('/edit-:slug-food',foodController.editPost   )
router.get('/my-foods',		   foodController.myList     )

// Cart
router.post("/add-to-cart-:slug",   cartController.addToCart       )
router.get('/cart', 			    cartController.show            )
router.get('/removeFromCart-:slug', cartController.removeFromCart  )
router.post("/update-cart",			cartController.update 		   )
router.get("/checkout",				cartController.checkout        )
router.post("/checkout",			cartController.checkoutPost    )

// Dashboard routes
router.get('/dashboard', 		  dashboardController.getDashboard 		  )
router.post("/changeOrderStatus", dashboardController.changeStatusOfOrder )
router.post('/dashBoardUpdate',   dashboardController.dashBoardUpdate     )
router.get("/previous-orders",	  dashboardController.previousOrders	  )

// Dashboard routes for customers who buy stuff
router.get("/dashboardOrdersActive", dashboardController.currentOrders )
router.get("/dashboard-purchases",   dashboardController.oldCarts      )

// Restaurent profile
router.get("/res-profile",      dashboardController.getRestaurantProfile    )
router.post("/resProfileUpdate",dashboardController.updateRestaurantProfile )
//
router.get("/res-:slug",   restaurantController.restaurantShow )
router.get("/restaurants", restaurantController.restaurantList )


// removes the alert from the session variable
router.get("/remover-alert", (req, res) => {
	req.vertexSession.msg =  { show: false, text:'', type:'' }
	res.redirect('back')
	return
})

router.get("/reqStatus", (req, res) => {
	res.status(200).json({
		vertexSession: req.vertexSession
	})
})

router.get('/clearCart', (req, res) => {
	const cart = req.vertexSession.cart
	cart.numItems = 0
	cart.total    = 0
	cart.items    = []
	turbo.updateEntity( collections.cart, cart.id, cart )
	.then(data => {
		req.vertexSession.cart = data
		res.status(200).json({
			newCart: data
		})
		return
	})
	.catch(err => {
		res.status(500).json({
			msg: err.message
		})
		return
	})
})

router.get("/star", (req, res) => {
	res.render("star")
})

module.exports = router
